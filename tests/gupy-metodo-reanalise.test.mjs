import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');

test('Guia GUPY da SOMA ganha estratégias visíveis no próprio relatório', () => {
  const ui = read('components/GupyAnalysisOutput.tsx');
  const metodo = read('components/GupyMetodologiaSoma.tsx');
  assert.match(ui, /<GupyMetodologiaSoma \/>/);
  assert.match(ui, /Hacks e práticas SOMA/);
  for (const titulo of [
    'Candidaturas com foco',
    'Likes, dislikes e histórico',
    'Título e atividades estratégicos',
    'Cursos e certificações',
    'Requisitos obrigatórios',
    'Reorganização de cadastro',
  ]) assert.ok(metodo.includes(titulo), titulo + ' não aparece no guia');
  assert.match(metodo, /três anos de experimentos/);
  assert.match(metodo, /informações de identificação verdadeiras/);
});

test('Usuário não é convidado a ver texto original e pode regenerar a partir do relatório salvo', () => {
  const ui = read('components/GupyAnalysisOutput.tsx');
  const parent = read('app/(dashboard)/gupy/GupyAuditClient.tsx');
  assert.doesNotMatch(ui, /Consultar texto original|mostrarOriginal/);
  assert.match(ui, /Gerar nova análise/);
  assert.match(parent, /\/api\/ferramentas-soma\/reanalisar-gupy/);
  assert.match(parent, /body: JSON\.stringify\(\{ analiseId: item\.id \}\)/);
  assert.match(parent, /setHistorico/);
});

test('Reanálise só consulta relatório Gupy pertencente à própria sessão', () => {
  const route = read('app/api/ferramentas-soma/reanalisar-gupy/route.ts');
  assert.match(route, /auth\.getUser\(\)/);
  assert.match(route, /soma_has_module/);
  assert.match(route, /p_slug: 'curriculo-ats'/);
  assert.match(route, /\.eq\('id', analiseId\)/);
  assert.match(route, /\.eq\('user_id', user\.id\)/);
  assert.match(route, /\.eq\('ferramenta', 'gupy'\)/);
  assert.match(route, /consumeIdentifierRateLimit/);
  assert.match(route, /user_id: user\.id/);
  assert.match(route, /analiseOrigemId: anterior\.id/);
  assert.doesNotMatch(route, /delete\(|update\(/);
});

test('Risco de falta de fontes originais é declarado; não prometer score da Gupy', () => {
  const ui = read('components/GupyAnalysisOutput.tsx');
  const route = read('app/api/ferramentas-soma/reanalisar-gupy/route.ts');
  assert.match(ui, /O currículo e as vagas completas originais não foram armazenados/);
  assert.match(route, /não foram armazenados nas análises antigas/);
  assert.match(route, /NÃO finja que realizou uma auditoria nova/);
  assert.match(route, /documentosOriginaisDisponiveis: false/);
});

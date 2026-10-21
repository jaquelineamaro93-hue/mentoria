import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = file => readFileSync(new URL('../' + file, import.meta.url), 'utf8');

test('O relatório original permanece intocado em banco e recuperável pelo usuário', () => {
  const ui = read('components/GupyAnalysisOutput.tsx');
  assert.match(ui, /const markdownExibido = mostrarOriginal \? atual\.resultado_markdown : leituraCorrigida\.texto/);
  assert.match(ui, /Consultar texto original/);
  assert.match(ui, /Voltar à leitura atualizada/);
  assert.match(ui, /copiar\(markdownExibido, 'total'\)/);
});

test('Duas afirmações legadas têm revisão explícita, não exclusão do relatório', () => {
  const helper = read('lib/gupy-report-parser.ts');
  assert.match(helper, /export function revisarOrientacoesLegadasGupy/);
  assert.match(helper, /curtidas\\\/descurtidas de perfil/);
  assert.match(helper, /automaticamente desclassificad/);
  assert.match(helper, /dislikes|Histórico de curtidas e descurtidas/);
  assert.match(helper, /Histórico de candidaturas \\(Guia GUPY da SOMA\\)/);
  assert.match(helper, /revisoes\\+\\+/);
  assert.match(helper, /return linha/);
});

test('A visão geral não cria cartão de apresentação apenas com cabeçalho', () => {
  const ui = read('components/GupyAnalysisOutput.tsx');
  const helper = read('lib/gupy-report-parser.ts');
  assert.doesNotMatch(ui, /Apresentação da análise/);
  assert.match(ui, /contextoIntroducao &&/);
  assert.match(ui, /Contexto da análise/);
  assert.match(ui, /tituloIntroducao/);
  assert.match(helper, /export function separarIntroducaoGupy/);
  assert.match(helper, /\\^#\\{1,6\\}/);
});

test('A correção não altera LinkedIn nem operações no Supabase', () => {
  const report = read('components/GupyAnalysisOutput.tsx');
  const helper = read('lib/gupy-report-parser.ts');
  assert.doesNotMatch(report, /\\.from\\(|supabase\\.from\\(|fetch\\(/);
  assert.doesNotMatch(helper, /\\.from\\(|supabase\\.|fetch\\(/);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');

test('Formulário Gupy não exige nem oferece histórico de triagem', () => {
  const ui = source('app/(dashboard)/gupy/GupyAuditClient.tsx');
  assert.match(ui, /Auditar currículo da Gupy/);
  assert.match(ui, /estimativa da SOMA para a vaga informada/);
  assert.doesNotMatch(ui, /Histórico e sinais de triagem|observacoes|setObservacoes|Aprendizados de três anos de testes/);
});

test('Prompt Gupy preserva três anos de testes e não inventa desmentidos', () => {
  const prompt = source('lib/prompts-career-tools.ts');
  assert.match(prompt, /Sinais que podem reduzir sua avaliação de aderência/);
  assert.match(prompt, /impacto qualitativo \(alto, médio, baixo\)/);
  assert.match(prompt, /Observado nos testes da metodologia SOMA/);
  assert.match(prompt, /Documentado publicamente pela Gupy/);
  assert.match(prompt, /candidaturas repetidas a vagas da mesma empresa podem gerar filtros\/bloqueios/);
  assert.match(prompt, /dislikes no histórico do perfil podem impactar oportunidades futuras/);
  assert.match(prompt, /Não reescreva, contradiga nem corrija essas observações/);
  assert.match(prompt, /Jamais invente pontos perdidos/);
});

test('A API e o prompt não coletam relatos adicionais de triagem', () => {
  const api = source('app/api/ferramentas-soma/analisar/route.ts');
  const prompt = source('lib/prompts-career-tools.ts');
  assert.doesNotMatch(api, /body\.observacoes|incluiuObservacoes/);
  assert.doesNotMatch(prompt, /input\.observacoes|observacoes\?: string|OBSERVAÇÕES DA PESSOA SOBRE PROCESSOS ANTERIORES/);
  assert.match(prompt, /resultados observados nos três anos de testes/);
});

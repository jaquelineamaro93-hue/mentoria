import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');

test('Página Gupy mostra práticas observadas separadas de critérios oficiais', () => {
  const ui = source('app/(dashboard)/gupy/GupyAuditClient.tsx');
  assert.match(ui, /Aprendizados de três anos de testes/);
  assert.match(ui, /observações práticas acumuladas em três anos/);
  assert.match(ui, /a mentora observou efeitos no histórico/i);
  assert.match(ui, /sem inventar bloqueios permanentes/);
  assert.match(ui, /estimativa da SOMA para a vaga informada/);
});

test('Relatório inclui fatores que reduzem aderência e metodologia verificável', () => {
  const prompt = source('lib/prompts-career-tools.ts');
  assert.match(prompt, /Sinais que podem reduzir sua avaliação de aderência/);
  assert.match(prompt, /impacto qualitativo \(alto, médio, baixo\)/);
  assert.match(prompt, /Documentado publicamente/);
  assert.match(prompt, /Observação prática da mentora/);
  assert.match(prompt, /Não verificável com os dados disponíveis/);
  assert.match(prompt, /sem ensinar falsificação de identificação/);
  assert.match(prompt, /Jamais invente pontos perdidos/);
  assert.doesNotMatch(ui, /bloqueio permanente|não use CPF ou identidade fictícia|Anti-Sabotagem/);
  assert.doesNotMatch(prompt, /Desaconselhe criar perfis com CPF/);
});

test('Relato é opcional, limitado e não é armazenado integralmente no histórico', () => {
  const ui = source('app/(dashboard)/gupy/GupyAuditClient.tsx');
  const api = source('app/api/ferramentas-soma/analisar/route.ts');
  assert.match(ui, /maxLength=\{1800\}/);
  assert.match(api, /observacoes: String\(body\.observacoes/);
  assert.match(api, /incluiuObservacoes: Boolean/);
  const historicos = api.split('entradasParaHistorico = {');
  const historicoGupy = historicos[2]?.split('};')[0] ?? '';
  assert.ok(historicoGupy.includes('incluiuObservacoes:'));
  assert.ok(!historicoGupy.includes('observacoes:'), 'O relato completo não deve ficar no banco de histórico');
});

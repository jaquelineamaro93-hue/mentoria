import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');

test('Página Gupy mostra práticas observadas separadas de critérios oficiais', () => {
  const ui = source('app/(dashboard)/gupy/GupyAuditClient.tsx');
  assert.match(ui, /Boas práticas de triagem/);
  assert.match(ui, /observações\s+práticas realizadas pela mentora ao longo de três anos/);
  assert.match(ui, /Não é possível afirmar que uma descurtida gera punição global permanente/);
  assert.match(ui, /não use CPF ou identidade fictícia/);
  assert.match(ui, /estimativa da SOMA para a vaga informada/);
});

test('Relatório inclui fatores que reduzem aderência e metodologia verificável', () => {
  const prompt = source('lib/prompts-career-tools.ts');
  assert.match(prompt, /Sinais que podem reduzir sua avaliação de aderência/);
  assert.match(prompt, /impacto qualitativo \(alto, médio, baixo\)/);
  assert.match(prompt, /Documentado publicamente/);
  assert.match(prompt, /Observação prática da mentora/);
  assert.match(prompt, /Não verificável com os dados disponíveis/);
  assert.match(prompt, /Desaconselhe criar perfis com CPF ou identidade fictícia/);
  assert.match(prompt, /Jamais invente pontos perdidos/);
});

test('Relato é opcional, limitado e não é armazenado integralmente no histórico', () => {
  const ui = source('app/(dashboard)/gupy/GupyAuditClient.tsx');
  const api = source('app/api/ferramentas-soma/analisar/route.ts');
  assert.match(ui, /maxLength=\{1800\}/);
  assert.match(api, /observacoes: String\(body\.observacoes/);
  assert.match(api, /incluiuObservacoes: Boolean/);
  assert.doesNotMatch(api, /entradasParaHistorico\s*=\s*\{[\s\S]*?observacoes:\s*String\(body\.observacoes/);
});

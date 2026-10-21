import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');

test('Formulário Gupy permanece útil sem caixa autoral redundante', () => {
  const ui = source('app/(dashboard)/gupy/GupyAuditClient.tsx');
  assert.match(ui, /Histórico e sinais de triagem/);
  assert.match(ui, /estimativa da SOMA para a vaga informada/);
  assert.doesNotMatch(ui, /Aprendizados de três anos de testes|Conteúdo derivado do Guia GUPY da mentora/);
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

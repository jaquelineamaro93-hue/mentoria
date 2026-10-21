import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');

function saneadorReal() {
  const src = read('lib/gupy-report-parser.ts');
  const match = src.match(/export function revisarOrientacoesLegadasGupy\(markdown: string\): \{ texto: string; revisoes: number \} \{([\s\S]*?)\n\}/);
  assert.ok(match, 'Localizar a função real de revisão Gupy');
  return new Function('markdown', match[1]);
}

test('Não converte falta de histórico informado em neutralidade ou ausência de penalidade', () => {
  const funcao = saneadorReal();
  const exemplos = [
    '**Sem histórico de rejeições/dislikes explícitos mencionados no relatório:** Assume-se neutralidade. Não há evidência de penalidade.',
    '**Sem histórico de rejeições/dislikes explícitos mencionados no relatório:**\nAssume-se neutralidade. Não há evidência de penalidade.',
    'Não há evidência de penalidade.',
    'Histórico de dislikes neutro, não há risco.',
    'Histórico limpo; não há penalidades.',
    'Não há indícios de histórico negativo do candidato.',
  ];
  for (const exemplo of exemplos) {
    const resultado = funcao(exemplo);
    assert.ok(resultado.revisoes >= 1, 'Não corrigiu: ' + exemplo);
    assert.doesNotMatch(resultado.texto, /assum[ea]-?se neutralidade|n[aã]o h[aá] evid[eê]ncia de penalidade|hist[oó]rico limpo/i);
    assert.match(resultado.texto, /Guia GUPY da SOMA/);
    assert.match(resultado.texto, /não dá acesso às avaliações internas/);
    assert.equal(funcao(resultado.texto).revisoes, 0, 'Correção não pode ser reescrita na próxima leitura');
  }
});

test('Não duplica mensagem de correção nem modifica fatos de outras partes', () => {
  const funcao = saneadorReal();
  const antigo = [
    'Aderência estimada pela SOMA: 82/100.',
    '**Sem histórico de rejeições/dislikes explícitos mencionados no relatório:**',
    'Assume-se neutralidade. Não há evidência de penalidade.',
    'Requisito faltante: Excel avançado não mencionado.',
  ].join('\n');
  const alterado = funcao(antigo);
  assert.equal((alterado.texto.match(/Histórico de candidaturas e dislikes \(metodologia SOMA\)/g) || []).length, 1);
  assert.match(alterado.texto, /82\/100/);
  assert.match(alterado.texto, /Excel avançado não mencionado/);
  const correto = 'Nos testes do Guia GUPY da SOMA, o histórico de dislikes pode impactar futuras oportunidades.';
  assert.deepEqual(funcao(correto), { texto: correto, revisoes: 0 });
});

test('Gupy não infere histórico individual nos prompts de avaliação ou reanálise', () => {
  const prompt = read('lib/prompts-career-tools.ts');
  const reanalise = read('app/api/ferramentas-soma/reanalisar-gupy/route.ts');
  assert.match(prompt, /estado individual de rejeições, likes\/dislikes, avaliações e filtros é NÃO VERIFICÁVEL/);
  assert.match(prompt, /Ausência de dados da dimensão \(4\) NUNCA reduz o nível de risco/);
  assert.match(reanalise, /REGRA SOBRE AUSÊNCIA DE HISTÓRICO/);
  assert.match(reanalise, /não há evidência de penalidade/i);
});

test('Somente a geração Gupy aplica o saneamento; LinkedIn e cenário são preservados', () => {
  const api = read('app/api/ferramentas-soma/analisar/route.ts');
  const reanalise = read('app/api/ferramentas-soma/reanalisar-gupy/route.ts');
  assert.match(api, /ferramenta === 'gupy'\s*\?\s*revisarOrientacoesLegadasGupy\(gerado\)\.texto\s*:\s*gerado/);
  assert.match(reanalise, /revisarOrientacoesLegadasGupy\(gerado\)\.texto/);
  assert.match(api, /resultado_markdown: resultado/);
  assert.doesNotMatch(api, /update\(|delete\(/);
});

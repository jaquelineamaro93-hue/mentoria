import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { recuperarTextoLivreIris } from '../lib/iris-ai-response.ts';

const source = path => readFileSync(new URL('../'+path, import.meta.url), 'utf8');

test('Íris aproveita a resposta natural do print sem cobrar outra chamada', () => {
  const fala = 'Oi! Legal, vamos organizar seu próximo passo.\n\n**Primeiro:** escolha duas funções-alvo.\n\n- Revise seu currículo\n- Busque evidências reais';
  assert.deepEqual(recuperarTextoLivreIris(fala), { resposta: fala });
});

test('Permanece o Markdown de parágrafos e listas em português brasileiro', () => {
  const fala = 'Sua experiência já traz pontos fortes.\n\n**Minha sugestão**\n\n1. Escolha o objetivo\n2. Prepare uma evidência concreta';
  assert.equal(recuperarTextoLivreIris(fala)?.resposta, fala);
  assert.equal(recuperarTextoLivreIris('  Claro, podemos avançar.  ')?.resposta, 'Claro, podemos avançar.');
});

test('Não converte JSON incompleto nem payload estruturado inválido em aconselhamento', () => {
  const fence = String.fromCharCode(96,96,96);
  for (const input of [
    '{"resposta": "faltou uma chave"',
    '[{"titulo": "não aceitar"',
    fence + 'json\n{"resposta":"algo"}\n' + fence,
    '<html>503 Service Unavailable</html>',
    '<script>alert(1)</script>',
    ' ',
    '',
    'a'.repeat(2201),
  ]) {
    assert.equal(recuperarTextoLivreIris(input), null, 'Aceitou payload inválido: ' + input.slice(0, 26));
  }
});

test('Fallback é exclusivamente conversacional, PDI e plano mantêm JSON obrigatório', () => {
  const helper = source('lib/ai-json.ts');
  const api = source('app/api/copiloto/route.ts');
  const plano = source('app/api/copiloto/plano-acoes/route.ts');
  assert.match(helper, /recuperarTextoLivre\?: \(texto: string\) => T \| null/);
  assert.match(helper, /const recuperada = recuperarSePermitido\(primeiraResposta, options\)/);
  assert.match(helper, /if \(recuperada !== null\) return recuperada/);
  assert.match(api, /recuperarTextoLivre: recuperarTextoLivreIris/);
  assert.match(api, /const gerada = await chamarClaudeJson<Proposta>\(prompt/);
  assert.doesNotMatch(plano, /recuperarTextoLivre/);
  const inicioPDI = api.indexOf('const gerada = await chamarClaudeJson<Proposta>');
  const inicioConversa = api.indexOf('const ia = await chamarClaudeJson<RespostaIA>');
  assert.ok(inicioPDI !== -1 && inicioConversa > inicioPDI);
  assert.doesNotMatch(api.slice(inicioPDI, inicioConversa), /recuperarTextoLivre:/);
});

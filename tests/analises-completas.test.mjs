import test from 'node:test';
import assert from 'node:assert/strict';
import { chamarClaude } from '../lib/anthropic.ts';

async function comRespostas(respostas, executar) {
  const fetchOriginal = globalThis.fetch;
  const chaveOriginal = process.env.ANTHROPIC_API_KEY;
  process.env.ANTHROPIC_API_KEY = 'test-key';
  const chamadas = [];
  globalThis.fetch = async (_url, init) => {
    chamadas.push(JSON.parse(init.body));
    return Response.json(respostas.shift());
  };
  try { await executar(chamadas); }
  finally {
    globalThis.fetch = fetchOriginal;
    if (chaveOriginal === undefined) delete process.env.ANTHROPIC_API_KEY;
    else process.env.ANTHROPIC_API_KEY = chaveOriginal;
  }
}

test('preserva todos os blocos e o fim do texto longo', async () => {
  const longo = 'experiência '.repeat(3000) + 'FIM COMPLETO';
  await comRespostas([{ stop_reason: 'end_turn', content: [{type:'text',text:'Início\n'}, {type:'text',text:longo}] }], async () => {
    assert.equal(await chamarClaude('teste', 8000, { exigirCompleta: true }), 'Início\n' + longo);
  });
});

test('refaz resposta truncada com mais espaço, sem concatenar relatório parcial', async () => {
  await comRespostas([
    {stop_reason:'max_tokens',content:[{type:'text',text:'trecho cort'}]},
    {stop_reason:'end_turn',content:[{type:'text',text:'Relatório completo.'}]},
  ], async chamadas => {
    assert.equal(await chamarClaude('teste', 8000, { exigirCompleta:true }), 'Relatório completo.');
    assert.deepEqual(chamadas.map(c => c.max_tokens), [8000,16000]);
  });
});

test('não retorna sucesso se as duas respostas forem interrompidas', async () => {
  await comRespostas(Array.from({length:2}, () => ({stop_reason:'max_tokens',content:[{type:'text',text:'parcial'}]})), async chamadas => {
    await assert.rejects(chamarClaude('teste', 8000, {exigirCompleta:true}), /incompleta e não foi salva/);
    assert.equal(chamadas.length,2);
  });
});

test('rejeita recusa e resposta vazia, sem repetir a chamada', async () => {
  for (const resposta of [{stop_reason:'refusal',content:[{type:'text',text:'Não posso'}]}, {stop_reason:'end_turn',content:[]}]) {
    await comRespostas([resposta], async chamadas => {
      await assert.rejects(chamarClaude('teste',8000,{exigirCompleta:true}));
      assert.equal(chamadas.length,1);
    });
  }
});

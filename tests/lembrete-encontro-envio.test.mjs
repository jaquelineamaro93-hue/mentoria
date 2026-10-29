import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';

async function executar({ enviado = true, erroConsulta = false, jaEnviado = false } = {}) {
  const registros = [], datas = [];
  let envios = 0;
  const perfil = { id:'p1',nome:'Teste',email:'teste@example.com',status_assinatura:'ativo',tipo_pacote:'online',onboarding_concluido:true,last_activity_at:new Date().toISOString() };
  const evento = { id:'e1',titulo:'Live',data_evento:'2026-10-30T15:00:00Z' };
  const db = { from(tabela) {
    const q = {
      select() { return q; }, eq() { return q; }, or() { return q; }, gte() { return q; }, lte() { return q; }, order() { return q; }, limit() { return q; },
      maybeSingle: async () => ({ data:null, error:null }),
      insert: async dados => { registros.push(dados); return { error:null }; },
      then(resolve) { return Promise.resolve({
        data: tabela === 'profiles' ? [perfil] : tabela === 'announcements' ? [evento] : tabela === 'emails_enviados' && jaEnviado ? [{user_id:'p1'}] : [],
        error: tabela === 'emails_enviados' && erroConsulta ? {message:'falha'} : null,
      }).then(resolve); },
    };
    return q;
  } };
  const fonte = ts.transpileModule(readFileSync(new URL('../lib/lembretes.ts', import.meta.url),'utf8'), { compilerOptions:{ module:ts.ModuleKind.CommonJS, target:ts.ScriptTarget.ES2022 } }).outputText;
  const modulo = { exports:{} };
  const email = { enviarEmail: async () => { envios++; return enviado; }, templateLembreteEncontro: (_nome,_titulo,data) => {datas.push(data);return data;} };
  new Function('require','module','exports',fonte)(nome => nome.includes('supabase/admin') ? {createAdminClient:()=>db} : email, modulo, modulo.exports);
  const resultado = await modulo.exports.executarLembretes();
  return { resultado,registros,datas,envios };
}

test('rejeição do provedor não marca lembrete como enviado', async () => {
  const {resultado,registros,envios} = await executar({enviado:false});
  assert.equal(envios,1);
  assert.equal(resultado.encontros,0);
  assert.equal(registros.length,0);
  assert.equal(resultado.erros.length,1);
});
test('sucesso registra lembrete e usa horário de Brasília', async () => {
  const {resultado,registros,datas} = await executar();
  assert.equal(resultado.encontros,1);
  assert.equal(registros[0].referencia_id,'e1');
  assert.match(datas[0], /12:00:00.*horário de Brasília/);
});
test('erro de consulta e envio anterior impedem novo disparo', async () => {
  for (const opcoes of [{erroConsulta:true},{jaEnviado:true}]) {
    const {envios,registros} = await executar(opcoes);
    assert.equal(envios,0);
    assert.equal(registros.length,0);
  }
});

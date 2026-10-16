const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const ts=require('typescript');
const code=ts.transpileModule(fs.readFileSync('lib/topsend.ts','utf8'),{
  compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}
}).outputText;
const vars={}, requests=[];
const context={
  exports:{},process:{env:vars},URL,Date,console,
  AbortSignal,
  require:(id)=>{
    if(id==='@/lib/supabase/admin')return {createAdminClient:()=>({})};
    throw Error('Unexpected import '+id);
  },
  fetch:async(url,options)=>{requests.push({url:String(url),options});return {ok:true,status:200};}
};
vm.runInNewContext(code,context);
const tsend=context.exports;
(async()=>{
  const sample={
    id:'ee58c578-2d42-4820-9a84-8d199c6e4764',
    user_id:'00112233-0011-4011-8011-001122334455',
    origem_id:'manual-rascunho-iris-20261015-teste',
    status:'revisao',resposta_gerada:'Qual ação você já colocou em prática esta semana?',
    insight:'Objetivo anotado',proximo_passo:'Selecionar vagas',
  };
  const database={
    from:(name)=>{
      const q={
        select:()=>q,eq:()=>q,order:()=>q,limit:()=>q,
        maybeSingle:async()=>({data:
          name==='profiles'?{id:sample.user_id,nome:'Tais Teste',whatsapp_numero:'5511999999999',
            whatsapp_consentimento_em:'2026-10-15T11:00:00Z',iris_ia_consentimento_em:'2026-10-15T11:00:00Z',
            is_admin:false,status_assinatura:'ativo',trial_status:null}:
          name==='iris_estado'?{pausado:false}:
          name==='topsend_eventos_recebidos'?{recebido_em:new Date(Date.now()-60000).toISOString()}:null,
          error:null}),
        insert:async()=>({error:null}),
        update:()=>q,
      };
      return q;
    },
  };
  assert.equal(tsend.topsendConfigurado(),false);
  assert.equal(tsend.topsendRetornoConfigurado(),false);
  await assert.rejects(tsend.dispararTurnoTopSend(database,sample),/não configurado/);
  assert.equal(requests.length,0);
  Object.assign(vars,{TOPSEND_AUTOMATION_ENABLED:'true',
    TOPSEND_AUTOMATION_WEBHOOK_URL:'https://attacker.example/webhook'});
  assert.equal(tsend.topsendConfigurado(),true);
  await assert.rejects(tsend.dispararTurnoTopSend(database,sample),/domínio HTTPS oficial/);
  assert.equal(requests.length,0);
  vars.TOPSEND_AUTOMATION_WEBHOOK_URL='http://hub.topsend.io/test';
  await assert.rejects(tsend.dispararTurnoTopSend(database,sample),/domínio HTTPS oficial/);
  vars.TOPSEND_AUTOMATION_WEBHOOK_URL='https://hub.topsend.io/webhook/automacao-simulada';
  const t=await tsend.ultimaEntradaWhatsApp(database,sample.user_id);
  assert.ok(t);
  const valid=await tsend.validarEnvioTopSend(database,sample);
  assert.equal(valid.nome,'Tais');
  assert.equal(valid.telefone,'5511999999999');
  assert.ok(!valid.mensagem.includes('Teste'));
  console.log('TopSend adapter: activation, domain validation, reply window and consent checked with mocks.');
})().catch(e=>{console.error(e);process.exitCode=1;});

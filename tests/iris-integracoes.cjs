const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const vm = require('node:vm');
const src = ts.transpileModule(fs.readFileSync('lib/iris-integracoes.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const requests = [];
let answer = { ok:true, json:async()=>({ok:true, agent:{id:'iris-id',task_id:'iris-task'}}) };
const env = {};
const context = {
  exports: {}, process: {env}, URL, AbortSignal, console,
  require: (path) => {
    assert.equal(path, './ai-json');
    return { parseJsonDaIA: JSON.parse };
  },
  fetch: async (url, options) => {
    requests.push({url:String(url), options});
    return answer;
  },
};
vm.runInNewContext(src, context);
const client = context.exports;
(async () => {
  assert.equal(client.irisAutomacaoConfigurada(), false);
  const safely = client.anonimizarContextoIris('Meu CPF 123.456.789-00, 11999999999 e teste@email.com');
  assert.ok(!safely.includes('123.456'));
  assert.ok(!safely.includes('teste@email.com'));
  const prompt=client.instrucoesDaIris('SOMA_abcd',['Fui promovida'], 'Crescer','Conversar com gestor');
  assert.ok(prompt.includes('SOMA_abcd'));
  assert.ok(prompt.includes('Fui promovida'));
  assert.ok(!prompt.includes('Outra pessoa'));
  const tid=await client.obterTarefaDaIris('fake-test-key','iris-id');
  assert.equal(tid,'iris-task');
  assert.equal(requests.at(-1).url,'https://api.manus.ai/v2/agent.detail?agent_id=iris-id');
  answer={ok:true,json:async()=>({ok:true})};
  await client.enviarParaIris('fake-test-key','iris-task','Somente um exemplo');
  assert.equal(JSON.parse(requests.at(-1).options.body).task_id,'iris-task');
  answer={ok:true,json:async()=>({ok:true,messages:[
    {type:'assistant_message',timestamp:Date.now(),assistant_message:{content:JSON.stringify({
      marcador:'SOMA_abcd',mensagem:'Qual ação você gostaria de experimentar esta semana?',
      insight:'A pessoa relatou novo objetivo.',proximo_passo:'Definir uma ação',encaminhar_humano:false,
    })}},
  ]})};
  const saida=await client.consultarRespostaIris('fake-test-key','iris-task','SOMA_abcd',new Date(Date.now()-500).toISOString());
  assert.equal(saida.proximo_passo,'Definir uma ação');
  assert.equal(await client.consultarRespostaIris('fake-test-key','iris-task','SOMA_outra',new Date(Date.now()-500).toISOString()),null);
  await assert.rejects(client.enviarWhatsAppTexto('5511999999999','teste'),/não configurado/);
  Object.assign(env,{IRIS_AUTOMATION_ENABLED:'true',MANUS_API_KEY:'test',MANUS_AGENT_ID:'iris-id',
    WHATSAPP_ACCESS_TOKEN:'fake',WHATSAPP_PHONE_NUMBER_ID:'phoneid',
    WHATSAPP_APP_SECRET:'secret',WHATSAPP_VERIFY_TOKEN:'verify'});
  assert.equal(client.irisAutomacaoConfigurada(),true);
  answer={ok:true,json:async()=>({messages:[{id:'wamid.123'}]})};
  const id=await client.enviarWhatsAppTexto('5511999999999','Mensagem de teste');
  assert.equal(id,'wamid.123');
  assert.ok(requests.at(-1).url.includes('graph.facebook.com'));
  assert.equal(JSON.parse(requests.at(-1).options.body).to,'5511999999999');
  console.log('Iris integrations: 10 checks passed (fully mocked, no real sends).');
})().catch(error=>{console.error(error);process.exitCode=1});

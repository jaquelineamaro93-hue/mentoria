const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const ts=require('typescript');
const script=ts.transpileModule(fs.readFileSync('app/(dashboard)/admin/acompanhamentos/TopSendImportador.tsx','utf8'),{
  compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}
}).outputText;
const sandbox={
  exports:{},console,Date,Intl,Set,
  require:(id)=>{
    if(id==='react')return {useMemo:()=>null,useState:()=>null};
    if(id==='lucide-react')return {};
    if(id==='react/jsx-runtime')return {jsx(){},jsxs(){}};
    throw Error('Unexpected import: '+id);
  },
};
vm.runInNewContext(script,sandbox);
const parse=sandbox.exports.interpretarHistoricoTopSend;
assert.equal(typeof parse,'function');

const texto=[
  '[16/10/2026, 16:47:39] Fernanda: ouvi algumas pessoas falando que tinha potencial a ser sênior',
  '[16/10/2026, 16:48:09] Íris: Que experiência sua demonstra esse potencial?',
].join('\n');
let result=parse(texto,'Fernanda Atayde Barboza','entrada','');
assert.equal(result.erro,'');
assert.equal(result.desconhecidos.length,0);
assert.equal(result.mensagens.length,2);
assert.equal(result.mensagens[0].direcao,'entrada');
assert.equal(result.mensagens[1].direcao,'saida');
assert.equal(result.mensagens[0].ocorridoEm,'2026-10-16T19:47:39.000Z');

result=parse('16/10/2026, 16:41 - Tais Yumi: Conectar com pessoas de CRM\n16/10/2026, 16:42 - Íris: Que tal escolher duas?', 'Tais Yumi Mizoguchi','entrada','');
assert.equal(result.mensagens.length,2);
assert.equal(result.mensagens[0].direcao,'entrada');
assert.equal(result.mensagens[1].direcao,'saida');

result=parse('M: Quero me candidatar\nI: Qual vaga você escolheu?', 'Tais Yumi Mizoguchi','entrada','2026-10-16T16:45');
assert.equal(result.mensagens.length,2);
assert.equal(result.mensagens[0].direcao,'entrada');
assert.equal(result.mensagens[1].direcao,'saida');

result=parse('[16/10/2026, 16:47] Pessoa desconhecida: oi','Tais Yumi Mizoguchi','entrada','');
assert.equal(result.desconhecidos.length,1);
result=parse('texto sem horario','Tais Yumi Mizoguchi','entrada','');
assert.match(result.erro,/data e hora/i);
result=parse('I: Oi','Tais Yumi Mizoguchi','entrada','2026-99-99T16:45');
assert.match(result.erro,/data e hora/i);
console.log('TopSend historical transcript parser tests passed.');

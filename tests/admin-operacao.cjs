const fs = require('node:fs'), ts = require('typescript'), assert = require('node:assert/strict'), Module = require('node:module');
const base = require('node:path').resolve(__dirname, '..');
let slots = [], index = 0;
const react = { useState(initial) { const i = index++; if (!(i in slots)) slots[i] = typeof initial === 'function' ? initial() : initial; return [slots[i], v => { slots[i] = typeof v === 'function' ? v(slots[i]) : v; }]; }, useEffect() {} };
function compile(path) {
  const m = new Module(path); m.filename = path; m.paths = module.paths;
  m.require = name => name === 'react' ? react : name === 'react/jsx-runtime' ? require(name) : name === '@/lib/supabase/client' ? { createClient: () => ({}) } : name === '@/lib/posthog' ? { posthog: { capture() {} } } : name === 'lucide-react' ? new Proxy({}, { get: (_, k) => k }) : () => null;
  m._compile(ts.transpileModule(fs.readFileSync(path, 'utf8'), { compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, esModuleInterop: true } }).outputText, path);
  return m.exports;
}
function nodes(n) { return !n || typeof n !== 'object' ? [] : [n, ...[n.props?.children].flat(Infinity).flatMap(nodes)]; }
function text(n) { if (Array.isArray(n)) return n.map(text).join(''); return n && typeof n === 'object' ? text(n.props?.children) : String(n ?? ''); }
const Admin = compile(base + '/app/(dashboard)/admin/AdminClient.tsx').default;
const row = (id, name, confirmed, onboarding) => ({ profile: { id, nome: name, email: id+'@example.invalid', onboarding_concluido: onboarding, last_activity_at: null, pontos_total: 0 }, emailConfirmado: confirmed, diagnosticos: 0, anotacoesDiario: 0, blocosQuemSouEu: 0, secoesPdi: 0, fezVia: false });
const props = { linhas: [row('a','Ágata Teste',false,false),row('b','Bruna Teste',true,true)], totalBlocosQuemSouEu: 4,totalSecoesPdi: 5 };
const render = () => { index = 0; return Admin(props); };
let tree = render();
assert.equal(nodes(tree).filter(n => n.type === 'details' && ['a','b'].includes(n.key)).length, 2);
assert.equal(nodes(tree).filter(n => n.type === 'button' && text(n) === 'Gerar link de senha').length, 2);
nodes(tree).find(n => n.type === 'button' && text(n).includes('E-mail não confirmado')).props.onClick();
tree = render(); assert.equal(nodes(tree).filter(n => n.type === 'details' && ['a','b'].includes(n.key)).length,1);
nodes(tree).find(n => n.type === 'input').props.onChange({ target: { value:'agata' } }); tree=render(); assert(text(tree).includes('Ágata Teste'));
console.log('PASS one row per person, actions retained, email filter and accent-insensitive search');
slots = [];
const statusRow = (id, status, trial, end) => ({ ...row(id, id, true, true), profile: { ...row(id, id, true, true).profile, status_assinatura: status, trial_status: trial, trial_ends_at: end } });
props.linhas = [statusRow('trial','trial','active','2999-01-01'), statusRow('expired','trial','active','2000-01-01'), statusRow('closed','encerrado'), statusRow('debt','inadimplente'), statusRow('paid','ativo','expired','2000-01-01')];
tree = render();
for (const [label, count, ids] of [['Em teste (trial)',1,['trial']],['Encerrados',2,['expired','closed']],['Inadimplentes',1,['debt']]]) {
  const button = nodes(tree).find(n => n.type === 'button' && text(n) === String(count)+label);
  assert(button, label + ' count'); button.props.onClick(); tree=render();
  assert.deepEqual(nodes(tree).filter(n=>n.type==='details' && n.key).map(n=>n.key),ids);
}
console.log('PASS trial, expired, closed and overdue filters use account status, not activity; converted paid accounts stay out of expired');
(async () => {
  slots=[]; const Users=compile(base+'/app/(dashboard)/admin/usuarios/UsuariosClient.tsx').UsuariosClient;
  const renderUsers=()=>{ index=0; return Users(); };
  renderUsers(); slots[0]=[{id:'a',nome:'Teste',email:'a@example.invalid',is_admin:false,onboarding_concluido:true}]; slots[1]=false;
  let request;
  global.fetch=async(url,opts)=>{request={url,...opts};return {ok:false,json:async()=>({error:'Acesso negado'})};};
  let t=renderUsers(); await nodes(t).find(n=>n.props?.['aria-label']==='Alterar papel de Teste').props.onClick();
  assert.equal(request.url,'/api/admin/usuarios');assert.deepEqual(JSON.parse(request.body),{userId:'a',is_admin:true});assert.equal(slots[0][0].is_admin,false);assert.equal(slots[3],'Acesso negado');
  global.fetch=async()=>({ok:true,json:async()=>[{id:'a',is_admin:true}]});
  t=renderUsers();await nodes(t).find(n=>n.props?.['aria-label']==='Alterar papel de Teste').props.onClick();assert.equal(slots[0][0].is_admin,true);
  console.log('PASS role API receives target ID and only updates UI after successful authorization');
})().catch(e=>{console.error(e);process.exitCode=1;});

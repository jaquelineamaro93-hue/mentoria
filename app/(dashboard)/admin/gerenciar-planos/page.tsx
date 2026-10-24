import AdminContractRegister from '@/components/AdminContractRegister';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import GerenciarPlanosClient from './GerenciarPlanosClient';

export default async function GerenciarPlanosPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: perfilAdmin } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single();

  if (!perfilAdmin?.is_admin) redirect('/dashboard');

  const { data: mentorados } = await supabase
    .from('profiles')
    .select('*')
    .order('nome', { ascending: true });

  const { data: planos } = await supabase
    .from('planos_mentoria')
    .select('*')
    .eq('ativo', true)
    .order('duracao_meses', { ascending: true });

  const admin=createAdminClient();
  const [signed,orders,purchases,versions]=await Promise.all([
    admin.from('termos_aceites').select('id,user_id,aceito_em,termos_versoes(versao,conteudo_markdown)').order('aceito_em',{ascending:false}),
    admin.from('soma_module_orders').select('id,user_id,plan_code,terms_version,terms_accepted_at,amount,intro_amount,status').not('plan_code','is',null).order('created_at',{ascending:false}),
    admin.from('mp_pedidos').select('id,user_id,tipo,terms_version,terms_accepted_at,valor,status').not('terms_version','is',null).order('created_at',{ascending:false}),
    admin.from('product_contract_versions').select('version,content_markdown'),
  ]);
  const names=new Map((mentorados||[]).map(p=>[p.id,`${p.nome||'Sem nome'} · ${p.email}`]));
  const docs=new Map((versions.data||[]).map(v=>[v.version,v.content_markdown]));
  const entries=[
    ...(signed.data||[]).map(a=>{const doc=Array.isArray(a.termos_versoes)?a.termos_versoes[0]:a.termos_versoes;return {id:a.id,person:names.get(a.user_id)||'Conta anterior',product:'SOMA Carreira',version:doc?.versao||null,acceptedAt:a.aceito_em,amount:null,status:'Aceite registrado',markdown:doc?.conteudo_markdown};}),
    ...(orders.data||[]).map(o=>({id:o.id,person:names.get(o.user_id)||'Conta anterior',product:'SOMA Plataforma · '+o.plan_code,version:o.terms_version,acceptedAt:o.terms_accepted_at,amount:Number(o.amount),introAmount:o.intro_amount!==null?Number(o.intro_amount):null,status:o.status==='ACTIVE'?'Pagamento aprovado':'Aceite registrado; consultar pagamento',markdown:docs.get(o.terms_version)||null})),
    ...(purchases.data||[]).map(o=>({id:o.id,person:names.get(o.user_id)||'Conta anterior',product:o.tipo==='plano'?'SOMA Carreira':'Compra adicional',version:o.terms_version,acceptedAt:o.terms_accepted_at,amount:Number(o.valor),status:o.status==='approved'?'Pagamento aprovado':'Aceite registrado; consultar pagamento',markdown:docs.get(o.terms_version)||null})),
  ];
  return <>
    {signed.error||orders.error||purchases.error||versions.error?<p className="mb-5 rounded-xl border p-4 text-black">Não foi possível consultar os aceites. Atualize a página para tentar novamente.</p>:<AdminContractRegister entries={entries}/>}
    <GerenciarPlanosClient mentorados={mentorados||[]} planos={planos||[]}/>
  </>;
}

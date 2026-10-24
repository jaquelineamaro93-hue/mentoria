import ContractRecords from '@/components/ContractRecords';
import ProductContractDocument from '@/components/ProductContractDocument';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import TermosClient from './TermosClient';
import type { Profile, TermoVersao } from '@/lib/types';

export default async function TermosPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single<Profile>();

  const { data: termo } = await supabase
    .from('termos_versoes')
    .select('*')
    .eq('ativo', true)
    .order('publicado_em', { ascending: false })
    .limit(1)
    .single<TermoVersao>();

  const { data: aceite } = await supabase
    .from('termos_aceites')
    .select('aceito_em')
    .eq('user_id', user.id)
    .eq('termo_id', termo?.id ?? '')
    .maybeSingle();

  const {data:access}=await supabase.rpc('soma_saas_state');
  const [oldAccepts,orders,purchases,versions,account,catalogue]=await Promise.all([
    supabase.from('termos_aceites').select('id,aceito_em,termos_versoes(versao,titulo,conteudo_markdown)').eq('user_id',user.id).order('aceito_em',{ascending:false}),
    supabase.from('soma_module_orders').select('id,plan_code,modules,iris,whatsapp,amount,intro_amount,terms_version,terms_accepted_at,status').eq('user_id',user.id).not('plan_code','is',null).order('created_at',{ascending:false}),
    supabase.from('mp_pedidos').select('id,tipo,valor,status,contract_snapshot,terms_version,terms_accepted_at').eq('user_id',user.id).order('created_at',{ascending:false}).limit(100),
    supabase.from('product_contract_versions').select('version,content_markdown'),
    supabase.from('soma_saas_accounts').select('terms_version,terms_accepted_at,trial_started_at').eq('user_id',user.id).maybeSingle(),
    supabase.from('soma_modules').select('slug,title'),
  ]);
  if(oldAccepts.error||orders.error||purchases.error||versions.error||account.error||catalogue.error) return <p className="p-6 text-black">Não foi possível consultar seus contratos. Tente novamente em alguns instantes.</p>;
  const documents=new Map((versions.data||[]).map(v=>[v.version,v.content_markdown]));
  const moduleNames=new Map((catalogue.data||[]).map(m=>[m.slug,m.title]));
  const statuses:Record<string,string>={PENDING:'Pagamento pendente',AUTHORIZED:'Aguardando pagamento',ACTIVE:'Ativa',CANCELED:'Cancelada',PAST_DUE:'Pagamento pendente',EXPIRED:'Encerrada',pending:'Pagamento pendente',approved:'Pagamento aprovado',refunded:'Estornada',charged_back:'Contestada'};
  const receipts=[
    ...(oldAccepts.data||[]).map(a=>{const doc=Array.isArray(a.termos_versoes)?a.termos_versoes[0]:a.termos_versoes;return {id:a.id,product:'SOMA Carreira',version:doc?.versao||null,acceptedAt:a.aceito_em,amount:null,status:'Aceite registrado',markdown:doc?.conteudo_markdown};}),
    ...(orders.data||[]).map(o=>({id:o.id,product:'SOMA Plataforma · '+({avulso:'Módulo avulso',essencial:'Essencial',pro:'Pro'}[o.plan_code as 'avulso'|'essencial'|'pro']),details:`Ferramentas: ${(o.modules||[]).map((m:string)=>moduleNames.get(m)||'Ferramenta contratada').join(', ')}. Agentes: ${o.iris?'Íris':''}${o.iris&&o.whatsapp?' e ':''}${o.whatsapp?'WhatsApp':''}${!o.iris&&!o.whatsapp?'nenhum':''}.`,version:o.terms_version,acceptedAt:o.terms_accepted_at,amount:Number(o.amount),introAmount:o.intro_amount!==null?Number(o.intro_amount):null,status:statuses[o.status]||'Pedido registrado',markdown:documents.get(o.terms_version)||null})),
    ...(purchases.data||[]).map(p=>({id:p.id,product:p.tipo==='plano'?'SOMA Carreira':p.tipo==='sessao_extra'?'Sessão individual avulsa':'Crédito de simulação de currículo',details:p.contract_snapshot?.plano?`${p.contract_snapshot.plano} · ${p.contract_snapshot.duracao_meses} meses · ${p.contract_snapshot.parcelas} parcela(s) · Total: ${Number(p.contract_snapshot.valor_total).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}`:undefined,version:p.terms_version,acceptedAt:p.terms_accepted_at,amount:Number(p.valor),status:statuses[p.status]||'Pedido registrado',markdown:documents.get(p.terms_version)||null})),
    ...(account.data?.trial_started_at?[{id:'trial',product:'Teste da SOMA Plataforma',version:account.data.terms_version,acceptedAt:account.data.terms_accepted_at,amount:null,status:'Aceite do teste registrado',markdown:documents.get(account.data.terms_version)||null}]:[]),
  ];
  return <div className="mx-auto max-w-5xl px-5 py-8"><ContractRecords receipts={receipts}/>
    {access?.saas&&!access.mentorship?<ProductContractDocument product="plataforma"/>:<>
     <ProductContractDocument product="carreira"/>
     {!purchases.data?.some(p=>p.terms_version==='carreira-2026-10-24'&&p.terms_accepted_at)&&<details className="mt-8 rounded-xl border p-4"><summary className="cursor-pointer font-medium text-black">Condições complementares da mentoria</summary><TermosClient profile={profile} termo={termo??null} aceitoEm={aceite?.aceito_em??null}/></details>}
    </>}
  </div>;
}

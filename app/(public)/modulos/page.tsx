import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import ModuleCatalogClient from './ModuleCatalogClient';
import type { ModuleCardStatus } from '@/components/modules/ModuleAccessBadge';

export const dynamic='force-dynamic';
type CatalogModule={
 slug:string;title:string;description:string|null;route_path:string;
 monthly_price:number|null;enforce_access:boolean;purchasable:boolean;
 display_order:number;status:ModuleCardStatus;subscriptionId?:string|null;
};

export default async function ModulosPage() {
 const supabase=await createClient();
 const {data:{user}}=await supabase.auth.getUser();
 const {data:modules,error:catalogError}=await supabase.from('soma_modules')
   .select('slug,title,description,route_path,monthly_price,enforce_access,purchasable,display_order')
   .eq('enabled',true).order('display_order');
 if(catalogError)throw new Error('Não foi possível carregar o catálogo de módulos.');

 let mentor=false;
 let trial=false;
 let subs: Array<{id:string;module_slug:string;status:string;paid_through:string|null}>=[];
 if(user){
  const db=createAdminClient();
  const [{data:profile},{data:subscriptions}] = await Promise.all([
   db.from('profiles').select('id,is_admin,plano_id,status_assinatura,data_fim_acesso,trial_status,trial_ends_at')
      .eq('id',user.id).maybeSingle(),
   db.from('soma_module_subscriptions').select('id,module_slug,status,paid_through')
      .eq('user_id',user.id).order('updated_at',{ascending:false}).limit(100),
  ]);
  const today=new Date().toLocaleDateString('en-CA',{timeZone:'America/Sao_Paulo'});
  // A decisão real por módulo sempre vem da RPC; estes dados servem só aos rótulos.
  mentor=!!(profile?.is_admin || (profile?.plano_id && profile.status_assinatura==='ativo' &&
    (!profile.data_fim_acesso||profile.data_fim_acesso>=today)));
  trial=!mentor&&profile?.trial_status==='active'&&!!profile.trial_ends_at&&Date.parse(profile.trial_ends_at)>Date.now();
  subs=subscriptions??[];
 }
 const grants=user ? await supabase.from('soma_user_module_access')
   .select('module_slug,expires_at').eq('user_id',user.id).eq('status','ACTIVE') : {data:[]};
 const permissionResults=user ? await Promise.all((modules??[]).map(m=>
   supabase.rpc('soma_has_module',{p_slug:m.slug}))) : [];
 const formatted:CatalogModule[]=(modules??[]).map((m,index)=>{
  const owned=subs.find(s=>s.module_slug===m.slug&&s.status==='ACTIVE'&&
   !!s.paid_through&&Date.parse(s.paid_through)>Date.now());
  const grant=grants.data?.some(g=>g.module_slug===m.slug&&
   (!g.expires_at||Date.parse(g.expires_at)>Date.now()));
  const pending=subs.find(s=>s.module_slug===m.slug&&
   ['PENDING','PAST_DUE'].includes(s.status));
  const allowed=user ? permissionResults[index]?.data===true : false;
  let status:ModuleCardStatus='locked';
  if(allowed&&mentor)status='mentor';
  else if(allowed&&trial)status='trial';
  else if(allowed&&(owned||grant))status='owned';
  else if(pending)status='pending';
  else if(!m.enforce_access)status='legacy';
  return {...m,monthly_price:m.monthly_price==null?null:Number(m.monthly_price),
   status,subscriptionId:(owned??pending)?.id??null};
 });
 return <ModuleCatalogClient modules={formatted} authenticated={!!user}/>;
}

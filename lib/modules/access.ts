import 'server-only';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export type ModuleAccessReason='ALL_ACCESS'|'TRIAL'|'MODULE'|'LEGACY'|'ADMIN'|'DENIED';

export interface ModuleAccessDecision { allowed:boolean; reason:ModuleAccessReason }

/** Chamar somente no servidor com userId obtido de sessão autenticada.
 * RPC valida que nenhum cliente consulte direitos de outro usuário.
 */
export async function canAccessModule(userId:string,moduleSlug:string):Promise<boolean>{
  if(!userId || !/^[a-z][a-z0-9-]{2,63}$/.test(moduleSlug))return false;
  const db=createAdminClient();
  const {data,error}=await db.rpc('soma_can_access_module_for',{
    p_user:userId,p_slug:moduleSlug,
  });
  if(error){console.error('[SOMA MODULE ACCESS]',error.message);return false;}
  return data===true;
}

/** Para Server Components autenticados: nunca aceita userId enviado pelo browser. */
export async function currentUserCanAccessModule(moduleSlug:string){
  const supabase=await createClient();
  const {data:{user}}=await supabase.auth.getUser();
  if(!user)return false;
  const {data,error}=await supabase.rpc('soma_has_module',{p_slug:moduleSlug});
  return !error && data===true;
}

/** Categoria explicativa para UX; a autorização efetiva é sempre soma_has_module. */
export async function moduleAccessDecision(userId:string,moduleSlug:string):Promise<ModuleAccessDecision>{
  const allowed=await canAccessModule(userId,moduleSlug);
  if(!allowed)return{allowed:false,reason:'DENIED'};
  const db=createAdminClient();
  const [{data:p},{data:module}, {data:subs}, {data:grants}]=await Promise.all([
    db.from('profiles').select('is_admin,plano_id,status_assinatura,data_fim_acesso,trial_status,trial_ends_at').eq('id',userId).maybeSingle(),
    db.from('soma_modules').select('enforce_access').eq('slug',moduleSlug).maybeSingle(),
    db.from('soma_module_subscriptions').select('id').eq('user_id',userId).eq('module_slug',moduleSlug).eq('status','ACTIVE').gt('paid_through',new Date().toISOString()).limit(1),
    db.from('soma_user_module_access').select('id,expires_at').eq('user_id',userId).eq('module_slug',moduleSlug).eq('status','ACTIVE').limit(5),
  ]);
  if(p?.is_admin)return{allowed:true,reason:'ADMIN'};
  const today=new Date().toLocaleDateString('en-CA',{timeZone:'America/Sao_Paulo'});
  if(p?.plano_id&&p.status_assinatura==='ativo'&&(!p.data_fim_acesso||p.data_fim_acesso>=today))
    return{allowed:true,reason:'ALL_ACCESS'};
  if(p?.trial_status==='active'&&p.trial_ends_at&&Date.parse(p.trial_ends_at)>Date.now())
    return{allowed:true,reason:'TRIAL'};
  if(subs?.length || grants?.some(g=>!g.expires_at||Date.parse(g.expires_at)>Date.now()))
    return{allowed:true,reason:'MODULE'};
  if(!module?.enforce_access)return{allowed:true,reason:'LEGACY'};
  return{allowed:true,reason:'MODULE'};
}

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { SAAS_MODULES, type SaasAccess } from '@/lib/saas-access';

export type ProductResource = typeof SAAS_MODULES[number] | 'iris' | 'mentorship' | 'career-tool';
/** Route-level authorization, independent of Proxy and client-supplied user IDs. */
export async function requireProductAccess(resource: ProductResource, request?: Request) {
 const deny = (error: string, status: number) => ({ ok: false as const, response: NextResponse.json({error,erro:error,href:'/plataforma'},{status,headers:{'Cache-Control':'private, no-store'}}) });
 const db=await createClient();
 const {data:{user},error:authError}=await db.auth.getUser();
 if(authError||!user)return deny('Faça login para continuar.',401);
 const {data,error}=await db.rpc('soma_saas_state');
 if(error||!data||!Array.isArray(data.modules)||typeof data.mentorship!=='boolean'||typeof data.saas!=='boolean')return deny('Não foi possível validar seu acesso.',503);
 const access=data as SaasAccess;
 if(access.mentorship)return {ok:true as const,userId:user.id};
 if(!access.saas)return deny('Seu plano está inativo. Consulte suas opções de acesso.',403);
 let required:string=resource;
 if(resource==='career-tool'){
  const body=await request?.clone().json().catch(()=>null);
  required=({linkedin:'linkedin',gupy:'curriculo-ats',cenario:'desenvolvimento'} as Record<string,string>)[body?.ferramenta];
  if(!required)return deny('Ferramenta inválida.',400);
 }
 const allowed=required==='iris'?access.iris:required!=='mentorship'&&access.modules.includes(required);
 return allowed?{ok:true as const,userId:user.id}:deny('Este recurso não está incluído no seu plano.',403);
}

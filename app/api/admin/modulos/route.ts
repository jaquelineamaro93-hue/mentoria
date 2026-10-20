import { NextRequest,NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/security/require-admin';
import { createAdminClient } from '@/lib/supabase/admin';

export const runtime='nodejs';
const headers={'Cache-Control':'private, no-store'};

export async function PATCH(request:NextRequest){
 const authorization=await requireAdmin();
 if(!authorization.ok)return authorization.response;
 let input:{slug?:unknown;monthlyPrice?:unknown;enforceAccess?:unknown;purchasable?:unknown};
 try{input=await request.json();}catch{return NextResponse.json({error:'Dados inválidos.'},{status:400,headers});}
 if(typeof input?.slug!=='string'||!/^[a-z][a-z0-9-]{2,63}$/.test(input.slug)||
   typeof input.enforceAccess!=='boolean'||typeof input.purchasable!=='boolean')
  return NextResponse.json({error:'Configuração inválida.'},{status:400,headers});
 const price=input.monthlyPrice===null||input.monthlyPrice===''?null:Number(input.monthlyPrice);
 if(price!==null && (!Number.isFinite(price)||price<5||price>10000||Math.round(price*100)!==price*100))
  return NextResponse.json({error:'Preço deve ser de R$ 5,00 a R$ 10.000,00 com até duas casas decimais.'},{status:400,headers});
 if(input.purchasable && (!input.enforceAccess||price===null))
  return NextResponse.json({error:'Para cobrar, informe o preço e ative o controle de acesso.'},{status:422,headers});

 const admin=createAdminClient();
 const {data,error}=await admin.from('soma_modules').update({
  monthly_price:price,enforce_access:input.enforceAccess,
  purchasable:input.purchasable,updated_at:new Date().toISOString(),
 }).eq('slug',input.slug).eq('enabled',true)
  .select('slug,title,monthly_price,enforce_access,purchasable').maybeSingle();
 if(error||!data)return NextResponse.json({error:'Não foi possível atualizar o módulo.'},{status:503,headers});
 return NextResponse.json({module:data},{headers});
}

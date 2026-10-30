import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/security/require-admin';
import { createAdminClient } from '@/lib/supabase/admin';
import { consumeIdentifierRateLimit } from '@/lib/security/rate-limit';
import { isId } from '@/lib/learning/validation';
const fields='id,title,description,category,status,response,created_at';
const json=(body:unknown,status=200)=>NextResponse.json(body,{status,headers:{'Cache-Control':'private, no-store'}});
const invalidOrigin=(r:Request)=>r.headers.get('origin')!==new URL(r.url).origin;
export async function GET(){
 const db=await createClient();const {data:{user}}=await db.auth.getUser();if(!user)return json({error:'Faça login para continuar.'},401);
 const {data,error}=await db.from('soma_learning_suggestions').select(fields).order('created_at',{ascending:false}).limit(200);
 return error?json({error:'Não foi possível carregar as sugestões.'},503):json({suggestions:data??[]});
}
export async function POST(request:Request){
 const db=await createClient();const {data:{user}}=await db.auth.getUser();if(!user)return json({error:'Faça login para continuar.'},401);
 if(invalidOrigin(request))return json({error:'Origem inválida.'},403);
 const b=await request.json().catch(()=>null);
 if(!b||typeof b.title!=='string'||b.title.trim().length<4||b.title.length>120||typeof b.description!=='string'||b.description.trim().length<10||b.description.length>3000||!['experiencia','conteudo','acessibilidade','problema'].includes(b.category))return json({error:'Confira o título, a descrição e a categoria.'},400);
 if(!await consumeIdentifierRateLimit({scope:'learning-suggestions',identifier:user.id,limit:6,windowSeconds:3600}))return json({error:'Você já enviou várias sugestões. Tente novamente mais tarde.'},429);
 const {data,error}=await createAdminClient().from('soma_learning_suggestions').insert({user_id:user.id,title:b.title.trim(),description:b.description.trim(),category:b.category}).select(fields).single();
 return error?json({error:'Não foi possível enviar a sugestão. Tente novamente.'},503):json({suggestion:data},201);
}
export async function PATCH(request:Request){
 const auth=await requireAdmin();if(!auth.ok)return auth.response;
 if(invalidOrigin(request))return json({error:'Origem inválida.'},403);
 const b=await request.json().catch(()=>null);
 if(!b||!isId(b.id)||!['recebida','em_analise','planejada','concluida','nao_prevista'].includes(b.status)||typeof b.response!=='string'||b.response.length>1500)return json({error:'Confira o status e a resposta.'},400);
 const {data,error}=await createAdminClient().from('soma_learning_suggestions').update({status:b.status,response:b.response.trim()}).eq('id',b.id).select('id').maybeSingle();
 return error?json({error:'Não foi possível atualizar a sugestão.'},503):!data?json({error:'Sugestão não encontrada.'},404):json({ok:true});
}

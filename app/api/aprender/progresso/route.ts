import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isId } from '@/lib/learning/validation';
import { consumeIdentifierRateLimit } from '@/lib/security/rate-limit';
export async function POST(request:Request){
 const json=(v:object,status=200)=>NextResponse.json(v,{status,headers:{'Cache-Control':'private, no-store'}});
 if(request.headers.get('origin')&&request.headers.get('origin')!==new URL(request.url).origin)return json({error:'Origem inválida.'},403);
 const db=await createClient();const {data:{user}}=await db.auth.getUser();if(!user)return json({error:'Faça login.'},401);
 const b=await request.json().catch(()=>null);if(!b||!isId(b.lesson_id))return json({error:'Aula inválida.'},400);
 const {data:visible,error}=await db.from('soma_learning_lessons').select('id').eq('id',b.lesson_id).eq('published',true).maybeSingle();
 if(error)return json({error:'Não foi possível validar seu acesso.'},503);if(!visible)return json({error:'Aula indisponível.'},404);
 if(!await consumeIdentifierRateLimit({scope:'learning_progress',identifier:user.id,limit:240,windowSeconds:3600}))return json({error:'Aguarde um pouco antes de salvar novamente.'},429);
 const admin=createAdminClient();const {data:lesson,error:lessonError}=await admin.from('soma_learning_lessons').select('quiz_answer').eq('id',b.lesson_id).single();
 if(lessonError)return json({error:'Aula indisponível.'},503);
 const reflection=typeof b.reflection==='string'?b.reflection.trim():'';
 if(reflection.length>5000)return json({error:'Use até 5.000 caracteres na atividade.'},400);
 if(b.complete===true&&(reflection.length<20||b.answer!==lesson.quiz_answer))return json({error:reflection.length<20?'Descreva sua aplicação prática em pelo menos 20 caracteres.':'Revise o conteúdo e tente outra alternativa.'},422);
 // Somente a RPC autorizada pelo servidor grava e pontua; o usuário nunca escolhe dono ou pontos.
 const {data:progress,error:saveError}=await admin.rpc('soma_save_learning_progress',{p_user:user.id,p_lesson:b.lesson_id,p_position:Math.max(0,Math.min(86400,Math.floor(Number(b.position_seconds)||0))),p_reflection:reflection,p_complete:b.complete===true});
 if(saveError)return json({error:'Não foi possível salvar. Tente novamente.'},503);
 return json({progress});
}

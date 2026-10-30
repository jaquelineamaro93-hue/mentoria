import {NextResponse} from 'next/server';
import {createClient} from '@/lib/supabase/server';
import {createAdminClient} from '@/lib/supabase/admin';
import {isId} from '@/lib/learning/validation';
import {gradeGame,parseGames} from '@/lib/learning/games';
import {consumeIdentifierRateLimit} from '@/lib/security/rate-limit';
export async function POST(request:Request){
 const json=(v:object,status=200)=>NextResponse.json(v,{status,headers:{'Cache-Control':'private, no-store'}});
 if(request.headers.get('origin')&&request.headers.get('origin')!==new URL(request.url).origin)return json({error:'Origem inválida.'},403);
 const db=await createClient(),{data:{user}}=await db.auth.getUser();if(!user)return json({error:'Faça login.'},401);
 const b=await request.json().catch(()=>null);if(!b||!isId(b.lesson_id)||typeof b.game_id!=='string'||b.game_id.length>80||JSON.stringify(b).length>5000)return json({error:'Desafio inválido.'},400);
 const {data:visible,error}=await db.from('soma_learning_lessons').select('id').eq('id',b.lesson_id).eq('published',true).maybeSingle();
 if(error)return json({error:'Não foi possível validar seu acesso.'},503);if(!visible)return json({error:'Aula indisponível.'},404);
 if(!await consumeIdentifierRateLimit({scope:'learning_games',identifier:user.id,limit:240,windowSeconds:3600}))return json({error:'Aguarde um pouco antes de tentar novamente.'},429);
 const {data:lesson,error:readError}=await createAdminClient().from('soma_learning_lessons').select('minigames').eq('id',b.lesson_id).single();
 if(readError)return json({error:'Não foi possível carregar o desafio.'},503);
 try{const game=parseGames(lesson.minigames).find(g=>g.id===b.game_id);if(!game)return json({error:'Desafio indisponível.'},404);const correct=gradeGame(game,b.answers);return json({correct,explanation:game.explanation});}
 catch{return json({error:'Preencha todos os itens do desafio sem repetir opções.'},400);}
}

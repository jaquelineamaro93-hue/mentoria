import {parseGames,publicGame} from '@/lib/learning/games';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isId,mediaFor } from '@/lib/learning/validation';
import type { LessonDetail } from '@/lib/learning/types';
import { LESSON_COLUMNS } from '@/lib/learning/types';
export async function GET(request:Request){
 const db=await createClient();const {data:{user}}=await db.auth.getUser();
 if(!user)return NextResponse.json({error:'Faça login.'},{status:401});
 const id=new URL(request.url).searchParams.get('id');if(!isId(id))return NextResponse.json({error:'Aula inválida.'},{status:400});
 const {data:visible,error}=await db.from('soma_learning_lessons').select('id').eq('id',id).maybeSingle();
 if(error)return NextResponse.json({error:'Não foi possível validar o acesso.'},{status:503});
 if(!visible)return NextResponse.json({error:'Aula indisponível para seu acesso.'},{status:404});
 const {data:lesson,error:readError}=await createAdminClient().from('soma_learning_lessons').select(LESSON_COLUMNS+',body,exercise,quiz_question,quiz_options,media_url,material_url,minigames').eq('id',id).single<Omit<LessonDetail,'media'|'games'>&{media_url:string;minigames:unknown}>();
 if(readError)return NextResponse.json({error:'Não foi possível carregar a aula.'},{status:503});
 const {media_url,minigames,...safe}=lesson;
 return NextResponse.json({lesson:{...safe,media:mediaFor(media_url),games:parseGames(minigames).map(publicGame)}},{headers:{'Cache-Control':'private, no-store'}});
}

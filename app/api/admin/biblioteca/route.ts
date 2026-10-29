import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/security/require-admin';
import { createAdminClient } from '@/lib/supabase/admin';
import { isId,parseCourse,parseLesson } from '@/lib/learning/validation';
export async function POST(request:Request){
 const auth=await requireAdmin();if(!auth.ok)return auth.response;
 if(request.headers.get('origin')&&request.headers.get('origin')!==new URL(request.url).origin)return NextResponse.json({error:'Origem inválida.'},{status:403});
 const b=await request.json().catch(()=>null);if(!b||JSON.stringify(b).length>60000)return NextResponse.json({error:'Solicitação inválida.'},{status:400});
 try{
 const course=b.kind==='course';if(!course&&b.kind!=='lesson')throw new Error('Tipo inválido.');
 const values:Record<string,unknown>=course?parseCourse(b):parseLesson(b);if(b.id&&!isId(b.id))throw new Error('Identificador inválido.');
 const db=createAdminClient(),table=course?'soma_learning_courses':'soma_learning_lessons';
 const query=b.id?db.from(table).update(values).eq('id',b.id):db.from(table).insert(values);
 const {data,error}=await query.select('id').single();if(error)throw new Error('Não foi possível salvar. Confira os campos e tente novamente.');
 return NextResponse.json({id:data.id},{headers:{'Cache-Control':'no-store'}});
 }catch(e){return NextResponse.json({error:e instanceof Error?e.message:'Não foi possível salvar.'},{status:400});}
}

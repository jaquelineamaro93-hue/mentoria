import { NextRequest,NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { dispararTurnoTopSend, topsendConfigurado } from '@/lib/topsend';

export const runtime='nodejs';
export const maxDuration=30;
const headers={'Cache-Control':'private, no-store'};
const uuid=(v:string)=>/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
export async function POST(request:NextRequest) {
  const client=await createClient();
  const {data:{user}}=await client.auth.getUser();
  if(!user)return NextResponse.json({error:'Não autenticado'},{status:401,headers});
  const {data:perfil}=await client.from('profiles').select('is_admin').eq('id',user.id).maybeSingle();
  if(!perfil?.is_admin)return NextResponse.json({error:'Sem permissão'},{status:403,headers});
  if(!topsendConfigurado())
    return NextResponse.json({error:'Configure a URL do webhook da automação TopSend e habilite o canal antes de enviar.'},{status:503,headers});
  const input=await request.json().catch(()=>null) as {turnoId?:string;userId?:string}|null;
  if(!uuid(input?.turnoId??'') || !uuid(input?.userId??''))
    return NextResponse.json({error:'Identificadores inválidos'},{status:400,headers});
  const db=createAdminClient();
  const {data:turno,error}=await db.from('iris_turnos').select(
    'id,user_id,origem_id,status,resposta_gerada,insight,proximo_passo'
  ).eq('id',input!.turnoId!).eq('user_id',input!.userId!).maybeSingle();
  if(error)return NextResponse.json({error:'Não foi possível consultar o rascunho'},{status:503,headers});
  if(!turno || !turno.origem_id.startsWith('manual-rascunho-iris-'))
    return NextResponse.json({error:'O disparo manual aceita somente rascunhos históricos preparados pela SOMA.'},{status:400,headers});
  try{
    const resultado=await dispararTurnoTopSend(db,turno);
    return NextResponse.json({ok:true,resultado:resultado.status,
      mensagem:'TopSend recebeu o gatilho, sem comprovação de entrega da mensagem.'},{headers});
  }catch(e){
    const message=e instanceof Error?e.message:'Não foi possível iniciar o gatilho TopSend.';
    return NextResponse.json({error:message},{status:409,headers});
  }
}
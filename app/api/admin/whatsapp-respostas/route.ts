import { NextRequest,NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(request:NextRequest) {
 const supabase=await createClient();
 const {data:{user}}=await supabase.auth.getUser();
 if(!user)return NextResponse.json({error:'Não autenticado'},{status:401});
 const {data:perfil}=await supabase.from('profiles').select('is_admin').eq('id',user.id).single();
 if(!perfil?.is_admin)return NextResponse.json({error:'Sem permissão'},{status:403});
 const userId=request.nextUrl.searchParams.get('userId')||'';
 if(!/^[0-9a-f-]{36}$/i.test(userId))return NextResponse.json({error:'ID inválido'},{status:400});
 const admin=createAdminClient();
 const {data,error}=await admin.from('whatsapp_respostas_mentoria')
  .select('id,tipo,conteudo,recebido_em').eq('user_id',userId)
  .order('recebido_em',{ascending:false}).limit(30);
 if(error)return NextResponse.json({error:'Falha ao consultar respostas'},{status:503});
 return NextResponse.json({respostas:data||[]});
}

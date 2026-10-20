import { createHash } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

export const runtime='nodejs';
export const dynamic='force-dynamic';
const headers={'Cache-Control':'private, no-store'};

export async function GET(request:NextRequest){
  const token=request.cookies.get('soma_admin_inspection')?.value;
  if(!token || token.length<30)return NextResponse.json({ativo:false},{headers});
  const db=await createClient();
  const {data:{user}}=await db.auth.getUser();
  if(!user)return NextResponse.json({ativo:false},{headers});
  const hash=createHash('sha256').update(token).digest('hex');
  const admin=createAdminClient();
  const {data:registro}=await admin.from('admin_inspecoes_sessoes')
    .select('usuario_alvo_id').eq('token_hash',hash).eq('usuario_alvo_id',user.id)
    .is('encerrado_em',null).gt('expira_em',new Date().toISOString()).maybeSingle();
  return NextResponse.json({ativo:!!registro},{headers});
}

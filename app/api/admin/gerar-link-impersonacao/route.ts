import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
  }

  const { data: meuPerfil } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single();

  if (!meuPerfil?.is_admin) {
    return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 });
  }

  const body = await request.json();
  const targetUserId: string = body.userId;

  if (!targetUserId) {
    return NextResponse.json({ error: 'Usuário não informado.' }, { status: 400 });
  }

  try {
    const admin = createAdminClient();

    const { data: targetProfile } = await admin
      .from('profiles')
      .select('email, is_admin')
      .eq('id', targetUserId)
      .single();

    // Nunca permite impersonar outro admin, por segurança
    if (!targetProfile || targetProfile.is_admin) {
      return NextResponse.json({ error: 'Usuário inválido para essa ação.' }, { status: 400 });
    }

    const { data: linkData, error } = await admin.auth.admin.generateLink({
      type: 'magiclink',
      email: targetProfile.email,
    });

    if (error || !linkData) {
      throw error ?? new Error('Não foi possível gerar o link.');
    }

    // Registro de auditoria: quem entrou como quem, e quando
    await admin.from('admin_impersonacoes_log').insert({
      admin_id: user.id,
      usuario_alvo_id: targetUserId,
    });

    return NextResponse.json({
      tokenHash: linkData.properties.hashed_token,
      email: targetProfile.email,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro desconhecido.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

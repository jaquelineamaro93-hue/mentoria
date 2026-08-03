import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

// POST /api/admin/confirmar-email
// Confirma manualmente o e-mail de um usuário no auth.users, sem depender
// de e-mail nenhum sair. Existe porque o envio de e-mail de confirmação
// (Supabase -> SMTP customizado) já mostrou ser instável algumas vezes,
// deixando cadastros legítimos travados sem conseguir entrar. Só admin
// pode chamar.
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ erro: 'Não autorizado.' }, { status: 401 });
  }

  const { data: perfil } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single();

  if (!perfil?.is_admin) {
    return NextResponse.json({ erro: 'Não autorizado.' }, { status: 403 });
  }

  const { userId } = await req.json();
  if (!userId) {
    return NextResponse.json({ erro: 'userId é obrigatório.' }, { status: 400 });
  }

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.updateUserById(userId, { email_confirm: true });

  if (error) {
    return NextResponse.json({ erro: 'Não consegui confirmar o e-mail.' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

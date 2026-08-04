import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

// POST /api/auth/confirmar-cadastro
// Body: { userId: string }
//
// Chamada pelo próprio formulário de cadastro logo após supabase.auth.signUp()
// dar certo, pra confirmar o e-mail na hora em vez de depender do envio do
// e-mail de confirmação (que já mostrou ser instável e travou vários
// cadastros legítimos). Sem isso, o acesso não depende mais de e-mail
// nenhum sair com sucesso.
//
// Só confirma contas criadas há poucos minutos, pra não virar um endpoint
// aberto de "confirmar e-mail de qualquer um".
const JANELA_MAXIMA_MS = 10 * 60 * 1000;

export async function POST(req: NextRequest) {
  const { userId } = await req.json();
  if (!userId) {
    return NextResponse.json({ erro: 'userId é obrigatório.' }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: usuario, error: erroBusca } = await admin.auth.admin.getUserById(userId);
  if (erroBusca || !usuario?.user) {
    return NextResponse.json({ erro: 'Usuário não encontrado.' }, { status: 404 });
  }

  const criadoEm = new Date(usuario.user.created_at).getTime();
  if (Date.now() - criadoEm > JANELA_MAXIMA_MS) {
    return NextResponse.json(
      { erro: 'Essa conta não pode mais ser confirmada por essa via.' },
      { status: 403 }
    );
  }

  if (usuario.user.email_confirmed_at) {
    return NextResponse.json({ ok: true });
  }

  const { error } = await admin.auth.admin.updateUserById(userId, { email_confirm: true });
  if (error) {
    return NextResponse.json({ erro: 'Não consegui confirmar o cadastro.' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

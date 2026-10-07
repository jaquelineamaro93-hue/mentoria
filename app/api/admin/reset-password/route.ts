import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdmin } from '@/lib/security/require-admin';

export async function POST(request: Request) {
  const authorization = await requireAdmin();
  if (!authorization.ok) return authorization.response;

  const { userId, email } = await request.json();

  if (!userId || !email) {
    return NextResponse.json(
      { error: 'userId e email são obrigatórios' },
      { status: 400 }
    );
  }

  try {
    const supabase = createAdminClient();
    const { data: userData, error: userError } =
      await supabase.auth.admin.getUserById(userId);

    const accountEmail = userData.user?.email?.trim().toLowerCase();
    const requestedEmail = String(email).trim().toLowerCase();

    if (userError || !accountEmail || accountEmail !== requestedEmail) {
      return NextResponse.json(
        { error: 'Usuário e e-mail não conferem.' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email: accountEmail,
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://somamentoria.com'}/reset-password`,
      },
    });

    if (error || !data) {
      console.error('[ADMIN-RESET-PASSWORD] Falha ao gerar link:', error?.message);
      return NextResponse.json(
        { error: 'Erro ao gerar link de reset' },
        { status: 500 }
      );
    }

    const resetUrl = (data.properties as { action_link?: string } | null)?.action_link;
    if (!resetUrl) {
      return NextResponse.json(
        { error: 'Erro ao gerar link de reset' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        message: 'Link gerado com sucesso',
        link: resetUrl,
      },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error) {
    console.error(
      '[ADMIN-RESET-PASSWORD] Falha inesperada:',
      error instanceof Error ? error.message : String(error)
    );
    return NextResponse.json({ error: 'Erro ao processar' }, { status: 500 });
  }
}

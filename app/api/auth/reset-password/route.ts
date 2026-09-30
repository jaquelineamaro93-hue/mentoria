import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  const { email } = await request.json();

  if (!email) {
    return NextResponse.json({ error: 'Email é obrigatório' }, { status: 400 });
  }

  try {
    const supabase = await createClient();

    // Não consultamos profiles por e-mail aqui. Além de ser desnecessário,
    // isso evita enumeração de contas e permite manter a tabela de perfis
    // protegida por RLS sem SELECT público.
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://somamentoria.com'}/auth/callback?next=/reset-password`,
    });

    if (error) {
      console.error('[RESET-PASSWORD] Erro Supabase:', error.message);
      // Mantém resposta neutra para não revelar se o e-mail pertence a uma conta.
    }

    return NextResponse.json({
      message: 'Se o email existe, você receberá um link de reset.',
    });
  } catch (error) {
    console.error('[RESET-PASSWORD] Erro:', error);
    return NextResponse.json({
      message: 'Se o email existe, você receberá um link de reset.',
    });
  }
}

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: Request) {
  const { email } = await request.json();

  if (!email) {
    return NextResponse.json({ error: 'Email é obrigatório' }, { status: 400 });
  }

  try {
    const supabase = createAdminClient();

    // Verifica se o perfil existe
    const { data: perfil } = await supabase
      .from('profiles')
      .select('id, nome')
      .eq('email', email)
      .single();

    if (!perfil) {
      // Não revela se email existe ou não (segurança)
      return NextResponse.json({ message: 'Se o email existe, você receberá um link de reset.' });
    }

    // Gera link de reset via Supabase Auth (Supabase envia o email automaticamente)
    const { error } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email: email,
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_VERCEL_URL}/reset-password`,
      },
    });

    if (error) {
      console.error('Erro Supabase:', error);
      return NextResponse.json(
        { error: 'Erro ao gerar link de reset' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Se o email existe, você receberá um link de reset.',
    });
  } catch (error) {
    console.error('Erro:', error);
    return NextResponse.json({ error: 'Erro ao processar' }, { status: 500 });
  }
}

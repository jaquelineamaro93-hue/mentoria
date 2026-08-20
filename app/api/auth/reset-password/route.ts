import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import sgMail from '@sendgrid/mail';

export async function POST(request: Request) {
  const { email } = await request.json();

  if (!email) {
    return NextResponse.json({ error: 'Email é obrigatório' }, { status: 400 });
  }

  try {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY || '');
    const supabase = await createClient();

    const { data: perfis, error: queryError } = await supabase
      .from('profiles')
      .select('id, nome')
      .eq('email', email);

    if (queryError || !perfis || perfis.length === 0) {
      return NextResponse.json({ message: 'Se o email existe, você receberá um link de reset.' });
    }

    // IMPORTANTE: Supabase envia seu próprio email, então NÃO enviamos customizado
    // Só precisamos chamar resetPasswordForEmail
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://somamentoria.com'}/auth/callback?next=/reset-password`,
    });

    if (error) {
      console.error('Erro Supabase:', error);
      return NextResponse.json({ error: 'Erro ao gerar link de reset' }, { status: 500 });
    }

    console.log('✅ Email de reset enviado pelo Supabase para:', email);
    return NextResponse.json({
      message: 'Se o email existe, você receberá um link de reset.',
    });
  } catch (error) {
    console.error('Erro:', error);
    return NextResponse.json({ error: 'Erro ao processar' }, { status: 500 });
  }
}

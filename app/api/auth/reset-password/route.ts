import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY || '');

export async function POST(request: Request) {
  const { email } = await request.json();

  if (!email) {
    return NextResponse.json({ error: 'Email é obrigatório' }, { status: 400 });
  }

  try {
    const supabase = await createClient();

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

    // Gera link de reset via Supabase Auth
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_VERCEL_URL || 'https://somamentoria.com'}/auth/callback?next=/reset-password`,
    });

    if (error) {
      console.error('Erro Supabase:', error);
      return NextResponse.json(
        { error: 'Erro ao gerar link de reset' },
        { status: 500 }
      );
    }

    // Envia email customizado via SendGrid
    await sgMail.send({
      to: email,
      from: process.env.SENDGRID_FROM_EMAIL || 'noreply@soma.com',
      subject: '🔐 Redefinir sua senha - SOMA Mentoria',
      html: `
        <div style="font-family: 'Poppins', sans-serif; max-width: 600px; margin: 0 auto; background: #f6f2e9; padding: 40px 20px;">
          <div style="background: white; border-radius: 16px; padding: 40px; text-align: center;">
            <h2 style="color: #3c2c1f; margin-bottom: 10px;">Redefinir Senha</h2>
            <p style="color: #7a6b5f; margin-bottom: 30px;">Recebemos sua solicitação de reset de senha.</p>
            
            <p style="color: #7a6b5f; margin-bottom: 30px; font-size: 14px;">
              Clique no botão abaixo para criar uma nova senha:
            </p>
            
            <a href="${process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_VERCEL_URL || 'https://somamentoria.com'}/auth/callback?next=/reset-password" 
               style="display: inline-block; background: #6b4a35; color: white; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-bottom: 30px;">
              Redefinir Senha
            </a>
            
            <p style="color: #7a6b5f; font-size: 12px; margin-bottom: 10px;">
              Esse link expira em 24 horas.
            </p>
            
            <p style="color: #7a6b5f; font-size: 12px; margin: 20px 0; border-top: 1px solid #e0d9cf; padding-top: 20px;">
              Se você não solicitou essa mudança, ignore este email.
            </p>
          </div>
        </div>
      `,
    });

    return NextResponse.json({
      message: 'Se o email existe, você receberá um link de reset.',
    });
  } catch (error) {
    console.error('Erro:', error);
    return NextResponse.json({ error: 'Erro ao processar' }, { status: 500 });
  }
}

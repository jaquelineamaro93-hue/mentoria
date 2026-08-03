import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

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

    // Usa admin client para gerar o link de recovery
    const adminClient = createAdminClient();
    const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
      type: 'recovery',
      email: email,
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_VERCEL_URL || 'https://mentoria-pi-taupe.vercel.app'}/reset-password`,
      },
    });

    if (linkError || !linkData) {
      console.error('Erro ao gerar link:', linkError);
      return NextResponse.json(
        { error: 'Erro ao gerar link de reset' },
        { status: 500 }
      );
    }

    // Extrai o link de ação
    const resetLink = (linkData.properties as any)?.action_link;

    if (!resetLink) {
      console.error('Link de reset não gerado:', linkData);
      return NextResponse.json(
        { error: 'Erro ao gerar link de reset' },
        { status: 500 }
      );
    }

    console.log('Link de reset gerado para:', email, 'Link:', resetLink);

    // Envia email com o link de reset
    if (process.env.SENDGRID_API_KEY) {
      try {
        const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            personalizations: [
              {
                to: [{ email }],
              },
            ],
            from: {
              email: process.env.SENDGRID_FROM_EMAIL || 'noreply@somamentoria.com.br',
              name: 'SOMA Mentoria',
            },
            subject: 'Redefina sua senha - SOMA Mentoria',
            content: [
              {
                type: 'text/html',
                value: `
                  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #4a3b35; margin-bottom: 20px;">Redefinir sua senha</h2>
                    <p style="color: #666; font-size: 16px; margin-bottom: 20px;">
                      Clique no link abaixo para redefinir sua senha no SOMA Mentoria:
                    </p>
                    <div style="margin: 30px 0;">
                      <a href="${resetLink}" style="background: #4a3b35; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">
                        Redefinir Senha
                      </a>
                    </div>
                    <p style="color: #999; font-size: 12px;">
                      Ou copie e cole este link no seu navegador:<br>
                      <code style="background: #f5f1ed; padding: 8px; border-radius: 4px; display: block; word-break: break-all; margin-top: 8px;">${resetLink}</code>
                    </p>
                    <p style="color: #999; font-size: 12px; margin-top: 20px;">
                      Este link expira em 1 hora.
                    </p>
                    <p style="color: #999; font-size: 12px; margin-top: 20px;">
                      Com carinho,<br>
                      Equipe SOMA Mentoria
                    </p>
                  </div>
                `,
              },
            ],
          }),
        });

        if (response.ok) {
          console.log(`Email de reset enviado para ${email}`);
        } else {
          console.error('Erro ao enviar email via SendGrid:', response.status);
        }
      } catch (emailError) {
        console.error('Erro ao enviar email:', emailError);
      }
    }

    return NextResponse.json({
      message: 'Se o email existe, você receberá um link de reset.',
    });
  } catch (error) {
    console.error('Erro:', error);
    return NextResponse.json({ error: 'Erro ao processar' }, { status: 500 });
  }
}

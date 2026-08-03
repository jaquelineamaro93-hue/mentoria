import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: Request) {
  const { email } = await request.json();

  if (!email) {
    return NextResponse.json({ error: 'Email é obrigatório' }, { status: 400 });
  }

  try {
    // Verifica se o usuário existe
    const supabaseUser = await createClient();
    const { data: profile } = await supabaseUser
      .from('profiles')
      .select('id')
      .eq('email', email)
      .single();

    if (!profile) {
      // Por segurança, não revela se o email existe
      return NextResponse.json({
        message: 'Se o email existe, você receberá um código.'
      });
    }

    // Gera código de 6 dígitos
    const codigo = Math.floor(100000 + Math.random() * 900000).toString();

    // Armazena o código com validade de 15 minutos
    const supabaseAdmin = createAdminClient();
    const { error: insertError } = await supabaseAdmin
      .from('magic_codes')
      .upsert({
        email,
        code: codigo,
        expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      }, { onConflict: 'email' });

    if (insertError) {
      console.error('Erro ao salvar código:', insertError);
      return NextResponse.json(
        { error: 'Erro ao gerar código' },
        { status: 500 }
      );
    }

    // Envia email com o código
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
            subject: 'Seu código de acesso - SOMA Mentoria',
            content: [
              {
                type: 'text/html',
                value: `
                  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #4a3b35; margin-bottom: 20px;">Seu código de acesso</h2>
                    <p style="color: #666; font-size: 16px; margin-bottom: 20px;">
                      Use o código abaixo para entrar no SOMA Mentoria:
                    </p>
                    <div style="background: #f5f1ed; padding: 20px; border-radius: 8px; text-align: center; margin: 30px 0;">
                      <p style="font-size: 32px; font-weight: bold; color: #2a5ba8; letter-spacing: 4px; margin: 0;">
                        ${codigo}
                      </p>
                    </div>
                    <p style="color: #999; font-size: 12px;">
                      Este código expira em 15 minutos.
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

        if (!response.ok) {
          throw new Error(`SendGrid error: ${response.status}`);
        }

        console.log(`Email enviado para ${email}`);
      } catch (emailError) {
        console.error('Erro ao enviar email:', emailError);
        // Não retorna erro, pois o código já foi gerado
      }
    }

    return NextResponse.json({
      message: 'Se o email existe, você receberá um código.',
    });
  } catch (error) {
    console.error('Erro:', error);
    return NextResponse.json({ error: 'Erro ao processar' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: Request) {
  const { email } = await request.json();

  if (!email) {
    return NextResponse.json({ error: 'Email é obrigatório' }, { status: 400 });
  }

  try {
    console.log(`📧 [RESET-PASSWORD] Iniciando reset para: ${email}`);
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

    // Gera link de reset com admin client para obter o link real
    console.log(`🔑 [RESET-PASSWORD] Criando admin client...`);
    const supabaseAdmin = createAdminClient();
    console.log(`✅ [RESET-PASSWORD] Admin client criado, chamando generateLink...`);
    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: email,
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://somamentoria.com'}/reset-password`,
      },
    });

    if (error || !data) {
      console.error('🔴 Erro ao gerar link de reset:', {
        error: error,
        errorMessage: error?.message,
        errorStatus: (error as any)?.status,
        data: data,
        email: email,
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      });
      return NextResponse.json(
        { error: 'Erro ao gerar link de reset' },
        { status: 500 }
      );
    }

    // Extrai o link real da resposta do Supabase
    console.log(`✅ [RESET-PASSWORD] generateLink retornou com sucesso`);
    const resetLink = (data.properties as any)?.action_link || (data as any)?.action_link;
    if (!resetLink) {
      console.error(`🔴 [RESET-PASSWORD] Link não encontrado na resposta:`, data);
      return NextResponse.json(
        { error: 'Erro ao gerar link de reset' },
        { status: 500 }
      );
    }
    console.log(`✅ [RESET-PASSWORD] Link extraído com sucesso`);

    // Envia email customizado via SendGrid usando fetch (não sgMail para evitar issues de inicialização)
    const apiKey = process.env.SENDGRID_API_KEY;
    const fromEmail = process.env.SENDGRID_FROM_EMAIL ?? 'consultoria@camarocrm.com';
    const bccEmail = 'jaqueline.amaro93@gmail.com';

    if (!apiKey) {
      console.error('SENDGRID_API_KEY não configurada');
      throw new Error('SendGrid não configurado');
    }

    const personalizations: Record<string, any> = {
      to: [{ email: email }],
    };
    if (email.toLowerCase() !== bccEmail.toLowerCase()) {
      personalizations.bcc = [{ email: bccEmail }];
    }

    console.log(`📧 [RESET-PASSWORD] Enviando email de reset para: ${email}`);
    const sendgridResponse = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [personalizations],
        from: { email: fromEmail, name: 'SOMA Mentoria' },
        subject: '🔐 Redefinir sua senha - SOMA Mentoria',
        content: [{
          type: 'text/html',
          value: `
            <div style="font-family: 'Poppins', sans-serif; max-width: 600px; margin: 0 auto; background: #f6f2e9; padding: 40px 20px;">
              <div style="background: white; border-radius: 16px; padding: 40px; text-align: center;">
                <h2 style="color: #3c2c1f; margin-bottom: 10px;">Redefinir Senha</h2>
                <p style="color: #7a6b5f; margin-bottom: 30px;">Recebemos sua solicitação de reset de senha.</p>

                <p style="color: #7a6b5f; margin-bottom: 30px; font-size: 14px;">
                  Clique no botão abaixo para criar uma nova senha:
                </p>

                <a href="${resetLink}"
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
        }],
      }),
    });

    if (!sendgridResponse.ok) {
      const errorText = await sendgridResponse.text();
      console.error(`🔴 [RESET-PASSWORD] SendGrid erro ${sendgridResponse.status}:`, errorText);
      throw new Error(`SendGrid retornou erro ${sendgridResponse.status}`);
    }

    console.log(`✅ [RESET-PASSWORD] Email de reset enviado com sucesso para: ${email}`);
    return NextResponse.json({
      message: 'Se o email existe, você receberá um link de reset.',
    });
  } catch (error) {
    console.error('🔴 [RESET-PASSWORD] Erro no catch block:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json({ error: 'Erro ao processar' }, { status: 500 });
  }
}

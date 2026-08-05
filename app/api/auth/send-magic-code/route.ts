import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { enviarEmail } from '@/lib/sendgrid';

export async function POST(request: Request) {
  const { email } = await request.json();

  if (!email) {
    return NextResponse.json({ error: 'Email é obrigatório' }, { status: 400 });
  }

  try {
        console.log(`📧 [MAGIC-CODE] Solicitação para: ${email}`);

    // Gera código sem verificar se o perfil existe
    // (por segurança, não revelamos se o email existe ou não)
    const codigo = Math.floor(100000 + Math.random() * 900000).toString();

    const supabaseAdmin = createAdminClient();
    const { error: insertError } = await supabaseAdmin
      .from('magic_codes')
      .upsert({
        email,
        code: codigo,
        expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      }, { onConflict: 'email' });

    const codigo = Math.floor(100000 + Math.random() * 900000).toString();

    const supabaseAdmin = createAdminClient();
    const { error: insertError } = await supabaseAdmin
      .from('magic_codes')
      .upsert({
        email,
        code: codigo,
        expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      }, { onConflict: 'email' });

    if (insertError) {
      console.error(`🔴 [MAGIC-CODE] Erro ao salvar código:`, insertError);
      return NextResponse.json(
        { error: 'Erro ao gerar código' },
        { status: 500 }
      );
    }
    console.log(`✅ [MAGIC-CODE] Código ${codigo} salvo para: ${email}`);

    try {
      await enviarEmail({
        para: email,
        assunto: 'Seu código de acesso - SOMA Mentoria',
        html: `
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
      });
    } catch (emailError) {
      console.error(`🔴 [MAGIC-CODE] Erro ao enviar código para ${email}:`, emailError);
    }

    return NextResponse.json({
      message: 'Se o email existe, você receberá um código.',
    });
  } catch (error) {
    console.error('🔴 [MAGIC-CODE] Erro:', error);
    return NextResponse.json({ error: 'Erro ao processar' }, { status: 500 });
  }
}

import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { enviarEmail } from '@/lib/sendgrid';
import { consumeSecurityRateLimit, hashSecurityValue } from '@/lib/security/rate-limit';

const GENERIC_RESPONSE = {
  message: 'Se o email existe e está habilitado, você receberá um código.',
};

export async function POST(request: Request) {
  const { email } = await request.json();
  const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';

  if (!normalizedEmail || !normalizedEmail.includes('@')) {
    return NextResponse.json({ error: 'Email inválido' }, { status: 400 });
  }

  try {
    const [ipAllowed, emailAllowed] = await Promise.all([
      consumeSecurityRateLimit({
        request,
        scope: 'magic_code_send_ip',
        limit: 12,
        windowSeconds: 15 * 60,
      }),
      consumeSecurityRateLimit({
        request,
        scope: 'magic_code_send_email',
        identifier: normalizedEmail,
        limit: 5,
        windowSeconds: 60 * 60,
      }),
    ]);

    if (!ipAllowed || !emailAllowed) {
      return NextResponse.json(GENERIC_RESPONSE, {
        status: 429,
        headers: { 'Cache-Control': 'no-store' },
      });
    }

    const supabaseAdmin = createAdminClient();

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('id,email')
      .ilike('email', normalizedEmail)
      .maybeSingle();

    if (!profile) {
      return NextResponse.json(GENERIC_RESPONSE, {
        headers: { 'Cache-Control': 'no-store' },
      });
    }

    const { data: authData } = await supabaseAdmin.auth.admin.getUserById(profile.id);
    const bannedUntil = authData.user?.banned_until
      ? new Date(authData.user.banned_until).getTime()
      : 0;

    if (bannedUntil > Date.now()) {
      return NextResponse.json(GENERIC_RESPONSE, {
        headers: { 'Cache-Control': 'no-store' },
      });
    }

    const { data: existing } = await supabaseAdmin
      .from('magic_codes')
      .select('created_at')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (
      existing?.created_at &&
      Date.now() - new Date(existing.created_at).getTime() < 60_000
    ) {
      return NextResponse.json(GENERIC_RESPONSE, {
        headers: { 'Cache-Control': 'no-store' },
      });
    }

    const code = crypto.randomInt(100000, 1000000).toString();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 10 * 60 * 1000);

    const { error: insertError } = await supabaseAdmin
      .from('magic_codes')
      .upsert(
        {
          email: normalizedEmail,
          code: hashSecurityValue(`magic-code|${normalizedEmail}|${code}`),
          attempts: 0,
          expires_at: expiresAt.toISOString(),
          created_at: now.toISOString(),
          updated_at: now.toISOString(),
        },
        { onConflict: 'email' }
      );

    if (insertError) {
      console.error('[MAGIC-CODE] Falha ao armazenar código:', insertError.message);
      return NextResponse.json({ error: 'Erro ao gerar código' }, { status: 500 });
    }

    try {
      await enviarEmail({
        from: 'consultoria@camarocrm.com',
        to: normalizedEmail,
        assunto: 'Seu código de acesso - SOMA Mentoria',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #4a3b35; margin-bottom: 20px;">Seu código de acesso</h2>
            <p style="color: #666; font-size: 16px; margin-bottom: 20px;">
              Use o código abaixo para entrar no SOMA Mentoria:
            </p>
            <div style="background: #f5f1ed; padding: 20px; border-radius: 8px; text-align: center; margin: 30px 0;">
              <p style="font-size: 32px; font-weight: bold; color: #2a5ba8; letter-spacing: 4px; margin: 0;">
                ${code}
              </p>
            </div>
            <p style="color: #999; font-size: 12px;">
              Este código expira em 10 minutos e possui limite de tentativas.
            </p>
            <p style="color: #999; font-size: 12px; margin-top: 20px;">
              Com carinho,<br>
              Equipe SOMA Mentoria
            </p>
          </div>
        `,
      });
    } catch (emailError) {
      console.error(
        '[MAGIC-CODE] Falha no envio:',
        emailError instanceof Error ? emailError.message : String(emailError)
      );
    }

    return NextResponse.json(GENERIC_RESPONSE, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    console.error(
      '[MAGIC-CODE] Falha inesperada:',
      error instanceof Error ? error.message : String(error)
    );
    return NextResponse.json({ error: 'Erro ao processar' }, { status: 500 });
  }
}

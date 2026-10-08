import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { consumeSecurityRateLimit, hashSecurityValue } from '@/lib/security/rate-limit';

export async function POST(request: Request) {
  const { email, code } = await request.json();
  const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
  const normalizedCode = typeof code === 'string' ? code.trim() : String(code ?? '').trim();

  if (!normalizedEmail || !/^\d{6}$/.test(normalizedCode)) {
    return NextResponse.json(
      { error: 'Email e código são obrigatórios' },
      { status: 400 }
    );
  }

  try {
    const [ipAllowed, emailAllowed] = await Promise.all([
      consumeSecurityRateLimit({
        request,
        scope: 'magic_code_verify_ip',
        limit: 30,
        windowSeconds: 15 * 60,
      }),
      consumeSecurityRateLimit({
        request,
        scope: 'magic_code_verify_email',
        identifier: normalizedEmail,
        limit: 10,
        windowSeconds: 15 * 60,
      }),
    ]);

    if (!ipAllowed || !emailAllowed) {
      return NextResponse.json(
        { error: 'Muitas tentativas. Solicite um novo código mais tarde.' },
        { status: 429 }
      );
    }

    const supabase = createAdminClient();

    // Busca o código armazenado
    const { data: magicCode, error: fetchError } = await supabase
      .from('magic_codes')
      .select('code, expires_at, attempts')
      .eq('email', normalizedEmail)
      .single();

    if (fetchError || !magicCode) {
      return NextResponse.json(
        { error: 'Código inválido ou expirado' },
        { status: 401 }
      );
    }

    // Verifica se expirou
    if (new Date(magicCode.expires_at) < new Date()) {
      await supabase.from('magic_codes').delete().eq('email', normalizedEmail);
      return NextResponse.json(
        { error: 'Código expirado. Solicite um novo.' },
        { status: 401 }
      );
    }

    const attempts = Number(magicCode.attempts ?? 0);
    if (attempts >= 5) {
      await supabase.from('magic_codes').delete().eq('email', normalizedEmail);
      return NextResponse.json(
        { error: 'Limite de tentativas atingido. Solicite um novo código.' },
        { status: 429 }
      );
    }

    const storedCode = String(magicCode.code);
    const candidateHash = hashSecurityValue(
      `magic-code|${normalizedEmail}|${normalizedCode}`
    );

    // Compatibilidade curta com códigos emitidos antes deste hardening.
    const candidate = /^\d{6}$/.test(storedCode) ? normalizedCode : candidateHash;
    const expected = Buffer.from(storedCode);
    const received = Buffer.from(candidate);
    const valid =
      expected.length === received.length && crypto.timingSafeEqual(expected, received);

    if (!valid) {
      const nextAttempts = attempts + 1;
      await supabase
        .from('magic_codes')
        .update({ attempts: nextAttempts, updated_at: new Date().toISOString() })
        .eq('email', normalizedEmail);
      if (nextAttempts >= 5) {
        await supabase.from('magic_codes').delete().eq('email', normalizedEmail);
      }
      return NextResponse.json({ error: 'Código inválido' }, { status: 401 });
    }

    // Verifica se o usuário existe
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id,email')
      .ilike('email', normalizedEmail)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    const { data: authData, error: authUserError } =
      await supabase.auth.admin.getUserById(profile.id);
    const bannedUntil = authData.user?.banned_until
      ? new Date(authData.user.banned_until).getTime()
      : 0;

    if (authUserError || bannedUntil > Date.now()) {
      await supabase.from('magic_codes').delete().eq('email', normalizedEmail);
      return NextResponse.json({ error: 'Acesso indisponível.' }, { status: 403 });
    }

    const { data: consumed, error: consumeError } = await supabase
      .from('magic_codes')
      .delete()
      .eq('email', normalizedEmail)
      .eq('code', storedCode)
      .select('id')
      .maybeSingle();

    if (consumeError || !consumed) {
      return NextResponse.json(
        { error: 'Código inválido ou expirado' },
        { status: 401 }
      );
    }

    // Gera um link de login somente depois de consumir o código.
    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: profile.email,
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://somamentoria.com'}/auth/confirm`,
      },
    });

    if (linkError || !linkData) {
      return NextResponse.json(
        { error: 'Erro ao gerar link de acesso' },
        { status: 500 }
      );
    }

    // Extrai o action link corretamente
    const actionLink = (linkData.properties as any)?.action_link;
    if (!actionLink) {
      console.error('Link não gerado:', linkData);
      return NextResponse.json(
        { error: 'Erro ao gerar link de acesso' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Código verificado com sucesso!',
      loginUrl: actionLink,
    });
  } catch (error) {
    console.error('Erro:', error);
    return NextResponse.json({ error: 'Erro ao processar' }, { status: 500 });
  }
}

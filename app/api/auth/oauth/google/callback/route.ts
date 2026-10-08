import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { iniciarTrialParaUsuario } from '@/lib/trial';
import { consumeSecurityRateLimit } from '@/lib/security/rate-limit';

type GoogleTokenInfo = {
  aud?: string;
  iss?: string;
  sub?: string;
  email?: string;
  email_verified?: string;
  exp?: string;
  name?: string;
  picture?: string;
};

async function validarGoogleIdToken(token: string): Promise<GoogleTokenInfo | null> {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  if (!clientId) {
    console.error('[OAUTH-GOOGLE] Client ID ausente.');
    return null;
  }

  const response = await fetch(
    `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(token)}`,
    { cache: 'no-store' }
  );

  if (!response.ok) return null;

  const payload = (await response.json()) as GoogleTokenInfo;
  const issuerOk =
    payload.iss === 'accounts.google.com' ||
    payload.iss === 'https://accounts.google.com';
  const exp = Number(payload.exp || 0);

  if (
    payload.aud !== clientId ||
    !issuerOk ||
    payload.email_verified !== 'true' ||
    !payload.sub ||
    !payload.email ||
    !Number.isFinite(exp) ||
    exp * 1000 <= Date.now()
  ) {
    return null;
  }

  return payload;
}

export async function POST(request: NextRequest) {
  const rateOk = await consumeSecurityRateLimit({
    request,
    scope: 'google_oauth_callback',
    limit: 30,
    windowSeconds: 15 * 60,
  });

  if (!rateOk) {
    return NextResponse.json(
      { error: 'Muitas tentativas. Aguarde alguns minutos e tente novamente.' },
      { status: 429 }
    );
  }

  try {
    const body = (await request.json().catch(() => null)) as
      | { token?: string; trialPlanId?: string | null }
      | null;

    const token = body?.token?.trim();
    if (!token) {
      return NextResponse.json({ error: 'Credencial do Google ausente.' }, { status: 400 });
    }

    const google = await validarGoogleIdToken(token);
    if (!google?.email || !google.sub) {
      return NextResponse.json({ error: 'Credencial do Google inválida.' }, { status: 401 });
    }

    const email = google.email.trim().toLowerCase();
    const admin = createAdminClient();

    // A identidade só é aceita depois da validação do token no servidor.
    const { data: existingByEmail } = await admin
      .from('profiles')
      .select('id')
      .ilike('email', email)
      .maybeSingle();

    let userId = existingByEmail?.id ?? null;

    if (!userId) {
      const { data: newAuth, error: authError } = await admin.auth.admin.createUser({
        email,
        user_metadata: {
          name: google.name || email.split('@')[0],
          picture: google.picture || null,
          oauth_provider: 'google',
          google_sub: google.sub,
        },
        email_confirm: true,
      });

      if (authError || !newAuth.user) {
        console.error('[OAUTH-GOOGLE] Falha ao criar usuário:', authError?.message);
        return NextResponse.json({ error: 'Não foi possível concluir o login.' }, { status: 500 });
      }

      userId = newAuth.user.id;
    }

    const { data: authData, error: authUserError } = await admin.auth.admin.getUserById(userId);
    const bannedUntil = authData.user?.banned_until
      ? new Date(authData.user.banned_until).getTime()
      : 0;

    if (authUserError || bannedUntil > Date.now()) {
      return NextResponse.json({ error: 'Acesso indisponível.' }, { status: 403 });
    }

    let trialStarted = false;
    const trialPlanId = body?.trialPlanId?.trim();
    if (trialPlanId) {
      const trialResult = await iniciarTrialParaUsuario(
        admin,
        userId,
        trialPlanId,
        'google_oauth'
      );
      trialStarted = trialResult.ok;
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://somamentoria.com';
    const { data: sessionData, error: sessionError } = await admin.auth.admin.generateLink({
      type: 'magiclink',
      email,
      options: {
        redirectTo: `${siteUrl}/auth/confirm`,
      },
    });

    const actionLink = (sessionData?.properties as { action_link?: string } | undefined)?.action_link;
    if (sessionError || !actionLink) {
      console.error('[OAUTH-GOOGLE] Falha ao criar sessão:', sessionError?.message);
      return NextResponse.json({ error: 'Não foi possível concluir o login.' }, { status: 500 });
    }

    return NextResponse.json(
      { success: true, loginUrl: actionLink, trialStarted },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error) {
    console.error(
      '[OAUTH-GOOGLE] Falha inesperada:',
      error instanceof Error ? error.message : String(error)
    );
    return NextResponse.json({ error: 'Não foi possível concluir o login.' }, { status: 500 });
  }
}

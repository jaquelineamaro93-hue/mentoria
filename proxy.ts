import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  await supabase.auth.getSession();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;

  // Bloqueia requisições mutáveis iniciadas por outra origem no navegador.
  // Webhooks/server-to-server normalmente não enviam Origin e continuam válidos.
  if (
    path.startsWith('/api') &&
    !['GET', 'HEAD', 'OPTIONS'].includes(request.method)
  ) {
    const origin = request.headers.get('origin');
    if (origin && origin !== request.nextUrl.origin) {
      return NextResponse.json(
        { error: 'Origem não autorizada.' },
        { status: 403, headers: { 'Cache-Control': 'no-store' } }
      );
    }
  }

  // Defesa em profundidade: endpoints administrativos nunca são públicos.
  // Cada rota /api/admin também valida o papel novamente antes de usar service_role.
  if (path.startsWith('/api/admin')) {
    if (!user) {
      return NextResponse.json(
        { error: 'Não autenticado.' },
        { status: 401, headers: { 'Cache-Control': 'no-store' } }
      );
    }

    const { data: adminProfile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .maybeSingle();

    if (!adminProfile?.is_admin) {
      return NextResponse.json(
        { error: 'Acesso negado.' },
        { status: 403, headers: { 'Cache-Control': 'no-store' } }
      );
    }
  }

  const rotaLiberada =
    path.startsWith('/login') ||
    path.startsWith('/checkout') ||
    path === '/planos' ||
    path === '/reset-password' ||
    path === '/renovar' ||
    path.startsWith('/api') ||
    path.startsWith('/auth');

  if (user && !rotaLiberada) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('status_assinatura, origem_assinatura, is_admin, trial_status, trial_ends_at')
      .eq('id', user.id)
      .maybeSingle();

    const trialAtivo =
      profile?.trial_status === 'active' &&
      !!profile.trial_ends_at &&
      new Date(profile.trial_ends_at).getTime() > Date.now();

    const trialExpirado =
      profile?.trial_status === 'expired' ||
      (profile?.trial_status === 'active' &&
        !!profile.trial_ends_at &&
        new Date(profile.trial_ends_at).getTime() <= Date.now());

    const precisaPagar =
      profile &&
      !profile.is_admin &&
      !trialAtivo &&
      ((trialExpirado && profile.status_assinatura !== 'ativo') ||
        profile.status_assinatura === 'encerrado' ||
        (profile.status_assinatura === 'inadimplente' &&
          profile.origem_assinatura === 'mercadopago'));

    if (precisaPagar) {
      const url = request.nextUrl.clone();
      url.pathname = '/renovar';
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

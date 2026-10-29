import { safeSaasNext, isCheckoutAccessPath } from '@/lib/auth/saas-return';
import { saasCanVisit, type SaasAccess } from '@/lib/saas-access';
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
  // Redirect before rendering any documentation shell, including streamed RSC.
  if ((!user || user.is_anonymous) && (path === '/ajuda' || path.startsWith('/ajuda/') || path === '/novidades' || path === '/faq')) {
    const login = new URL('/login', request.url);
    login.searchParams.set('next', path);
    return NextResponse.redirect(login, { headers: { 'Cache-Control': 'private, no-store' } });
  }
  // An explicit mentorship selection replaces a previous SaaS navigation intent.
  if ((path === '/checkout' && request.nextUrl.searchParams.has('plan')) ||
      (path === '/login' && request.nextUrl.searchParams.has('trial_plan'))) {
    supabaseResponse.cookies.delete('soma_saas_intent');
  }

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

  if (!user && path === '/plataforma') {
    const login = new URL('/login', request.url);
    login.searchParams.set('next', '/plataforma' + request.nextUrl.search);
    login.searchParams.set('mode', 'cadastrar');
    const response = NextResponse.redirect(login);
    response.cookies.set('soma_saas_intent', encodeURIComponent('/plataforma' + request.nextUrl.search), { path: '/', maxAge: 3600, sameSite: 'lax', secure: true, httpOnly: true });
    return response;
  }
  // Preserve the selected SaaS configuration through password, Google and email login.
  if (user && (path === '/dashboard' || path === '/renovar') && request.cookies.get('soma_saas_intent')?.value) {
    let intent = '/plataforma';
    try { const value = decodeURIComponent(request.cookies.get('soma_saas_intent')!.value); intent = safeSaasNext(value) || '/plataforma'; } catch {}
    const response = NextResponse.redirect(new URL(intent, request.url));
    response.cookies.delete('soma_saas_intent');
    return response;
  }
  let saasOnly = false;
  if (user && !path.startsWith('/api/admin')) {
    const { data: access, error: accessError } = await supabase.rpc('soma_saas_state');
    if (accessError) return NextResponse.json({ error: 'Não foi possível validar seu acesso.' }, { status: 503 });
    const state = access as SaasAccess;
    saasOnly = state.saas && !state.mentorship;
    let allowed = saasCanVisit(state, path, request.nextUrl.search);
    // This shared endpoint chooses its module from a validated request body.
    if (saasOnly && path === '/api/ferramentas-soma/analisar' && request.method === 'POST') {
      const body = await request.clone().json().catch(() => null);
      const module = ({ linkedin: 'linkedin', gupy: 'curriculo-ats', cenario: 'desenvolvimento' } as Record<string,string>)[body?.ferramenta];
      allowed = !!module && state.modules.includes(module);
    }
    if (!allowed) {
      if (path.startsWith('/api/')) return NextResponse.json({ error: 'Este recurso não está incluído no seu plano.', href: '/plataforma' }, { status: 403 });
      return NextResponse.redirect(new URL('/plataforma', request.url));
    }
  }

  // Uma pausa voluntária interrompe a participação, não a consulta dos
  // termos, plano e privacidade. Também impede escrita por rotas internas.
  if (user && !saasOnly && !path.startsWith('/api/admin')) {
    const {data:identidade}=await supabase.from('profiles')
      .select('is_admin,status_assinatura').eq('id',user.id).maybeSingle();
    if(!identidade?.is_admin && identidade?.status_assinatura==='ativo') {
      const {data:pausa}=await supabase.from('mentoria_pausas')
        .select('id').eq('user_id',user.id).eq('status','ativa').limit(1).maybeSingle();
      if(pausa){
        if(path.startsWith('/api')) {
          const liberada=path.startsWith('/api/mentoria/pausa') ||
            path.startsWith('/api/auth/') || path === '/api/newsletter/unsubscribe' || path.startsWith('/api/product-events') ||
            path.startsWith('/api/trial/') || path.startsWith('/api/termos/') || path === '/api/ajuda/lidas';
          if(!liberada && !['GET','HEAD','OPTIONS'].includes(request.method))
            return NextResponse.json({error:'Sua mentoria está pausada. Retome no Meu Plano para continuar.'},
              {status:423,headers:{'Cache-Control':'no-store'}});
        }else{
          const permitida=path==='/ajuda'||path.startsWith('/ajuda/')||path==='/novidades'||path==='/faq'||path==='/meu-plano'||path.startsWith('/meu-plano/') ||
            path==='/contratos'||path==='/termos'||path.startsWith('/termos/') ||
            path==='/perfil'||path.startsWith('/perfil/') ||
            path==='/renovar'||path.startsWith('/auth/')||path.startsWith('/plataforma') ||
    path.startsWith('/login') ||
            path.startsWith('/checkout');
          if(!permitida){
            const destino=request.nextUrl.clone();
            destino.pathname='/meu-plano';
            destino.search='';
            return NextResponse.redirect(destino);
          }
        }
      }
    }
  }

  const rotaLiberada = isCheckoutAccessPath(path);

  if (user && !saasOnly && !rotaLiberada) {
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

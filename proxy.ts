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

  // Exchange automático de código para magiclink (fluxo de autenticação)
  const code = request.nextUrl.searchParams.get('code');
  if (code) {
    try {
      await supabase.auth.exchangeCodeForSession(code);
    } catch (error) {
      console.error('Erro ao exchanger código de autenticação:', error);
    }
  }

  // Mantém a sessão renovada (importante para Server Components)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const rotaLiberada =
    path.startsWith('/login') || path === '/renovar' || path.startsWith('/api');

  if (user && !rotaLiberada) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('status_assinatura, origem_assinatura, is_admin')
      .eq('id', user.id)
      .maybeSingle();

    const precisaPagar =
      profile &&
      !profile.is_admin &&
      (profile.status_assinatura === 'encerrado' ||
        (profile.status_assinatura === 'inadimplente' && profile.origem_assinatura === 'mercadopago'));

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

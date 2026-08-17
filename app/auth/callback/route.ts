import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') || '/reset-password';

  console.log('🔔 Auth Callback - Code:', !!code, 'Next:', next);

  if (code) {
    try {
      const supabase = await createClient();

      // Troca o code por sessão
      const { error } = await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        console.error('❌ Exchange error:', error);
        return NextResponse.redirect(
          new URL(`/login?error=exchange_failed`, request.url)
        );
      }

      console.log('✅ Session criada via callback');
      return NextResponse.redirect(new URL(next, request.url));
    } catch (error) {
      console.error('❌ Callback error:', error);
      return NextResponse.redirect(
        new URL('/login?error=callback_error', request.url)
      );
    }
  }

  return NextResponse.redirect(new URL('/login?error=no_code', request.url));
}

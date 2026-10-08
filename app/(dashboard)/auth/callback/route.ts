import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const rawNext = searchParams.get('next') || '/reset-password';
  const next =
    rawNext.startsWith('/') && !rawNext.startsWith('//')
      ? rawNext
      : '/reset-password';

  if (code) {
    try {
      const supabase = await createClient();

      // Troca o code por sessão
      const { error } = await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        console.error('[AUTH-CALLBACK] Exchange error:', error.message);
        return NextResponse.redirect(
          new URL(`/login?error=exchange_failed`, request.url)
        );
      }

      return NextResponse.redirect(new URL(next, request.url));
    } catch (error) {
      console.error('[AUTH-CALLBACK] Callback error:', error instanceof Error ? error.message : String(error));
      return NextResponse.redirect(
        new URL('/login?error=callback_error', request.url)
      );
    }
  }

  return NextResponse.redirect(new URL('/login?error=no_code', request.url));
}

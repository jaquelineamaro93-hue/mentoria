import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export type AdminAuthorization =
  | { ok: true; userId: string }
  | { ok: false; response: NextResponse };

export async function requireAdmin(): Promise<AdminAuthorization> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'Não autenticado.' },
        {
          status: 401,
          headers: { 'Cache-Control': 'no-store' },
        }
      ),
    };
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .maybeSingle();

  if (profileError || !profile?.is_admin) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'Acesso negado.' },
        {
          status: 403,
          headers: { 'Cache-Control': 'no-store' },
        }
      ),
    };
  }

  return { ok: true, userId: user.id };
}

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdmin } from '@/lib/security/require-admin';

export async function GET() {
  const authorization = await requireAdmin();
  if (!authorization.ok) return authorization.response;

  try {
    const supabase = createAdminClient();
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, nome, email, is_admin')
      .limit(100);

    if (error) {
      console.error('[ADMIN-LIST-USERS] Falha ao consultar usuários:', error.message);
      return NextResponse.json({ error: 'Erro ao listar usuários.' }, { status: 500 });
    }

    return NextResponse.json(
      { profiles, total: profiles?.length || 0 },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error) {
    console.error(
      '[ADMIN-LIST-USERS] Falha inesperada:',
      error instanceof Error ? error.message : String(error)
    );
    return NextResponse.json({ error: 'Erro ao listar usuários.' }, { status: 500 });
  }
}

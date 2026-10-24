import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getHelpAccess, listHelpReleases } from '@/lib/help-center/server';
import { isHelpId } from '@/lib/help-center/validation';

export async function POST(request: Request) {
  const origin = request.headers.get('origin');
  if (origin && origin !== new URL(request.url).origin) return NextResponse.json({ error: 'Origem não permitida.' }, { status: 403 });
  try {
    const context = await getHelpAccess();
    if (!context) return NextResponse.json({ error: 'Faça login.' }, { status: 401 });
    const body = await request.json().catch(() => null);
    if (!isHelpId(body?.release_id)) return NextResponse.json({ error: 'Novidade inválida.' }, { status: 400 });
    const allowed = (await listHelpReleases(context)).some(release => release.id === body.release_id);
    if (!allowed) return NextResponse.json({ error: 'Novidade indisponível.' }, { status: 404 });
    const { error } = await createAdminClient().from('soma_help_reads').upsert({
      user_id: context.userId, release_id: body.release_id, read_at: new Date().toISOString(),
    }, { onConflict: 'user_id,release_id' });
    if (error) throw error;
    return NextResponse.json({ ok: true }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch { return NextResponse.json({ error: 'Não foi possível registrar a leitura.' }, { status: 503 }); }
}

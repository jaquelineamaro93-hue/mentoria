import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { iniciarTrialParaUsuario } from '@/lib/trial';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Faça login para iniciar seu teste.' }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as
    | { planId?: string; source?: string }
    | null;

  const planId = body?.planId?.trim();
  if (!planId) {
    return NextResponse.json({ error: 'Plano não informado.' }, { status: 400 });
  }

  const resultado = await iniciarTrialParaUsuario(
    createAdminClient(),
    user.id,
    planId,
    body?.source?.trim().slice(0, 80) || 'portal'
  );

  if (!resultado.ok) {
    return NextResponse.json({ error: resultado.error }, { status: resultado.status });
  }

  return NextResponse.json(
    { trial: resultado },
    { headers: { 'Cache-Control': 'private, no-store' } }
  );
}

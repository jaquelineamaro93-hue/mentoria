import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { resolverAcessoSaas } from '@/lib/soma-saas-entitlements';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  const auth = await createClient();
  const { data: { user } } = await auth.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Faça login para consultar seu acesso.' }, { status: 401 });
  try {
    const acesso = await resolverAcessoSaas(user.id);
    return NextResponse.json(acesso, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch {
    return NextResponse.json({ error: 'Não foi possível consultar seu plano.' }, { status: 503 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function PATCH(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single();

  if (!profile?.is_admin) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as
    | { planId?: string; enabled?: boolean; days?: number; label?: string }
    | null;

  const planId = body?.planId?.trim();
  const days = Math.max(1, Math.min(15, Math.round(Number(body?.days) || 15)));

  if (!planId || typeof body?.enabled !== 'boolean') {
    return NextResponse.json({ error: 'Plano e configuração do trial são obrigatórios.' }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: plan, error } = await admin
    .from('planos_mentoria')
    .update({
      trial_enabled: body.enabled,
      trial_days: days,
      trial_label: body.label?.trim().slice(0, 80) || 'Teste grátis',
    })
    .eq('id', planId)
    .select('*')
    .single();

  if (error || !plan) {
    console.error('[ADMIN/TRIAL] Falha ao atualizar plano:', error?.message);
    return NextResponse.json({ error: 'Não foi possível atualizar o trial deste plano.' }, { status: 500 });
  }

  return NextResponse.json({ plan });
}

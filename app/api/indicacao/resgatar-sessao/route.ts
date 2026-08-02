import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
  }

  const { data: perfilAdmin } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single();

  if (!perfilAdmin?.is_admin) {
    return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 });
  }

  const body = await request.json();
  const mentoradoId: string = body.mentoradoId;

  if (!mentoradoId) {
    return NextResponse.json({ error: 'mentoradoId é obrigatório.' }, { status: 400 });
  }

  const { data: mentorado, error: erroBusca } = await supabase
    .from('profiles')
    .select('sessoes_bonus_resgatadas')
    .eq('id', mentoradoId)
    .single();

  if (erroBusca || !mentorado) {
    return NextResponse.json({ error: 'Mentorado não encontrado.' }, { status: 404 });
  }

  const { error } = await supabase
    .from('profiles')
    .update({ sessoes_bonus_resgatadas: mentorado.sessoes_bonus_resgatadas + 1 })
    .eq('id', mentoradoId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

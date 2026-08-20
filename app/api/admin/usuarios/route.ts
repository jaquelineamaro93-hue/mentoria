import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET() {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('profiles')
      .select('id, nome, email, is_admin, onboarding_concluido, created_at')
      .order('nome');
    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao listar' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, is_admin } = body;
    if (!userId) return NextResponse.json({ error: 'userId obrigatorio' }, { status: 400 });
    const supabase = createAdminClient();
    const { data, error } = await supabase.from('profiles').update({ is_admin }).eq('id', userId).select();
    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao atualizar' }, { status: 500 });
  }
}

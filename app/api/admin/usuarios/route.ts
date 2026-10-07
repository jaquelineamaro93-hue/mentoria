import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdmin } from '@/lib/security/require-admin';

export async function GET() {
  const authorization = await requireAdmin();
  if (!authorization.ok) return authorization.response;

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('profiles')
      .select('id, nome, email, is_admin, onboarding_concluido, created_at')
      .order('nome');
    if (error) throw error;

    return NextResponse.json(data, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch {
    return NextResponse.json({ error: 'Erro ao listar' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const authorization = await requireAdmin();
  if (!authorization.ok) return authorization.response;

  try {
    const body = await request.json();
    const { userId, is_admin } = body;

    if (!userId || typeof is_admin !== 'boolean') {
      return NextResponse.json(
        { error: 'userId e is_admin são obrigatórios' },
        { status: 400 }
      );
    }

    if (userId === authorization.userId && is_admin === false) {
      return NextResponse.json(
        { error: 'Você não pode remover seu próprio acesso administrativo.' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('profiles')
      .update({ is_admin })
      .eq('id', userId)
      .select('id, nome, email, is_admin');

    if (error) throw error;

    return NextResponse.json(data, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch {
    return NextResponse.json({ error: 'Erro ao atualizar' }, { status: 500 });
  }
}

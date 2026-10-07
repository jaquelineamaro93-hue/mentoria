import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdmin } from '@/lib/security/require-admin';

export async function POST(request: Request) {
  const authorization = await requireAdmin();
  if (!authorization.ok) return authorization.response;

  const { userId } = await request.json();

  if (!userId) {
    return NextResponse.json({ error: 'userId é obrigatório' }, { status: 400 });
  }

  if (userId === authorization.userId) {
    return NextResponse.json(
      { error: 'Você não pode excluir sua própria conta administrativa.' },
      { status: 400 }
    );
  }

  try {
    const supabase = createAdminClient();
    const { data: target } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', userId)
      .maybeSingle();

    if (target?.is_admin) {
      return NextResponse.json(
        { error: 'A exclusão de outra conta administrativa exige revisão manual.' },
        { status: 409 }
      );
    }

    const { error } = await supabase.auth.admin.deleteUser(userId);
    if (error) {
      console.error('[ADMIN-DELETE-USER] Falha ao excluir usuário:', error.message);
      return NextResponse.json({ error: 'Erro ao deletar usuário' }, { status: 500 });
    }

    return NextResponse.json(
      { message: 'Usuário deletado com sucesso' },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error) {
    console.error(
      '[ADMIN-DELETE-USER] Falha inesperada:',
      error instanceof Error ? error.message : String(error)
    );
    return NextResponse.json({ error: 'Erro ao processar' }, { status: 500 });
  }
}

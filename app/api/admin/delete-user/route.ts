import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdmin } from '@/lib/security/require-admin';

export async function POST(request: Request) {
  const authorization = await requireAdmin();
  if (!authorization.ok) return authorization.response;

  const body = await request.json().catch(() => null);
  const userId = body?.userId;

  if (typeof userId !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)) {
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
    const { data: target, error: targetError } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', userId)
      .maybeSingle();

    if (targetError) return NextResponse.json({ error: 'Não foi possível verificar a conta. Tente novamente.' }, { status: 503 });

    if (target?.is_admin) {
      return NextResponse.json(
        { error: 'A exclusão de outra conta administrativa exige revisão manual.' },
        { status: 409 }
      );
    }

    const { data, error } = await supabase.rpc('soma_delete_empty_account', {
      p_user: userId, p_actor: authorization.userId,
    });
    if (error) {
      console.error('[ADMIN-DELETE-USER] Falha na exclusão protegida:', error.code);
      return NextResponse.json({ error: 'Não foi possível excluir. Nenhum histórico foi apagado.' }, { status: 500 });
    }
    if (!data?.deleted) {
      const messages: Record<string, string> = {
        historical_account: 'Conta de aluno anterior ao lançamento do SaaS. A exclusão foi bloqueada para preservar o histórico.',
        financial_history: 'Esta conta tem assinatura ou registros financeiros. A exclusão foi bloqueada para preservar os dados.',
        saved_history: 'Esta conta possui conteúdo salvo. A exclusão foi bloqueada para preservar o histórico.',
        saved_files: 'Esta conta possui arquivos salvos. A exclusão foi bloqueada para preservar os arquivos.',
        protected_account: 'Esta conta não pode ser excluída por este atalho.',
        not_found: 'Conta não encontrada.',
      };
      return NextResponse.json({ error: messages[data?.reason] || 'A exclusão foi bloqueada para preservar os dados.' }, { status: data?.reason === 'not_found' ? 404 : 409 });
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

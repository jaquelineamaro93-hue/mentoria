import { createAdminClient } from '@/lib/supabase/admin';

export async function registrarPedido(input: {
  user_id: string | null; email: string; tipo: 'plano' | 'credito_simulacao_cv' | 'sessao_extra';
  valor: number; plano_id?: string; forma_pagamento: string;
}) {
  if (!Number.isFinite(input.valor) || input.valor <= 0) throw new Error('Valor do pedido inválido.');
  const admin = createAdminClient();
  const { data, error } = await admin.from('mp_pedidos').insert(input).select('id').single();
  if (error || !data) throw new Error('Não foi possível registrar o pedido.');
  return { admin, id: data.id as string };
}

export async function vincularCobranca(admin: ReturnType<typeof createAdminClient>, id: string, mpId: string) {
  const { error } = await admin.from('mp_pedidos').update({ mp_resource_id: mpId }).eq('id', id);
  if (error) throw new Error('Não foi possível vincular a cobrança ao pedido.');
}

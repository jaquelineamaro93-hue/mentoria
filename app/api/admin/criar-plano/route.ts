import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

// POST /api/admin/criar-plano
// Cria um novo plano em planos_mentoria (ex: planos de cortesia, turmas com
// preço diferente). Só admin pode chamar, porque a tabela só tem policy de
// SELECT pra usuários autenticados.
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ erro: 'Não autorizado.' }, { status: 401 });
  }

  const { data: perfil } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single();

  if (!perfil?.is_admin) {
    return NextResponse.json({ erro: 'Não autorizado.' }, { status: 403 });
  }

  const { nome, duracaoMeses, precoAvista, precoCartao, precoRecorrenteTotal } = await req.json();

  if (!nome || !duracaoMeses) {
    return NextResponse.json({ erro: 'Nome e duração são obrigatórios.' }, { status: 400 });
  }

  const codigo = nome
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');

  const admin = createAdminClient();
  const { data: plano, error } = await admin
    .from('planos_mentoria')
    .insert({
      codigo: `${codigo}_${Date.now().toString(36)}`,
      nome,
      duracao_meses: Number(duracaoMeses),
      preco_avista: Number(precoAvista) || 0,
      preco_cartao: Number(precoCartao) || Number(precoAvista) || 0,
      preco_recorrente_total: Number(precoRecorrenteTotal) || Number(precoAvista) || 0,
      parcelas_recorrente: 1,
      ativo: true,
    })
    .select()
    .single();

  if (error || !plano) {
    return NextResponse.json({ erro: 'Não consegui criar o plano.' }, { status: 500 });
  }

  return NextResponse.json({ plano });
}

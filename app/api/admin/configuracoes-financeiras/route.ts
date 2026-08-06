import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// POST /api/admin/configuracoes-financeiras
// Body: { despesasMensais: number }
// Atualiza a única linha de configuracoes_financeiras (usada pro cálculo
// de ponto de equilíbrio no painel Financeiro). Só admin pode chamar.
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

  const { despesasMensais } = await req.json();
  if (typeof despesasMensais !== 'number' || despesasMensais < 0) {
    return NextResponse.json({ erro: 'Valor inválido.' }, { status: 400 });
  }

  const { data: existente } = await supabase
    .from('configuracoes_financeiras')
    .select('id')
    .order('atualizado_em', { ascending: false })
    .limit(1)
    .maybeSingle();

  const { error } = existente
    ? await supabase
        .from('configuracoes_financeiras')
        .update({ despesas_mensais: despesasMensais, atualizado_em: new Date().toISOString() })
        .eq('id', existente.id)
    : await supabase
        .from('configuracoes_financeiras')
        .insert({ despesas_mensais: despesasMensais });

  if (error) {
    return NextResponse.json({ erro: 'Não consegui salvar.' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

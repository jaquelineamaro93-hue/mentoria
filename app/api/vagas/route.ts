import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET - Listar vagas do mentorado
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: user } = await supabase.auth.getUser();

    if (!user.user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { data: vagas, error } = await supabase
      .from('vagas_candidatura')
      .select('*')
      .eq('mentorado_id', user.user.id)
      .order('updated_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: 'Erro ao buscar vagas' }, { status: 500 });
    }

    return NextResponse.json({ vagas });
  } catch (error) {
    console.error('🔴 [VAGAS-GET] Erro:', error);
    return NextResponse.json({ error: 'Erro ao processar' }, { status: 500 });
  }
}

// POST - Criar nova vaga
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: user } = await supabase.auth.getUser();

    if (!user.user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { empresa, cargo, descricao_vaga, link_vaga, etapa, observacoes } =
      await request.json();

    if (!empresa || !cargo) {
      return NextResponse.json(
        { error: 'empresa e cargo são obrigatórios' },
        { status: 400 }
      );
    }

    const { data: vaga, error } = await supabase
      .from('vagas_candidatura')
      .insert({
        mentorado_id: user.user.id,
        empresa,
        cargo,
        descricao_vaga,
        link_vaga,
        etapa: etapa || 'para_aplicar',
        observacoes,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: 'Erro ao criar vaga' }, { status: 500 });
    }

    return NextResponse.json({ vaga }, { status: 201 });
  } catch (error) {
    console.error('🔴 [VAGAS-POST] Erro:', error);
    return NextResponse.json({ error: 'Erro ao processar' }, { status: 500 });
  }
}

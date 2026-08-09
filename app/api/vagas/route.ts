import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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
      console.error('🔴 [VAGAS-GET] Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ vagas });
  } catch (error) {
    console.error('🔴 [VAGAS-GET] Exception:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: user } = await supabase.auth.getUser();

    if (!user.user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const { empresa, cargo } = body;

    if (!empresa || !cargo) {
      return NextResponse.json(
        { error: 'empresa e cargo são obrigatórios' },
        { status: 400 }
      );
    }

    console.log('📝 [VAGAS-POST] Inserindo:', { mentorado_id: user.user.id, ...body });

    const { data: vaga, error } = await supabase
      .from('vagas_candidatura')
      .insert({
        mentorado_id: user.user.id,
        empresa: body.empresa,
        cargo: body.cargo,
        descricao_vaga: body.descricao_vaga,
        link_vaga: body.link_vaga,
        proximo_passo: null,
        observacoes: null,
        etapa: body.etapa || 'para_aplicar',
      })
      .select()
      .single();

    if (error) {
      console.error('🔴 [VAGAS-POST] DB Error:', error);
      return NextResponse.json({ error: error.message, code: error.code }, { status: 500 });
    }

    console.log('✅ [VAGAS-POST] Criada:', vaga);
    return NextResponse.json({ vaga }, { status: 201 });
  } catch (error) {
    console.error('🔴 [VAGAS-POST] Exception:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: user } = await supabase.auth.getUser();

    if (!user?.user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const { vaga_id, readiness_score, readiness_gap, weeks_to_ready, estimated_readiness_date, roadmap_items } = body;

    if (!vaga_id) {
      return NextResponse.json({ error: 'vaga_id é obrigatório' }, { status: 400 });
    }

    const { data: vaga } = await supabase.from('vagas_candidatura').select('mentorado_id').eq('id', vaga_id).single();

    if (!vaga || vaga.mentorado_id !== user.user.id) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const { data: vagaAtualizada, error } = await supabase
      .from('vagas_candidatura')
      .update({
        readiness_score,
        readiness_gap,
        weeks_to_ready,
        estimated_readiness_date,
        roadmap_items: roadmap_items || [],
        updated_at: new Date().toISOString(),
      })
      .eq('id', vaga_id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: 'Erro ao atualizar readiness' }, { status: 500 });
    }

    return NextResponse.json({ vaga: vagaAtualizada });
  } catch (error) {
    console.error('🔴 [READINESS-POST] Erro:', error);
    return NextResponse.json({ error: 'Erro ao processar' }, { status: 500 });
  }
}

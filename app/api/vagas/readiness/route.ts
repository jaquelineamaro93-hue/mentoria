import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: user } = await supabase.auth.getUser();

    if (!user.user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const {
      vaga_id,
      readiness_score,
      readiness_gap,
      weeks_to_ready,
      estimated_readiness_date,
      roadmap_items,
    } = await request.json();

    if (!vaga_id || readiness_score === undefined) {
      return NextResponse.json(
        { error: 'vaga_id e readiness_score são obrigatórios' },
        { status: 400 }
      );
    }

    const { data: vaga } = await supabase
      .from('vagas_candidatura')
      .select('id')
      .eq('id', vaga_id)
      .eq('mentorado_id', user.user.id)
      .single();

    if (!vaga) {
      return NextResponse.json({ error: 'Vaga não encontrada' }, { status: 404 });
    }

    const { data: existingRoadmap } = await supabase
      .from('vaga_readiness_roadmap')
      .select('id')
      .eq('vaga_id', vaga_id)
      .single();

    if (existingRoadmap) {
      const { data: updatedRoadmap, error } = await supabase
        .from('vaga_readiness_roadmap')
        .update({
          readiness_score,
          readiness_gap,
          weeks_to_ready,
          estimated_readiness_date,
          roadmap_items,
          total_items: (roadmap_items || []).length,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingRoadmap.id)
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: 'Erro ao atualizar roadmap' }, { status: 500 });
      }

      return NextResponse.json({ roadmap: updatedRoadmap });
    }

    const { data: roadmap, error } = await supabase
      .from('vaga_readiness_roadmap')
      .insert({
        vaga_id,
        mentorado_id: user.user.id,
        readiness_score,
        readiness_gap,
        weeks_to_ready,
        estimated_readiness_date,
        roadmap_items,
        total_items: (roadmap_items || []).length,
        progress_percentage: 0,
        items_completed: 0,
      })
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar roadmap:', error);
      return NextResponse.json({ error: 'Erro ao criar roadmap' }, { status: 500 });
    }

    return NextResponse.json({ roadmap }, { status: 201 });
  } catch (error) {
    console.error('🔴 [READINESS] Erro:', error);
    return NextResponse.json({ error: 'Erro ao processar' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: user } = await supabase.auth.getUser();

    if (!user.user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const vagaId = request.nextUrl.searchParams.get('vaga_id');

    if (!vagaId) {
      return NextResponse.json({ error: 'vaga_id obrigatório' }, { status: 400 });
    }

    const { data: roadmap, error } = await supabase
      .from('vaga_readiness_roadmap')
      .select('*')
      .eq('vaga_id', vagaId)
      .eq('mentorado_id', user.user.id)
      .single();

    if (error) {
      return NextResponse.json({ error: 'Roadmap não encontrado' }, { status: 404 });
    }

    return NextResponse.json({ roadmap });
  } catch (error) {
    console.error('🔴 [READINESS-GET] Erro:', error);
    return NextResponse.json({ error: 'Erro ao processar' }, { status: 500 });
  }
}

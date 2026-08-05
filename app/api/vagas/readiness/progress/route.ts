import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: user } = await supabase.auth.getUser();

    if (!user.user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { roadmap_id, item_index, completed, notes } = await request.json();

    if (roadmap_id === undefined || item_index === undefined || completed === undefined) {
      return NextResponse.json(
        { error: 'roadmap_id, item_index e completed são obrigatórios' },
        { status: 400 }
      );
    }

    const { data: roadmap } = await supabase
      .from('vaga_readiness_roadmap')
      .select('id')
      .eq('id', roadmap_id)
      .eq('mentorado_id', user.user.id)
      .single();

    if (!roadmap) {
      return NextResponse.json({ error: 'Roadmap não encontrado' }, { status: 404 });
    }

    const { data: existingProgress } = await supabase
      .from('readiness_progress')
      .select('id')
      .eq('roadmap_id', roadmap_id)
      .eq('item_index', item_index)
      .single();

    if (existingProgress) {
      const { data: updated, error } = await supabase
        .from('readiness_progress')
        .update({
          completed,
          completed_at: completed ? new Date().toISOString() : null,
          notes,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingProgress.id)
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: 'Erro ao atualizar progresso' }, { status: 500 });
      }

      return NextResponse.json({ progress: updated });
    }

    const { data: progress, error } = await supabase
      .from('readiness_progress')
      .insert({
        roadmap_id,
        item_index,
        completed,
        completed_at: completed ? new Date().toISOString() : null,
        notes,
      })
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar progresso:', error);
      return NextResponse.json({ error: 'Erro ao criar progresso' }, { status: 500 });
    }

    return NextResponse.json({ progress }, { status: 201 });
  } catch (error) {
    console.error('🔴 [READINESS-PROGRESS] Erro:', error);
    return NextResponse.json({ error: 'Erro ao processar' }, { status: 500 });
  }
}

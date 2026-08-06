import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET - Buscar vaga específica
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: user } = await supabase.auth.getUser();

    if (!user.user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { data: vaga, error } = await supabase
      .from('vagas_candidatura')
      .select('*')
      .eq('id', id)
      .eq('mentorado_id', user.user.id)
      .single();

    if (error || !vaga) {
      return NextResponse.json({ error: 'Vaga não encontrada' }, { status: 404 });
    }

    return NextResponse.json({ vaga });
  } catch (error) {
    console.error('🔴 [VAGA-GET] Erro:', error);
    return NextResponse.json({ error: 'Erro ao processar' }, { status: 500 });
  }
}

// PATCH - Atualizar vaga
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: user } = await supabase.auth.getUser();

    if (!user.user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const updateData = await request.json();

    // Verificar se a vaga pertence ao usuário
    const { data: vaga } = await supabase
      .from('vagas_candidatura')
      .select('mentorado_id')
      .eq('id', id)
      .single();

    if (!vaga || vaga.mentorado_id !== user.user.id) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const { data: vagaAtualizada, error } = await supabase
      .from('vagas_candidatura')
      .update({
        ...updateData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: 'Erro ao atualizar vaga' }, { status: 500 });
    }

    return NextResponse.json({ vaga: vagaAtualizada });
  } catch (error) {
    console.error('🔴 [VAGA-PATCH] Erro:', error);
    return NextResponse.json({ error: 'Erro ao processar' }, { status: 500 });
  }
}

// DELETE - Deletar vaga
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: user } = await supabase.auth.getUser();

    if (!user.user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    // Verificar se a vaga pertence ao usuário
    const { data: vaga } = await supabase
      .from('vagas_candidatura')
      .select('mentorado_id')
      .eq('id', id)
      .single();

    if (!vaga || vaga.mentorado_id !== user.user.id) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const { error } = await supabase
      .from('vagas_candidatura')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: 'Erro ao deletar vaga' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('🔴 [VAGA-DELETE] Erro:', error);
    return NextResponse.json({ error: 'Erro ao processar' }, { status: 500 });
  }
}

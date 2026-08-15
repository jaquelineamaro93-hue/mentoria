import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: user } = await supabase.auth.getUser();

    if (!user.user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, nome, email, is_admin, created_at')
      .order('nome', { ascending: true });

    if (!profiles) {
      return NextResponse.json([]);
    }

    return NextResponse.json(profiles);
  } catch (error) {
    console.error('Erro ao buscar usuários:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar usuários' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: user } = await supabase.auth.getUser();

    if (!user.user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { userId, is_admin } = await request.json();

    const { error } = await supabase
      .from('profiles')
      .update({ is_admin })
      .eq('id', userId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar usuário' },
      { status: 500 }
    );
  }
}

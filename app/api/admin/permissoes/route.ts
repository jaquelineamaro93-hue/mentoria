import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

const PERMISSOES_VALIDAS = [
  'pode_ver_dashboard',
  'pode_editar_vagas',
  'pode_editar_mentorados',
  'pode_ver_financeiro',
  'pode_editar_conteudo',
];

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: user } = await supabase.auth.getUser();

    if (!user.user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { data: meuPerfil } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.user.id)
      .single();

    if (!meuPerfil?.is_admin) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
    }

    const { data: usuarios } = await supabase
      .from('profiles')
      .select('id, nome, email, is_admin, pode_ver_dashboard, pode_editar_vagas, pode_editar_mentorados, pode_ver_financeiro, pode_editar_conteudo, created_at')
      .order('created_at', { ascending: false });

    return NextResponse.json({ usuarios });
  } catch (error) {
    console.error('🔴 [PERMISSOES] Erro:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar permissões' },
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

    const { data: meuPerfil } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.user.id)
      .single();

    if (!meuPerfil?.is_admin) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
    }

    const body = await request.json();
    const { userId, permissao, valor } = body;

    if (!PERMISSOES_VALIDAS.includes(permissao)) {
      return NextResponse.json(
        { error: 'Permissão inválida' },
        { status: 400 }
      );
    }

    const admin = await createAdminClient();
    const { error } = await admin
      .from('profiles')
      .update({ [permissao]: valor })
      .eq('id', userId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('🔴 [PERMISSOES UPDATE] Erro:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar permissão' },
      { status: 500 }
    );
  }
}

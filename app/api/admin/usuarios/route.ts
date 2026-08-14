import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

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
      .select('id, nome, email, is_admin, created_at')
      .order('created_at', { ascending: false });

    return NextResponse.json({ usuarios });
  } catch (error) {
    console.error('🔴 [USUARIOS] Erro:', error);
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

    const { data: meuPerfil } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.user.id)
      .single();

    if (!meuPerfil?.is_admin) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
    }

    const body = await request.json();
    const { userId, isAdmin } = body;

    const admin = await createAdminClient();
    const { error } = await admin
      .from('profiles')
      .update({ is_admin: isAdmin })
      .eq('id', userId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('🔴 [USUARIOS UPDATE] Erro:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar usuário' },
      { status: 500 }
    );
  }
}

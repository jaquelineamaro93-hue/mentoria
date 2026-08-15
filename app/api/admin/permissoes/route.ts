import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: user } = await supabase.auth.getUser();

    if (!user.user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    return NextResponse.json([]);
  } catch (error) {
    console.error('Erro ao buscar permissões:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar permissões' },
      { status: 500 }
    );
  }
}

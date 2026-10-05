import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    // A navegação feita pela admin usando "Entrar como" não pode contar
    // como atividade real do mentorado.
    const impersonatedUserId = request.cookies.get('soma_impersonation_target')?.value;
    if (impersonatedUserId === user.id) {
      return new NextResponse(null, {
        status: 204,
        headers: { 'Cache-Control': 'private, no-store' },
      });
    }

    const { error } = await supabase.rpc('registrar_atividade_portal');
    if (error) {
      console.error('[ACTIVITY] Falha ao registrar atividade:', error.message);
      return NextResponse.json(
        { error: 'Não foi possível registrar atividade.' },
        { status: 500, headers: { 'Cache-Control': 'private, no-store' } }
      );
    }

    return new NextResponse(null, {
      status: 204,
      headers: { 'Cache-Control': 'private, no-store' },
    });
  } catch (error) {
    console.error('[ACTIVITY] Erro inesperado:', error);
    return NextResponse.json(
      { error: 'Erro ao registrar atividade.' },
      { status: 500, headers: { 'Cache-Control': 'private, no-store' } }
    );
  }
}

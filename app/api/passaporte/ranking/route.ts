import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

type RankingRow = {
  user_id: string;
  nome: string;
  foto_url: string | null;
  pontos: number | null;
};

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { data, error } = await supabase.rpc('listar_ranking_comunidade');

    if (error) {
      console.error('[RANKING] Falha ao consultar ranking:', error.message);
      return NextResponse.json(
        { error: 'Não foi possível carregar o ranking agora.' },
        {
          status: 500,
          headers: { 'Cache-Control': 'private, no-store' },
        }
      );
    }

    const ranking = ((data ?? []) as RankingRow[]).map((profile, index) => ({
      posicao: index + 1,
      userId: profile.user_id,
      nome: profile.nome || 'Sem nome',
      foto_url: profile.foto_url,
      pontos: Number(profile.pontos ?? 0),
    }));

    const posicaoUsuario =
      ranking.find((item) => item.userId === user.id)?.posicao ?? null;

    return NextResponse.json(
      {
        ranking,
        usuarioLogado: {
          userId: user.id,
          posicao: posicaoUsuario,
        },
      },
      {
        headers: { 'Cache-Control': 'private, no-store' },
      }
    );
  } catch (error) {
    console.error('[RANKING] Erro inesperado:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar ranking' },
      {
        status: 500,
        headers: { 'Cache-Control': 'private, no-store' },
      }
    );
  }
}

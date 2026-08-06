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
      .select('id, nome, foto_url, pontos_total')
      .order('pontos_total', { ascending: false });

    if (!profiles) {
      return NextResponse.json({ ranking: [] });
    }

    const rankingData = profiles.map((profile) => {
      const pontos = profile.pontos_total || 0;

      return {
        userId: profile.id,
        nome: profile.nome || 'Sem nome',
        foto_url: profile.foto_url,
        pontos,
      };
    });

    const rankingComPosicao = rankingData.map((item, index) => ({
      posicao: index + 1,
      ...item,
    }));

    const posicaoUsuario =
      rankingComPosicao.find((item) => item.userId === user.user.id)?.posicao ||
      null;

    return NextResponse.json({
      ranking: rankingComPosicao,
      usuarioLogado: {
        userId: user.user.id,
        posicao: posicaoUsuario,
      },
    });
  } catch (error) {
    console.error('🔴 [RANKING] Erro:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar ranking' },
      { status: 500 }
    );
  }
}

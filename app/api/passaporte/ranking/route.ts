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
      .select('id, nome, avatar_url')
      .order('nome', { ascending: true });

    if (!profiles) {
      return NextResponse.json({ ranking: [] });
    }

    const rankingData = await Promise.all(
      profiles.map(async (profile) => {
        const { count: analisadas } = await supabase
          .from('jobs')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', profile.id);

        const { count: entrevistas } = await supabase
          .from('jobs')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', profile.id)
          .eq('etapa', 'entrevista_agendada');

        const { data: jobs } = await supabase
          .from('jobs')
          .select('fit_score')
          .eq('user_id', profile.id)
          .not('fit_score', 'is', null);

        const fitMedio =
          jobs && jobs.length > 0
            ? Math.round(
                jobs.reduce((sum, job) => sum + (job.fit_score || 0), 0) /
                  jobs.length
              )
            : 0;

        const { data: xpRecords } = await supabase
          .from('user_xp')
          .select('points')
          .eq('user_id', profile.id);

        const totalXp =
          xpRecords?.reduce((sum, record) => sum + (record.points || 0), 0) ||
          0;

        const pontos =
          (analisadas || 0) * 20 +
          (entrevistas || 0) * 100 +
          totalXp;

        return {
          userId: profile.id,
          nome: profile.nome || 'Sem nome',
          avatar_url: profile.avatar_url,
          aplicacoes: analisadas || 0,
          entrevistas: entrevistas || 0,
          fitMedio,
          pontos,
        };
      })
    );

    const ranking = rankingData.sort((a, b) => b.pontos - a.pontos);
    const rankingComPosicao = ranking.map((item, index) => ({
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

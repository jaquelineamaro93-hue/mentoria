import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { chamarClaudeJson } from '@/lib/ai-json';
import { montarPromptSimuladorCV } from '@/lib/prompts';

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
  }

  const body = await request.json();
  const curriculo: string = body.curriculo?.trim();
  const vaga: string = body.vaga?.trim();

  if (!curriculo || !vaga) {
    return NextResponse.json(
      { error: 'Cole o currículo e a descrição da vaga antes de analisar.' },
      { status: 400 }
    );
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('creditos_simulacao_cv')
    .eq('id', user.id)
    .single();

  const inicioDoMes = new Date();
  inicioDoMes.setDate(1);
  inicioDoMes.setHours(0, 0, 0, 0);

  const { count: usadasEsteMes } = await supabase
    .from('cv_simulacoes')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .gte('created_at', inicioDoMes.toISOString());

  const LIMITE_GRATIS_MES = 3;
  const jaUsouGratis = (usadasEsteMes ?? 0) >= LIMITE_GRATIS_MES;
  const temCredito = (profile?.creditos_simulacao_cv ?? 0) > 0;

  if (jaUsouGratis && !temCredito) {
    return NextResponse.json(
      {
        error: 'limite_atingido',
        mensagem: `Você já usou suas ${LIMITE_GRATIS_MES} simulações gratuitas deste mês. Cada simulação extra custa R$ 5.`,
      },
      { status: 402 }
    );
  }

  try {
    const prompt = montarPromptSimuladorCV(curriculo, vaga);
    const resultadoJson = await chamarClaudeJson<Record<string, any>>(prompt, {
      maxTokens: 8000,
      descricao: 'simulação de currículo',
      validar: (valor): valor is Record<string, any> => {
        if (!valor || typeof valor !== 'object' || Array.isArray(valor)) return false;
        const item = valor as Record<string, unknown>;
        return (
          typeof item.fit_percentual === 'number' &&
          Array.isArray(item.pontos_fortes) &&
          Array.isArray(item.pontos_atencao) &&
          typeof item.curriculo_final_markdown === 'string' &&
          typeof item.carta_apresentacao_markdown === 'string' &&
          Array.isArray(item.perguntas_entrevista)
        );
      },
    });

    if (jaUsouGratis && temCredito) {
      await supabase
        .from('profiles')
        .update({ creditos_simulacao_cv: (profile?.creditos_simulacao_cv ?? 1) - 1 })
        .eq('id', user.id);
    }

    const { data: simulacao, error } = await supabase
      .from('cv_simulacoes')
      .insert({
        user_id: user.id,
        curriculo_texto: curriculo,
        vaga_texto: vaga,
        resultado_markdown: resultadoJson.curriculo_final_markdown ?? '',
        resultado_json: resultadoJson,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ simulacao });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro desconhecido.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

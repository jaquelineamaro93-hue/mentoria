import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { chamarClaude } from '@/lib/anthropic';
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

  try {
    const prompt = montarPromptSimuladorCV(curriculo, vaga);
    const respostaTexto = await chamarClaude(prompt, 8000);
    const limpo = respostaTexto.replace(/```json|```/g, '').trim();

    let resultadoJson;
    try {
      resultadoJson = JSON.parse(limpo);
    } catch (parseErr) {
      console.error('Falha ao interpretar JSON da IA:', parseErr, '\nResposta recebida:', limpo);
      return NextResponse.json(
        {
          error:
            'A análise ficou grande demais e foi cortada no meio. Tenta novamente, ou encurta um pouco o texto do currículo e da vaga.',
        },
        { status: 500 }
      );
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

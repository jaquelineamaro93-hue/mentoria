import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { chamarClaude } from '@/lib/anthropic';
import { montarPromptAnaliseVia } from '@/lib/prompts';

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const forcas: string[] = body?.forcas;
  const dataTeste: string = body?.data_teste;

  if (!Array.isArray(forcas) || forcas.length !== 24) {
    return NextResponse.json(
      { error: 'É preciso informar as 24 forças em ordem.' },
      { status: 400 }
    );
  }

  if (!dataTeste) {
    return NextResponse.json(
      { error: 'Informe a data de realização do VIA.' },
      { status: 400 }
    );
  }

  const unicas = new Set(forcas);
  if (unicas.size !== 24 || forcas.some((forca) => !forca || typeof forca !== 'string')) {
    return NextResponse.json(
      { error: 'As 24 forças precisam estar preenchidas e sem repetições.' },
      { status: 400 }
    );
  }

  const admin = createAdminClient();

  // Primeiro preserva a medição. A IA nunca deve ser um pré-requisito para salvar o dado do aluno.
  const { data: resultadoSalvo, error: saveError } = await admin
    .from('via_resultados')
    .insert({
      user_id: user.id,
      forcas,
      data_teste: dataTeste,
      analise_ia: null,
      analise_status: 'pendente',
      analise_erro: null,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (saveError || !resultadoSalvo) {
    console.error('[VIA] Falha ao salvar a medição antes da IA:', saveError?.message);
    return NextResponse.json(
      { error: 'Não foi possível salvar sua medição VIA com segurança.' },
      { status: 500 }
    );
  }

  try {
    const prompt = montarPromptAnaliseVia(forcas);
    const analise = await chamarClaude(prompt, 2600);

    const { data: resultadoFinal, error: updateError } = await admin
      .from('via_resultados')
      .update({
        analise_ia: analise,
        analise_status: 'concluida',
        analise_erro: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', resultadoSalvo.id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (updateError || !resultadoFinal) {
      console.error('[VIA] Medição salva, mas análise não foi persistida:', updateError?.message);

      await admin
        .from('via_resultados')
        .update({
          analise_status: 'erro',
          analise_erro: 'A análise foi gerada, mas não pôde ser anexada à medição.',
          updated_at: new Date().toISOString(),
        })
        .eq('id', resultadoSalvo.id)
        .eq('user_id', user.id);

      return NextResponse.json({
        resultado: resultadoSalvo,
        analise_pendente: true,
        aviso:
          'Seu resultado VIA foi salvo. A leitura automática não pôde ser anexada agora, mas nenhuma resposta foi perdida.',
      });
    }

    return NextResponse.json({ resultado: resultadoFinal, analise_pendente: false });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro desconhecido.';

    console.error('[VIA] Medição salva, mas a IA falhou:', message);

    await admin
      .from('via_resultados')
      .update({
        analise_status: 'erro',
        analise_erro: message.slice(0, 1000),
        updated_at: new Date().toISOString(),
      })
      .eq('id', resultadoSalvo.id)
      .eq('user_id', user.id);

    return NextResponse.json({
      resultado: {
        ...resultadoSalvo,
        analise_status: 'erro',
      },
      analise_pendente: true,
      aviso:
        'Seu resultado VIA foi salvo com as 24 forças. A leitura automática falhou agora, mas seus dados estão preservados.',
    });
  }
}

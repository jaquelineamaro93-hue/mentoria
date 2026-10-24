import { requireProductAccess } from '@/lib/security/require-product-access';
import { NextResponse } from 'next/server';
import { consumeIdentifierRateLimit } from '@/lib/security/rate-limit';
import { createClient } from '@/lib/supabase/server';
import { chamarClaudeJson } from '@/lib/ai-json';
import { BLOCOS_QUEM_SOU_EU, montarPromptMapaInterpretativo } from '@/lib/prompts';
import {
  assinaturaRespostas, serializarMapaInterpretativo,
  validarAnaliseMapa, type AnaliseMapaIA,
} from '@/lib/mapa-interpretativo';

export async function POST(request: Request) {
  const productAuthorization = await requireProductAccess('autoconhecimento');
  if (!productAuthorization.ok) return productAuthorization.response;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
  }

  const aiAllowed = await consumeIdentifierRateLimit({
    scope: 'ai_mapa_essencia',
    identifier: user.id,
    limit: 30,
    windowSeconds: 60 * 60,
  });

  if (!aiAllowed) {
    return NextResponse.json(
      { error: 'Limite temporário atingido. Tente novamente mais tarde.' },
      { status: 429 }
    );
  }

  const { data: respostasRaw } = await supabase
    .from('quem_sou_eu_respostas')
    .select('bloco, resposta')
    .eq('user_id', user.id);

  if (!respostasRaw || BLOCOS_QUEM_SOU_EU.some(bloco => !respostasRaw.find(resposta => resposta.bloco === bloco.codigo && typeof resposta.resposta === 'string' && resposta.resposta.trim().length > 0))) {
    return NextResponse.json(
      { error: 'Responda todos os 9 blocos antes de gerar o mapa.' },
      { status: 400 }
    );
  }

  const respostas: Record<string, string> = {};
  for (const r of respostasRaw) {
    respostas[r.bloco] = r.resposta;
  }

  try {
    const prompt = montarPromptMapaInterpretativo(respostas);
    const interpretacao = await chamarClaudeJson<AnaliseMapaIA>(prompt, {
      maxTokens: 4500,
      descricao: 'interpretação do Mapa Quem Sou Eu',
      validar: validarAnaliseMapa,
    });
    const conteudo = serializarMapaInterpretativo({
      ...interpretacao,
      versao: 1,
      fonte_hash: assinaturaRespostas(respostas),
    });

    const { data: mapa, error } = await supabase
      .from('mapa_essencia')
      .insert({ user_id: user.id, conteudo_markdown: conteudo })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ mapa });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro desconhecido.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

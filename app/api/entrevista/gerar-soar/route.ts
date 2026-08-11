import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import Anthropic from '@anthropic-ai/sdk';

export const maxDuration = 120;

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: 'Serviço de IA não configurado. Avise o suporte.' },
        { status: 503 }
      );
    }

    const { curriculo, descricaoVaga } = await request.json();

    if (!curriculo || !descricaoVaga) {
      return NextResponse.json(
        { error: 'Currículo e descrição da vaga são obrigatórios' },
        { status: 400 }
      );
    }

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const prompt = `Você é um especialista em entrevistas corporativas. Analise o currículo e a descrição da vaga usando o framework SOAR (Situation, Obstacle, Action, Result).

CURRÍCULO:
${curriculo}

DESCRIÇÃO DA VAGA:
${descricaoVaga}

Responda SOMENTE com JSON válido, sem crases, sem markdown e sem texto antes ou depois, exatamente neste formato:
{
  "experiencias": [
    {
      "periodo": "string",
      "empresa": "string",
      "cargo": "string",
      "situacao": "string",
      "acoes": "string",
      "resultados": "string",
      "sumario": "string",
      "competencias": ["string"],
      "aprendizado": "string",
      "gap": "string",
      "conexaoVaga": "string",
      "forca": 4
    }
  ],
  "mapaCompetencias": { "competencia": "descrição" },
  "abertura": "string",
  "historiasAncora": ["string", "string", "string"],
  "resposta_por_que_sair": "string",
  "resposta_por_que_vaga": "string",
  "tratamento_gaps": "string"
}

REGRA MAIS IMPORTANTE — PRIMEIRA PESSOA:
Os campos "abertura", "historiasAncora", "sumario", "resposta_por_que_sair", "resposta_por_que_vaga" e "tratamento_gaps" são falas que a pessoa vai dizer em voz alta na entrevista. Escreva TUDO em PRIMEIRA PESSOA, como se fosse a própria pessoa falando.
NUNCA use o nome da pessoa nem terceira pessoa nesses campos.
Errado: "Jaqueline está em um momento de transição e apresenta 3 gaps."
Certo: "Estou em um momento de transição. Vejo três pontos que ainda estou desenvolvendo."
Use tom natural e falado, como numa conversa profissional — nada de linguagem de relatório.

DESTAQUES: dentro desses textos, marque com **asteriscos duplos** as métricas, números e decisões estratégicas mais importantes (ex.: "reduzi o churn em **32%**"). Use no máximo 3 destaques por texto, só no que realmente importa.

Regras: no máximo 4 experiências (as mais relevantes para a vaga), exatamente 3 histórias âncora, "forca" é um número de 1 a 5. Seja específico, use números e métricas quando existirem no currículo, e conecte cada experiência com a vaga alvo. Escreva em português do Brasil.`;

    const resposta = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 8000,
      messages: [{ role: 'user', content: prompt }],
    });

    const textoResposta = resposta.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('\n')
      .trim()
      .replace(/^```json\s*/i, '')
      .replace(/```$/i, '')
      .trim();

    let analise;
    try {
      analise = JSON.parse(textoResposta);
    } catch {
      console.error('🔴 [SOAR] JSON inválido. stop_reason:', resposta.stop_reason);
      return NextResponse.json(
        {
          error:
            resposta.stop_reason === 'max_tokens'
              ? 'A análise ficou longa demais. Resuma um pouco o currículo e tente de novo.'
              : 'A IA devolveu um formato inválido. Tente gerar novamente.',
        },
        { status: 502 }
      );
    }

    return NextResponse.json({ analise });
  } catch (erro) {
    const detalhe = erro instanceof Error ? erro.message : String(erro);
    console.error('🔴 [SOAR-POST] Erro:', detalhe);
    return NextResponse.json(
      { error: 'Erro ao gerar a análise SOAR.', detalhe },
      { status: 500 }
    );
  }
}

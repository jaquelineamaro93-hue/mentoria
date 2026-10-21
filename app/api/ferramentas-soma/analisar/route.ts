import { NextRequest, NextResponse } from 'next/server';
import { consumeIdentifierRateLimit } from '@/lib/security/rate-limit';
import { createClient } from '@/lib/supabase/server';
import { chamarClaude } from '@/lib/anthropic';
import {
  montarPromptLinkedIn,
  montarPromptGupy,
  montarPromptCenario,
  type FerramentaSoma,
} from '@/lib/prompts-career-tools';

export const maxDuration = 120;

function tituloPadrao(ferramenta: FerramentaSoma, body: any) {
  if (ferramenta === 'linkedin') {
    return body.cargoAlvo?.trim() ? `LinkedIn · ${body.cargoAlvo.trim()}` : 'Auditoria de LinkedIn';
  }
  if (ferramenta === 'gupy') {
    return body.cargoAlvo?.trim() ? `Gupy · ${body.cargoAlvo.trim()}` : 'Auditoria Gupy & ATS';
  }
  return body.titulo?.trim() || 'Leitura de cenário';
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
  }

    const aiAllowed = await consumeIdentifierRateLimit({
      scope: 'ai_ferramentas_soma',
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

  const body = await request.json();
  const ferramenta = body.ferramenta as FerramentaSoma;

  if (!['linkedin', 'gupy', 'cenario'].includes(ferramenta)) {
    return NextResponse.json({ error: 'Ferramenta inválida.' }, { status: 400 });
  }

  let prompt = '';
  let entradasParaHistorico: Record<string, unknown> = {};

  if (ferramenta === 'linkedin') {
    const cv = String(body.cv ?? '').trim();
    const linkedin = String(body.linkedin ?? '').trim();
    const cargoAlvo = String(body.cargoAlvo ?? '').trim();

    if (!cv || !linkedin || !cargoAlvo) {
      return NextResponse.json(
        { error: 'Envie o CV, o LinkedIn e informe o cargo-alvo.' },
        { status: 400 }
      );
    }

    prompt = montarPromptLinkedIn({
      cv,
      linkedin,
      diagnostico: String(body.diagnostico ?? ''),
      cargoAlvo,
      ferramentas: String(body.ferramentas ?? ''),
    });

    entradasParaHistorico = {
      cargoAlvo,
      ferramentas: String(body.ferramentas ?? '').trim().slice(0, 2000),
      possuiDiagnostico: Boolean(String(body.diagnostico ?? '').trim()),
    };
  } else if (ferramenta === 'gupy') {
    const curriculo = String(body.curriculo ?? '').trim();
    const vagas = String(body.vagas ?? '').trim();

    if (!curriculo || !vagas) {
      return NextResponse.json(
        { error: 'Envie o currículo exportado da Gupy e cole ao menos uma vaga-alvo.' },
        { status: 400 }
      );
    }

    prompt = montarPromptGupy({
      curriculo,
      vagas,
      cargoAlvo: String(body.cargoAlvo ?? ''),
    });

    entradasParaHistorico = {
      cargoAlvo: String(body.cargoAlvo ?? '').trim().slice(0, 1000),
      quantidadeCaracteresVagas: vagas.length,
    };
  } else {
    const situacao = String(body.situacao ?? '').trim();
    const objetivo = String(body.objetivo ?? '').trim();

    if (!situacao || !objetivo) {
      return NextResponse.json(
        { error: 'Descreva a situação e o que você quer alcançar.' },
        { status: 400 }
      );
    }

    prompt = montarPromptCenario({
      titulo: String(body.titulo ?? ''),
      situacao,
      objetivo,
      envolvidos: String(body.envolvidos ?? ''),
      discurso: String(body.discurso ?? ''),
      pratica: String(body.pratica ?? ''),
      restricoes: String(body.restricoes ?? ''),
    });

    entradasParaHistorico = {
      titulo: String(body.titulo ?? '').trim().slice(0, 500),
      objetivo: objetivo.slice(0, 3000),
      situacao: situacao.slice(0, 6000),
      envolvidos: String(body.envolvidos ?? '').trim().slice(0, 3000),
      discurso: String(body.discurso ?? '').trim().slice(0, 3000),
      pratica: String(body.pratica ?? '').trim().slice(0, 3000),
      restricoes: String(body.restricoes ?? '').trim().slice(0, 3000),
    };
  }

  try {
    const resultado = await chamarClaude(prompt, 8000);

    const { data, error } = await supabase
      .from('soma_analises')
      .insert({
        user_id: user.id,
        ferramenta,
        titulo: tituloPadrao(ferramenta, body),
        entradas: entradasParaHistorico,
        resultado_markdown: resultado,
      })
      .select('id, ferramenta, titulo, resultado_markdown, created_at')
      .single();

    if (error) throw error;

    return NextResponse.json({ analise: data });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Não foi possível gerar a análise.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";
import { montarPromptGeracaoPDI, type RespostaSecaoPDI } from "@/lib/prompts-pdi";

// POST /api/pdi/gerar-plano
// Body: { mentoradoId: string }
//
// ATENÇÃO Claude Code: a leitura de `respostasSecoes` abaixo assume uma tabela
// com as 20 respostas do Meu PDI. Ajuste o nome da tabela/colunas para o real
// esquema do projeto (provavelmente algo como `pdi_respostas` com colunas
// `secao_codigo`, `secao_titulo`, `resposta`, `user_id`). O resto da rota
// não depende disso.

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

export async function POST(req: NextRequest) {
  try {
    const { mentoradoId } = await req.json();
    if (!mentoradoId) {
      return NextResponse.json({ erro: "mentoradoId é obrigatório" }, { status: 400 });
    }

    const { data: perfil, error: erroPerfil } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("id", mentoradoId)
      .single();

    if (erroPerfil || !perfil) {
      return NextResponse.json({ erro: "mentorado não encontrado" }, { status: 404 });
    }

    // Busca as 20 respostas do PDI pelo schema real do projeto
    const { data: respostasRaw, error: erroRespostas } = await supabaseAdmin
      .from("pdi_respostas")
      .select("secao, dados")
      .eq("user_id", mentoradoId)
      .eq("concluido", true)
      .order("secao", { ascending: true });

    if (erroRespostas || !respostasRaw || respostasRaw.length === 0) {
      return NextResponse.json(
        { erro: "o mentorado ainda não preencheu as seções do PDI" },
        { status: 400 }
      );
    }

    const respostas: RespostaSecaoPDI[] = respostasRaw.map((r) => ({
      codigo: r.secao,
      titulo: r.secao.replace(/_/g, " ").toUpperCase(),
      resposta: r.dados?.texto ?? "",
    }));

    const prompt = montarPromptGeracaoPDI({
      nomeMentorado: perfil.nome ?? "Mentorada",
      cargoAtual: perfil.cargo_atual ?? "Não informado",
      respostas,
    });

    const resposta = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 4000,
      messages: [{ role: "user", content: prompt }],
    });

    const textoResposta = resposta.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("\n")
      .trim()
      .replace(/^```json\s*/i, "")
      .replace(/```$/i, "");

    let planoGerado: {
      diagnostico: { sintese: string; conflito_central: string | null; alertas_sobrecarga: string[] };
      equacao: string | null;
      pilares: Array<{
        titulo: string;
        meta_smart: Record<string, string>;
        acoes: Array<{ titulo: string; descricao: string; prazo: string | null }>;
      }>;
      roadmap: Array<{ periodo: string; foco: string; marcos: string }>;
      alertas: Array<{ tipo: string; cor: string; descricao: string }>;
    };

    try {
      planoGerado = JSON.parse(textoResposta);
    } catch {
      return NextResponse.json(
        { erro: "a IA devolveu um formato inválido, tenta gerar de novo" },
        { status: 502 }
      );
    }

    // Arquiva plano anterior (se existir) para manter histórico de versões
    await supabaseAdmin
      .from("pdi_planos")
      .update({ status: "arquivado" })
      .eq("mentorado_id", mentoradoId)
      .eq("status", "ativo");

    const { data: planoSalvo, error: erroSalvar } = await supabaseAdmin
      .from("pdi_planos")
      .insert({
        mentorado_id: mentoradoId,
        diagnostico: planoGerado.diagnostico,
        equacao: planoGerado.equacao,
        pilares: planoGerado.pilares,
        roadmap: planoGerado.roadmap,
        alertas: planoGerado.alertas,
      })
      .select()
      .single();

    if (erroSalvar || !planoSalvo) {
      return NextResponse.json({ erro: "não consegui salvar o plano" }, { status: 500 });
    }

    // Explode os pilares em ações individuais, já rastreáveis (feito / não feito)
    const acoesParaInserir = planoGerado.pilares.flatMap((pilar, indexPilar) =>
      pilar.acoes.map((acao, indexAcao) => ({
        plano_id: planoSalvo.id,
        mentorado_id: mentoradoId,
        pilar_titulo: pilar.titulo,
        titulo: acao.titulo,
        descricao: acao.descricao ?? null,
        prazo: acao.prazo ?? null,
        ordem: indexPilar * 100 + indexAcao,
      }))
    );

    if (acoesParaInserir.length > 0) {
      await supabaseAdmin.from("pdi_acoes").insert(acoesParaInserir);
    }

    return NextResponse.json({ plano: planoSalvo });
  } catch (erro) {
    console.error("erro ao gerar plano de PDI", erro);
    return NextResponse.json({ erro: "erro interno ao gerar o plano" }, { status: 500 });
  }
}

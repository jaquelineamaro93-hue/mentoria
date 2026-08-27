import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";
import { montarPromptGeracaoPDI, type RespostaSecaoPDI } from "@/lib/prompts-pdi";
import { BLOCOS_QUEM_SOU_EU } from "@/lib/prompts";

export async function POST(req: NextRequest) {
  try {
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

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

    // Contexto extra de outras etapas já feitas na mentoria (Mapa Quem Sou Eu,
    // Diagnóstico VIA, Bússola de Posicionamento), pra deixar o plano gerado
    // mais fiel a quem a pessoa é, não só ao que ela escreveu nas 20 seções.
    // Opcional: se a pessoa não fez alguma dessas etapas, simplesmente pulamos.
    const [{ data: blocosQuemSouEu }, { data: viaResultado }, { data: bussola }] =
      await Promise.all([
        supabaseAdmin
          .from("quem_sou_eu_respostas")
          .select("bloco, resposta")
          .eq("user_id", mentoradoId),
        supabaseAdmin
          .from("via_resultados")
          .select("forcas, analise_ia")
          .eq("user_id", mentoradoId)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabaseAdmin
          .from("bussola_posicionamento")
          .select("norte, sul, leste, oeste, centro")
          .eq("user_id", mentoradoId)
          .order("gerado_em", { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);

    const partesContexto: string[] = [];

    if (blocosQuemSouEu && blocosQuemSouEu.length > 0) {
      const tituloPorCodigo = new Map(BLOCOS_QUEM_SOU_EU.map((b) => [b.codigo, b.titulo]));
      const textoQuemSouEu = blocosQuemSouEu
        .filter((b) => b.resposta?.trim())
        .map((b) => `${tituloPorCodigo.get(b.bloco) ?? b.bloco}: ${b.resposta.trim()}`)
        .join("\n");
      if (textoQuemSouEu) {
        partesContexto.push(`### Mapa Quem Sou Eu\n${textoQuemSouEu}`);
      }
    }

    if (viaResultado?.forcas && Array.isArray(viaResultado.forcas) && viaResultado.forcas.length > 0) {
      const top5 = viaResultado.forcas.slice(0, 5).join(", ");
      let textoVia = `### Diagnóstico VIA (forças de caráter)\nForças principais, da mais forte para baixo: ${top5}.`;
      if (viaResultado.analise_ia) {
        textoVia += `\nAnálise: ${viaResultado.analise_ia}`;
      }
      partesContexto.push(textoVia);
    }

    if (bussola && (bussola.norte || bussola.sul || bussola.leste || bussola.oeste || bussola.centro)) {
      const linhas = [
        bussola.norte && `Norte (para onde vai): ${bussola.norte}`,
        bussola.sul && `Sul (de onde vem): ${bussola.sul}`,
        bussola.leste && `Leste (o que soma): ${bussola.leste}`,
        bussola.oeste && `Oeste (o que atrapalha): ${bussola.oeste}`,
        bussola.centro && `Centro (essência): ${bussola.centro}`,
      ].filter(Boolean);
      partesContexto.push(`### Bússola de Posicionamento\n${linhas.join("\n")}`);
    }

    const contextoAdicional = partesContexto.length > 0 ? partesContexto.join("\n\n") : null;

    const prompt = montarPromptGeracaoPDI({
      nomeMentorado: perfil.nome ?? "Mentorada",
      cargoAtual: perfil.cargo_atual ?? "Não informado",
      respostas,
      contextoAdicional,
    });

    const resposta = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 6000,
      messages: [{ role: "user", content: prompt }],
    });

    const textoResposta = resposta.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("\n")
      .trim();

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

    function extrairEParseJSON(texto: string) {
      // Remove caracteres de controle e espaços extras
      let textoLimpo = texto.replace(/[\x00-\x1F\x7F]/g, ' ').trim();

      // Tenta parsar direto
      try {
        return JSON.parse(textoLimpo);
      } catch {
        // Tenta com code blocks markdown
        const codeBlockMatch = textoLimpo.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        if (codeBlockMatch?.[1]) {
          return JSON.parse(codeBlockMatch[1].trim());
        }

        // Tenta extrair JSON entre primeiras chaves balanceadas
        const primeiraBraceAberta = textoLimpo.indexOf('{');
        if (primeiraBraceAberta < 0) throw new Error("Sem { encontrado");

        let depth = 0;
        let ultimaBrace = -1;

        for (let i = primeiraBraceAberta; i < textoLimpo.length; i++) {
          if (textoLimpo[i] === '{') depth++;
          if (textoLimpo[i] === '}') {
            depth--;
            if (depth === 0) {
              ultimaBrace = i;
              break;
            }
          }
        }

        if (ultimaBrace <= primeiraBraceAberta) {
          throw new Error("Braces não balanceadas");
        }

        const jsonExtraido = textoLimpo.substring(primeiraBraceAberta, ultimaBrace + 1);
        return JSON.parse(jsonExtraido);
      }
    }

    try {
      planoGerado = extrairEParseJSON(textoResposta);
    } catch (erroJson) {
      console.error("❌ Erro ao gerar PDI - resposta inválida");
      console.error("Primeira 500 chars:", textoResposta.substring(0, 500));
      console.error("Erro específico:", erroJson);
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

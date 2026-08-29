import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";
import { montarPromptGeracaoPDI, type RespostaSecaoPDI } from "@/lib/prompts-pdi";
import { BLOCOS_QUEM_SOU_EU } from "@/lib/prompts";

export async function POST(req: NextRequest) {
  try {
    const t0 = Date.now();
    console.log("[PDI] Iniciando geração de plano");

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

    const { mentoradoId } = await req.json();
    if (!mentoradoId) {
      return NextResponse.json({ erro: "mentoradoId é obrigatório" }, { status: 400 });
    }

    const t1 = Date.now();
    console.log(`[PDI] Iniciando queries (${t1 - t0}ms)`);

    const { data: perfil, error: erroPerfil } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("id", mentoradoId)
      .single();

    if (erroPerfil || !perfil) {
      return NextResponse.json({ erro: "mentorado não encontrado" }, { status: 404 });
    }

    const t2 = Date.now();
    console.log(`[PDI] Profile carregado (${t2 - t1}ms)`);

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

    const t3 = Date.now();
    console.log(`[PDI] Respostas PDI carregadas (${t3 - t2}ms)`);

    const respostas: RespostaSecaoPDI[] = respostasRaw.map((r) => ({
      codigo: r.secao,
      titulo: r.secao.replace(/_/g, " ").toUpperCase(),
      resposta: r.dados?.texto ?? "",
    }));

    const t4 = Date.now();
    console.log(`[PDI] Respostas formatadas (${t4 - t3}ms)`);

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

    const t5 = Date.now();
    console.log(`[PDI] Context queries carregadas (${t5 - t4}ms)`);

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

    const t6 = Date.now();
    console.log(`[PDI] Contexto preparado (${t6 - t5}ms)`);

    const prompt = montarPromptGeracaoPDI({
      nomeMentorado: perfil.nome ?? "Mentorada",
      cargoAtual: perfil.cargo_atual ?? "Não informado",
      respostas,
      contextoAdicional,
    });

    const t7 = Date.now();
    console.log(`[PDI] Prompt gerado (${t7 - t6}ms)`);

    const resposta = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 2000,
      messages: [{ role: "user", content: prompt }],
    });

    const t8 = Date.now();
    console.log(`[PDI] Claude API respondeu (${t8 - t7}ms)`);

    const textoResposta = resposta.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("\n")
      .trim();

    console.log("[PDI] Texto da IA (primeiros 500 chars):", textoResposta.substring(0, 500));

    // Função auxiliar
    const extrairUltimaLinha = (linhas: string[], prefixo: string): string | null => {
      for (let i = linhas.length - 1; i >= 0; i--) {
        if (linhas[i].includes(prefixo)) {
          return linhas[i].replace(prefixo + ":", "").trim() || null;
        }
      }
      return null;
    };

    // Parse super simples e robusto do formato estruturado
    const linhas = textoResposta.split("\n");

    const diagnostico = {
      sintese: extrairUltimaLinha(linhas, "SÍNTESE") || "Plano gerado",
      conflito_central: extrairUltimaLinha(linhas, "CONFLITO") || null,
      alertas_sobrecarga: [],
    };

    const equacao = extrairUltimaLinha(linhas, "EQUAÇÃO") || null;

    const pilares: Array<{ titulo: string; meta_smart: Record<string, string>; acoes: Array<{ titulo: string; descricao: string; prazo: string | null }> }> = [];
    let pilarAtual: any = null;

    linhas.forEach((linha) => {
      const nomePilar = linha.match(/=== PILAR \d+ ===/);
      if (nomePilar) {
        if (pilarAtual) pilares.push(pilarAtual);
        pilarAtual = {
          titulo: "Pilar",
          meta_smart: { especifico: "", mensuravel: "", alcancavel: "", relevante: "", temporal: null },
          acoes: [],
        };
      }

      if (pilarAtual) {
        if (linha.includes("NOME:")) pilarAtual.titulo = linha.replace("NOME:", "").trim();
        if (linha.includes("ESPECÍFICO:")) pilarAtual.meta_smart.especifico = linha.replace("ESPECÍFICO:", "").trim();
        if (linha.includes("MENSURÁVEL:")) pilarAtual.meta_smart.mensuravel = linha.replace("MENSURÁVEL:", "").trim();
        if (linha.includes("ALCANÇÁVEL:")) pilarAtual.meta_smart.alcancavel = linha.replace("ALCANÇÁVEL:", "").trim();
        if (linha.includes("RELEVANTE:")) pilarAtual.meta_smart.relevante = linha.replace("RELEVANTE:", "").trim();
        if (linha.includes("TEMPORAL:")) pilarAtual.meta_smart.temporal = linha.replace("TEMPORAL:", "").trim() || null;

        if (linha.includes("AÇÃO")) {
          const partes = linha.split("|");
          if (partes.length >= 2) {
            const titulo = partes[0].replace(/AÇÃO \d+:/i, "").trim();
            const descricao = partes[1].trim();
            pilarAtual.acoes.push({ titulo, descricao, prazo: null });
          }
        }
      }
    });
    if (pilarAtual) pilares.push(pilarAtual);

    // Roadmap simples
    const roadmap: Array<{ periodo: string; foco: string; marcos: string }> = [];
    let emRoadmap = false;
    linhas.forEach((linha) => {
      if (linha.includes("=== ROADMAP ===")) emRoadmap = true;
      if (emRoadmap && linha.includes(":") && !linha.startsWith("===")) {
        const partes = linha.split("Marcos:");
        if (partes.length === 2) {
          const [periodo, foco] = partes[0].split(":");
          roadmap.push({
            periodo: periodo.replace("[", "").replace("]", "").trim(),
            foco: foco?.trim() || "",
            marcos: partes[1].trim(),
          });
        }
      }
    });

    const alertas: Array<{ tipo: string; cor: string; descricao: string }> = [];
    let emAlertas = false;
    linhas.forEach((linha) => {
      if (linha.includes("=== ALERTAS ===")) emAlertas = true;
      if (emAlertas && linha.includes("|") && !linha.startsWith("===")) {
        const partes = linha.split("|");
        if (partes.length >= 3) {
          const tipo = partes[0].replace("[", "").replace("]", "").trim();
          const cor = partes[1].toLowerCase().includes("vermelho") ? "vermelho" :
                     partes[1].toLowerCase().includes("amarelo") ? "amarelo" : "azul";
          alertas.push({ tipo, cor, descricao: partes[2].trim() });
        }
      }
    });

    const t9 = Date.now();
    console.log(`[PDI] Parsing concluído (${t9 - t8}ms)`);

    const planoGerado = {
      diagnostico,
      equacao,
      pilares: pilares.filter((p) => p.titulo && p.titulo !== "Pilar"),
      roadmap,
      alertas,
    };

    console.log(`[PDI] Plano objeto criado: ${planoGerado.pilares.length} pilares, ${planoGerado.roadmap.length} roadmap, ${planoGerado.alertas.length} alertas`);

    // Arquiva plano anterior (se existir) para manter histórico de versões
    await supabaseAdmin
      .from("pdi_planos")
      .update({ status: "arquivado" })
      .eq("mentorado_id", mentoradoId)
      .eq("status", "ativo");

    const t10 = Date.now();
    console.log(`[PDI] Plano anterior arquivado (${t10 - t9}ms)`);

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

    const t11 = Date.now();
    console.log(`[PDI] Plano inserido (${t11 - t10}ms)`);

    if (erroSalvar || !planoSalvo) {
      console.error("[PDI] Erro ao salvar plano:", erroSalvar);
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

    const t12 = Date.now();
    console.log(`[PDI] Ações inseridas (${t12 - t11}ms)`);
    console.log(`[PDI] Tempo total: ${t12 - t0}ms`);

    return NextResponse.json({ plano: planoSalvo });
  } catch (erro) {
    console.error("[PDI] Erro ao gerar plano:", erro instanceof Error ? erro.message : String(erro));
    if (erro instanceof Error) console.error("[PDI] Stack:", erro.stack);
    return NextResponse.json({
      erro: "erro interno ao gerar o plano",
      detalhes: erro instanceof Error ? erro.message : String(erro)
    }, { status: 500 });
  }
}

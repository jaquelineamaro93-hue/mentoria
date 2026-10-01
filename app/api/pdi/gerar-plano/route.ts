import { NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseAdmin } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { chamarClaudeJson } from "@/lib/ai-json";
import { classificarContextoPdi } from "@/lib/jev-pdi";
import { montarPromptGeracaoPDI, type RespostaSecaoPDI } from "@/lib/prompts-pdi";
import { BLOCOS_QUEM_SOU_EU } from "@/lib/prompts";

const KARINY_MORE_ID = "477ff931-0338-4e10-a307-98e8ead54111";

type PlanoGerado = {
  diagnostico: {
    sintese: string;
    conflito_central: string | null;
    alertas_sobrecarga: string[];
  };
  equacao: string | null;
  pilares: Array<{
    titulo: string;
    meta_smart: Record<string, string>;
    acoes: Array<{ titulo: string; descricao: string; prazo: string | null }>;
  }>;
  roadmap: Array<{ periodo: string; foco: string; marcos: string }>;
  alertas: Array<{ tipo: string; cor: string; descricao: string }>;
};

function isPlanoGerado(valor: unknown): valor is PlanoGerado {
  if (!valor || typeof valor !== "object") return false;
  const plano = valor as Partial<PlanoGerado>;

  if (
    !plano.diagnostico ||
    typeof plano.diagnostico.sintese !== "string" ||
    !Array.isArray(plano.pilares) ||
    plano.pilares.length === 0
  ) {
    return false;
  }

  return plano.pilares.every(
    (pilar) =>
      !!pilar &&
      typeof pilar.titulo === "string" &&
      !!pilar.meta_smart &&
      typeof pilar.meta_smart === "object" &&
      Array.isArray(pilar.acoes) &&
      pilar.acoes.length > 0 &&
      pilar.acoes.every((acao) => acao && typeof acao.titulo === "string")
  );
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ erro: "não autenticado" }, { status: 401 });
    }

    const body = await req.json();
    const mentoradoId = body.mentoradoId || user.id;

    if (mentoradoId !== user.id) {
      const { data: solicitante } = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("id", user.id)
        .maybeSingle();

      if (!solicitante?.is_admin) {
        return NextResponse.json({ erro: "acesso não autorizado" }, { status: 403 });
      }
    }

    const supabaseAdmin = createSupabaseAdmin(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

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

    const permitePdiParcial = mentoradoId === KARINY_MORE_ID;
    const { count: totalSecoes } = await supabaseAdmin
      .from("pdi_guia_secoes")
      .select("id", { count: "exact", head: true });

    if (!permitePdiParcial && totalSecoes && respostasRaw.length < totalSecoes) {
      return NextResponse.json(
        { erro: `complete as ${totalSecoes} seções do PDI antes de gerar o plano` },
        { status: 400 }
      );
    }

    const { data: secoesGuia } = await supabaseAdmin
      .from("pdi_guia_secoes")
      .select("codigo, titulo");

    const tituloPorSecao = new Map(
      (secoesGuia ?? []).map((secao) => [secao.codigo, secao.titulo])
    );

    const respostas: RespostaSecaoPDI[] = respostasRaw.map((r) => ({
      codigo: r.secao,
      titulo: tituloPorSecao.get(r.secao) ?? r.secao.replace(/_/g, " ").toUpperCase(),
      resposta: r.dados?.texto ?? "",
    }));

    const contextoPdi = await classificarContextoPdi(respostas);

    console.info("[PDI contexto]", {
      mentoradoId,
      metodo: contextoPdi.metodo,
      secoesAntes: respostas.length,
      secoesDepois: contextoPdi.respostas.length,
      charsAntes: contextoPdi.charsAntes,
      charsDepois: contextoPdi.charsDepois,
      reducaoPercentual:
        contextoPdi.charsAntes > 0
          ? Math.round((1 - contextoPdi.charsDepois / contextoPdi.charsAntes) * 100)
          : 0,
      secoesSelecionadas: contextoPdi.secoesSelecionadas,
      jevInputTokens: contextoPdi.jevInputTokens,
    });

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

    if (permitePdiParcial) {
      partesContexto.unshift(
        `### Contexto deste plano inicial
Este é um plano inicial autorizado com ${respostasRaw.length} de ${totalSecoes ?? 20} seções do PDI respondidas. Use somente o que está disponível. Não trate perguntas ainda não respondidas como lacunas de competência e não invente conteúdo para completá-las. O plano deve poder ser refinado depois, quando novas respostas forem adicionadas.`
      );
    }

    if (contextoPdi.metodo === "jev") {
      partesContexto.unshift(
        "### Seleção de contexto\nAs respostas abaixo foram pré-selecionadas por um classificador de decisão para reduzir contexto redundante. Não trate seções não enviadas como ausência de competência ou como resposta negativa. Baseie o plano apenas nas evidências fornecidas e no histórico complementar disponível."
      );
    }

    const contextoAdicional = partesContexto.length > 0 ? partesContexto.join("\n\n") : null;

    const prompt = montarPromptGeracaoPDI({
      nomeMentorado: perfil.nome ?? "Mentorada",
      cargoAtual: perfil.cargo_atual ?? "Não informado",
      respostas: contextoPdi.respostas,
      contextoAdicional,
    });

    const planoGerado = await chamarClaudeJson<PlanoGerado>(prompt, {
      maxTokens: 7000,
      validar: isPlanoGerado,
      descricao: "plano de PDI",
    });

    planoGerado.roadmap = Array.isArray(planoGerado.roadmap) ? planoGerado.roadmap : [];
    planoGerado.alertas = Array.isArray(planoGerado.alertas) ? planoGerado.alertas : [];
    planoGerado.diagnostico.alertas_sobrecarga = Array.isArray(
      planoGerado.diagnostico.alertas_sobrecarga
    )
      ? planoGerado.diagnostico.alertas_sobrecarga
      : [];

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

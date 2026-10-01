"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { AcaoItem, type Acao } from "@/components/pdi/AcaoItem";
import { RoadmapTimeline } from "@/components/pdi/RoadmapTimeline";

type Pilar = {
  titulo: string;
  meta_smart: Record<string, string>;
  acoes: Acao[];
};

type Plano = {
  id: string;
  diagnostico: { sintese: string; conflito_central: string | null; alertas_sobrecarga: string[] };
  equacao: string | null;
  pilares: Pilar[];
  roadmap: { periodo: string; foco: string; marcos: string }[];
  alertas: { tipo: string; cor: string; descricao: string }[];
  gerado_em: string;
};

const CORES_ALERTA: Record<string, string> = {
  vermelho: "#c85a4a",
  amarelo: "#c99a3c",
  azul: "#3DD9C8",
};

const KARINY_MORE_ID = "477ff931-0338-4e10-a307-98e8ead54111";

export function PlanoGerado({ mentoradoId }: { mentoradoId: string }) {
  const supabase = createClient();
  const permitePdiParcial = mentoradoId === KARINY_MORE_ID;
  const [carregando, setCarregando] = useState(true);
  const [gerando, setGerando] = useState(false);
  const [plano, setPlano] = useState<Plano | null>(null);
  const [acoesPorPilar, setAcoesPorPilar] = useState<Record<string, Acao[]>>({});
  const [erro, setErro] = useState<string | null>(null);
  const [progressoPdi, setProgressoPdi] = useState<{ respondidas: number; total: number } | null>(null);

  useEffect(() => {
    carregarPlano();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mentoradoId]);

  async function carregarPlano() {
    setCarregando(true);

    const [{ count: respondidas }, { count: total }] = await Promise.all([
      supabase
        .from("pdi_respostas")
        .select("secao", { count: "exact", head: true })
        .eq("user_id", mentoradoId)
        .eq("concluido", true),
      supabase
        .from("pdi_guia_secoes")
        .select("id", { count: "exact", head: true }),
    ]);
    setProgressoPdi({ respondidas: respondidas ?? 0, total: total ?? 20 });

    const { data: planoAtivo } = await supabase
      .from("pdi_planos")
      .select("*")
      .eq("mentorado_id", mentoradoId)
      .eq("status", "ativo")
      .order("gerado_em", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (planoAtivo) {
      setPlano(planoAtivo as Plano);

      const { data: acoes } = await supabase
        .from("pdi_acoes")
        .select("*")
        .eq("plano_id", planoAtivo.id)
        .order("ordem", { ascending: true });

      const agrupado: Record<string, Acao[]> = {};
      (acoes ?? []).forEach((a) => {
        if (!agrupado[a.pilar_titulo]) agrupado[a.pilar_titulo] = [];
        agrupado[a.pilar_titulo].push(a);
      });
      setAcoesPorPilar(agrupado);
    } else {
      setPlano(null);
    }

    setCarregando(false);
  }

  async function gerarPlano() {
    setGerando(true);
    setErro(null);
    try {
      const resposta = await fetch("/api/pdi/gerar-plano", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mentoradoId }),
      });
      const dados = await resposta.json();
      if (!resposta.ok) {
        setErro(dados.erro ?? "não consegui gerar o plano agora");
        return;
      }
      await carregarPlano();
    } finally {
      setGerando(false);
    }
  }

  if (carregando) {
    return (
      <div style={{ padding: 32, fontFamily: "Poppins, sans-serif", color: "#808080" }}>
        Carregando seu plano...
      </div>
    );
  }

  const respondidas = progressoPdi?.respondidas ?? 0;
  const total = progressoPdi?.total ?? 20;
  const pdiCompleto = respondidas >= total;

  return (
    <div style={{ fontFamily: "Poppins, sans-serif", color: "#1A1A1A" }}>
      {!plano && (
        <div style={{ textAlign: "center", padding: "48px 24px" }}>
          <p className="display" style={{ fontSize: 24, color: "#1A1A1A", marginBottom: 12 }}>
            Seu plano ainda não foi gerado
          </p>
          <p style={{ color: "#808080", maxWidth: 520, margin: "0 auto 28px" }}>
            {permitePdiParcial
              ? `Você já tem material suficiente para um plano inicial, mesmo com ${respondidas} de ${total} perguntas respondidas. O que ainda não foi preenchido fica em aberto para ser refinado depois.`
              : pdiCompleto
                ? `Você concluiu as ${total} seções do Meu PDI. Agora é só transformar isso em um plano com caminho, prazos e ações que você consegue acompanhar mês a mês.`
                : `Você concluiu ${respondidas} de ${total} seções. Termine as perguntas guia antes de gerar o plano, assim a IA usa todo o contexto e não cria um plano incompleto.`}
          </p>
          {erro && <p style={{ color: "#c85a4a", marginBottom: 16 }}>{erro}</p>}
          <button
            onClick={gerarPlano}
            disabled={gerando || (!permitePdiParcial && !pdiCompleto)}
            style={{
              padding: "14px 32px",
              borderRadius: 8,
              border: "none",
              background: "#FFB366",
              color: "#FFFFFF",
              fontSize: 15,
              cursor: gerando || (!permitePdiParcial && !pdiCompleto) ? "not-allowed" : "pointer",
              opacity: gerando || (!permitePdiParcial && !pdiCompleto) ? 0.55 : 1,
            }}
          >
            {gerando
              ? "Gerando seu plano..."
              : !permitePdiParcial && !pdiCompleto
                ? "Complete as perguntas primeiro"
                : permitePdiParcial
                  ? "Gerar plano inicial"
                  : "Gerar meu plano"}
          </button>
        </div>
      )}

      {plano && (
        <>
          {permitePdiParcial && (
            <div className="mb-6 rounded-xl border border-mint bg-mint-light px-5 py-4">
              <p className="text-sm font-medium text-black">Plano inicial com os dados já disponíveis</p>
              <p className="text-xs text-gray-text mt-1 leading-relaxed">
                Este plano foi construído sem exigir o preenchimento artificial das perguntas restantes.
                Hoje ele considera {progressoPdi?.respondidas ?? 0} de {progressoPdi?.total ?? 20} respostas do PDI,
                além dos materiais já registrados na SOMA. As próximas respostas podem refinar uma versão futura.
              </p>
            </div>
          )}
          <header style={{ marginBottom: 40 }}>
            <p className="display" style={{ fontSize: 28, color: "#1A1A1A", margin: "0 0 6px" }}>
              Meu plano
            </p>
            {plano.equacao && <p style={{ fontSize: 13, color: "#3DD9C8", margin: 0 }}>{plano.equacao}</p>}
          </header>

          <section style={{ marginBottom: 36 }}>
            <p style={{ fontSize: 12, letterSpacing: "0.1em", color: "#999999", marginBottom: 8 }}>DIAGNÓSTICO</p>
            <p style={{ lineHeight: 1.6, color: "#1A1A1A" }}>{plano.diagnostico.sintese}</p>
            {plano.diagnostico.conflito_central && (
              <p style={{ lineHeight: 1.6, color: "#808080", marginTop: 10 }}>
                {plano.diagnostico.conflito_central}
              </p>
            )}
          </section>

          {plano.alertas?.length > 0 && (
            <section style={{ marginBottom: 36, display: "flex", flexDirection: "column", gap: 10 }}>
              {plano.alertas.map((a, i) => (
                <div
                  key={i}
                  style={{
                    borderLeft: `4px solid ${CORES_ALERTA[a.cor] ?? "#999999"}`,
                    background: "#FFFFFF",
                    padding: "10px 16px",
                    borderRadius: 6,
                  }}
                >
                  <p style={{ fontWeight: 500, margin: 0 }}>{a.tipo}</p>
                  <p style={{ fontSize: 13, color: "#808080", margin: "4px 0 0" }}>{a.descricao}</p>
                </div>
              ))}
            </section>
          )}

          <section style={{ marginBottom: 44 }}>
            <p style={{ fontSize: 12, letterSpacing: "0.1em", color: "#999999", marginBottom: 16 }}>ROADMAP</p>
            <RoadmapTimeline etapas={plano.roadmap} />
          </section>

          <section style={{ marginBottom: 44 }}>
            <p style={{ fontSize: 12, letterSpacing: "0.1em", color: "#999999", marginBottom: 16 }}>PILARES E AÇÕES</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
              {plano.pilares.map((pilar, i) => (
                <div key={i} style={{ background: "#FFFFFF", border: "1px solid #E8E8E8", borderRadius: 12, padding: 24 }}>
                  <p className="display" style={{ fontSize: 19, color: "#1A1A1A", margin: "0 0 10px" }}>
                    {pilar.titulo}
                  </p>
                  <p style={{ fontSize: 13, color: "#808080", margin: "0 0 4px" }}>
                    <strong>Específico:</strong> {pilar.meta_smart.especifico}
                  </p>
                  <p style={{ fontSize: 13, color: "#808080", margin: "0 0 4px" }}>
                    <strong>Mensurável:</strong> {pilar.meta_smart.mensuravel}
                  </p>
                  <p style={{ fontSize: 13, color: "#808080", margin: "0 0 16px" }}>
                    <strong>Prazo:</strong> {pilar.meta_smart.temporal}
                  </p>
                  <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
                    {(acoesPorPilar[pilar.titulo] ?? []).map((acao) => (
                      <AcaoItem key={acao.id} acao={acao} />
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>

        </>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { AcaoItem, type Acao } from "@/components/pdi/AcaoItem";
import { RoadmapTimeline } from "@/components/pdi/RoadmapTimeline";
import { ReflexaoMensal } from "@/components/pdi/ReflexaoMensal";

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
  azul: "#4f7196",
};

export function PlanoGerado({ mentoradoId }: { mentoradoId: string }) {
  const supabase = createClient();
  const [carregando, setCarregando] = useState(true);
  const [gerando, setGerando] = useState(false);
  const [plano, setPlano] = useState<Plano | null>(null);
  const [acoesPorPilar, setAcoesPorPilar] = useState<Record<string, Acao[]>>({});
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    carregarPlano();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mentoradoId]);

  async function carregarPlano() {
    setCarregando(true);

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

  const primeiroDiaDoMes = new Date();
  primeiroDiaDoMes.setDate(1);
  const mesReferencia = primeiroDiaDoMes.toISOString().slice(0, 10);

  if (carregando) {
    return (
      <div style={{ padding: 32, fontFamily: "Poppins, sans-serif", color: "#6b5d4f" }}>
        Carregando seu plano...
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "Poppins, sans-serif", color: "#362b21" }}>
      {!plano && (
        <div style={{ textAlign: "center", padding: "48px 24px" }}>
          <p className="display" style={{ fontSize: 24, color: "#3c2c1f", marginBottom: 12 }}>
            Seu plano ainda não foi gerado
          </p>
          <p style={{ color: "#6b5d4f", maxWidth: 460, margin: "0 auto 28px" }}>
            Você já preencheu as 20 seções do Meu PDI. Agora é só transformar isso em um plano com
            caminho, prazos e ações que você consegue acompanhar mês a mês.
          </p>
          {erro && <p style={{ color: "#c85a4a", marginBottom: 16 }}>{erro}</p>}
          <button
            onClick={gerarPlano}
            disabled={gerando}
            style={{
              padding: "14px 32px",
              borderRadius: 8,
              border: "none",
              background: "#6b4a35",
              color: "#fbf8f2",
              fontSize: 15,
              cursor: "pointer",
            }}
          >
            {gerando ? "Gerando seu plano..." : "Gerar meu plano"}
          </button>
        </div>
      )}

      {plano && (
        <>
          <header style={{ marginBottom: 40 }}>
            <p className="display" style={{ fontSize: 28, color: "#3c2c1f", margin: "0 0 6px" }}>
              Meu plano
            </p>
            {plano.equacao && <p style={{ fontSize: 13, color: "#4f7196", margin: 0 }}>{plano.equacao}</p>}
          </header>

          <section style={{ marginBottom: 36 }}>
            <p style={{ fontSize: 12, letterSpacing: "0.1em", color: "#9c8f7e", marginBottom: 8 }}>DIAGNÓSTICO</p>
            <p style={{ lineHeight: 1.6, color: "#362b21" }}>{plano.diagnostico.sintese}</p>
            {plano.diagnostico.conflito_central && (
              <p style={{ lineHeight: 1.6, color: "#6b5d4f", marginTop: 10 }}>
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
                    borderLeft: `4px solid ${CORES_ALERTA[a.cor] ?? "#9c8f7e"}`,
                    background: "#fbf8f2",
                    padding: "10px 16px",
                    borderRadius: 6,
                  }}
                >
                  <p style={{ fontWeight: 500, margin: 0 }}>{a.tipo}</p>
                  <p style={{ fontSize: 13, color: "#6b5d4f", margin: "4px 0 0" }}>{a.descricao}</p>
                </div>
              ))}
            </section>
          )}

          <section style={{ marginBottom: 44 }}>
            <p style={{ fontSize: 12, letterSpacing: "0.1em", color: "#9c8f7e", marginBottom: 16 }}>ROADMAP</p>
            <RoadmapTimeline etapas={plano.roadmap} />
          </section>

          <section style={{ marginBottom: 44 }}>
            <p style={{ fontSize: 12, letterSpacing: "0.1em", color: "#9c8f7e", marginBottom: 16 }}>PILARES E AÇÕES</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
              {plano.pilares.map((pilar, i) => (
                <div key={i} style={{ background: "#fbf8f2", border: "1px solid #ded4c3", borderRadius: 12, padding: 24 }}>
                  <p className="display" style={{ fontSize: 19, color: "#3c2c1f", margin: "0 0 10px" }}>
                    {pilar.titulo}
                  </p>
                  <p style={{ fontSize: 13, color: "#6b5d4f", margin: "0 0 4px" }}>
                    <strong>Específico:</strong> {pilar.meta_smart.especifico}
                  </p>
                  <p style={{ fontSize: 13, color: "#6b5d4f", margin: "0 0 4px" }}>
                    <strong>Mensurável:</strong> {pilar.meta_smart.mensuravel}
                  </p>
                  <p style={{ fontSize: 13, color: "#6b5d4f", margin: "0 0 16px" }}>
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

          <section>
            <p style={{ fontSize: 12, letterSpacing: "0.1em", color: "#9c8f7e", marginBottom: 16 }}>
              CHECK-IN MENSAL
            </p>
            <ReflexaoMensal
              mentoradoId={mentoradoId}
              planoId={plano.id}
              mesReferencia={mesReferencia}
            />
          </section>
        </>
      )}
    </div>
  );
}

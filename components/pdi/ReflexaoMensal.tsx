"use client";

import { useState } from "react";

type Props = {
  planoId: string;
  mesReferencia: string; // "2026-08-01"
  reflexaoExistente?: {
    energia: "alta" | "media" | "baixa" | null;
    o_que_avancou: string | null;
    o_que_travou: string | null;
    ajuste_para_o_proximo_mes: string | null;
  } | null;
};

const NOMES_MES = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

export function ReflexaoMensal({ planoId, mesReferencia, reflexaoExistente }: Props) {
  const [energia, setEnergia] = useState(reflexaoExistente?.energia ?? "");
  const [oQueAvancou, setOQueAvancou] = useState(reflexaoExistente?.o_que_avancou ?? "");
  const [oQueTravou, setOQueTravou] = useState(reflexaoExistente?.o_que_travou ?? "");
  const [ajuste, setAjuste] = useState(reflexaoExistente?.ajuste_para_o_proximo_mes ?? "");
  const [salvo, setSalvo] = useState(false);
  const [salvando, setSalvando] = useState(false);

  const mes = new Date(mesReferencia + "T12:00:00");
  const nomeMes = NOMES_MES[mes.getMonth()];

  async function salvar() {
    setSalvando(true);
    try {
      await fetch("/api/pdi/reflexao", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planoId,
          mesReferencia,
          energia: energia || null,
          oQueAvancou,
          oQueTravou,
          ajusteParaProximoMes: ajuste,
        }),
      });
      setSalvo(true);
      setTimeout(() => setSalvo(false), 2500);
    } finally {
      setSalvando(false);
    }
  }

  const campoEstilo = {
    width: "100%",
    border: "1px solid #E8E8E8",
    borderRadius: 8,
    padding: "10px 12px",
    fontFamily: "Poppins, sans-serif",
    fontSize: 14,
    color: "#1A1A1A",
    background: "#FFFFFF",
    resize: "vertical" as const,
  };

  return (
    <div style={{ background: "#FFFFFF", border: "1px solid #E8E8E8", borderRadius: 12, padding: 24 }}>
      <p className="display" style={{ fontSize: 20, color: "#1A1A1A", margin: "0 0 4px" }}>
        Reflexão de {nomeMes}
      </p>
      <p style={{ fontSize: 13, color: "#808080", margin: "0 0 16px" }}>
        Leva 5 minutos. É o que sustenta o plano no mês a mês.
      </p>

      <label style={{ fontSize: 13, color: "#808080", display: "block", marginBottom: 6 }}>
        Como está sua energia neste mês?
      </label>
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {(["alta", "media", "baixa"] as const).map((nivel) => (
          <button
            key={nivel}
            onClick={() => setEnergia(nivel)}
            style={{
              padding: "6px 16px",
              borderRadius: 20,
              border: "1px solid #FFB366",
              background: energia === nivel ? "#FFB366" : "transparent",
              color: energia === nivel ? "#FFFFFF" : "#FFB366",
              fontSize: 13,
              cursor: "pointer",
              textTransform: "capitalize",
            }}
          >
            {nivel === "media" ? "média" : nivel}
          </button>
        ))}
      </div>

      <label style={{ fontSize: 13, color: "#808080", display: "block", marginBottom: 6 }}>
        O que avançou este mês?
      </label>
      <textarea
        value={oQueAvancou}
        onChange={(e) => setOQueAvancou(e.target.value)}
        rows={2}
        style={{ ...campoEstilo, marginBottom: 14 }}
      />

      <label style={{ fontSize: 13, color: "#808080", display: "block", marginBottom: 6 }}>
        O que travou?
      </label>
      <textarea
        value={oQueTravou}
        onChange={(e) => setOQueTravou(e.target.value)}
        rows={2}
        style={{ ...campoEstilo, marginBottom: 14 }}
      />

      <label style={{ fontSize: 13, color: "#808080", display: "block", marginBottom: 6 }}>
        Qual o ajuste para o mês que vem?
      </label>
      <textarea
        value={ajuste}
        onChange={(e) => setAjuste(e.target.value)}
        rows={2}
        style={{ ...campoEstilo, marginBottom: 18 }}
      />

      <button
        onClick={salvar}
        disabled={salvando}
        style={{
          padding: "10px 24px",
          borderRadius: 8,
          border: "none",
          background: "#3DD9C8",
          color: "#FFFFFF",
          fontSize: 14,
          cursor: "pointer",
        }}
      >
        {salvando ? "Salvando..." : salvo ? "Salvo ✓" : "Salvar reflexão do mês"}
      </button>
    </div>
  );
}

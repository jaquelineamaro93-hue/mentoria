"use client";

import { useState } from "react";

export type Acao = {
  id: string;
  titulo: string;
  descricao: string | null;
  prazo: string | null;
  concluida: boolean;
};

export function AcaoItem({ acao }: { acao: Acao }) {
  const [concluida, setConcluida] = useState(acao.concluida);
  const [salvando, setSalvando] = useState(false);

  async function alternar() {
    const novoValor = !concluida;
    setConcluida(novoValor);
    setSalvando(true);
    try {
      await fetch("/api/pdi/acoes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ acaoId: acao.id, concluida: novoValor }),
      });
    } catch {
      setConcluida(!novoValor); // desfaz se der erro
    } finally {
      setSalvando(false);
    }
  }

  return (
    <li
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 12,
        padding: "12px 0",
        borderBottom: "1px solid #E8E8E8",
        opacity: salvando ? 0.6 : 1,
      }}
    >
      <button
        onClick={alternar}
        aria-label={concluida ? "Marcar como não feita" : "Marcar como feita"}
        style={{
          width: 22,
          height: 22,
          minWidth: 22,
          marginTop: 2,
          borderRadius: 6,
          border: "1.5px solid #FFB366",
          background: concluida ? "#6f9757" : "transparent",
          cursor: "pointer",
        }}
      />
      <div>
        <p
          style={{
            fontFamily: "Poppins, sans-serif",
            fontWeight: 400,
            color: "#1A1A1A",
            textDecoration: concluida ? "line-through" : "none",
            opacity: concluida ? 0.6 : 1,
            margin: 0,
          }}
        >
          {acao.titulo}
        </p>
        {acao.descricao && (
          <p style={{ fontSize: 13, color: "#808080", margin: "4px 0 0" }}>{acao.descricao}</p>
        )}
        {acao.prazo && (
          <p style={{ fontSize: 12, color: "#999999", margin: "4px 0 0" }}>
            Prazo: {new Date(acao.prazo).toLocaleDateString("pt-BR")}
          </p>
        )}
      </div>
    </li>
  );
}

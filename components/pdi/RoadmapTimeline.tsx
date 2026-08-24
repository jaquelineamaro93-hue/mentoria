type EtapaRoadmap = { periodo: string; foco: string; marcos: string };

export function RoadmapTimeline({ etapas }: { etapas: EtapaRoadmap[] }) {
  if (!etapas || etapas.length === 0) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      {etapas.map((etapa, i) => (
        <div key={i} style={{ display: "flex", gap: 16 }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div
              style={{
                width: 12,
                height: 12,
                borderRadius: "50%",
                background: "#3DD9C8",
                marginTop: 4,
              }}
            />
            {i < etapas.length - 1 && (
              <div style={{ width: 1, flex: 1, background: "#E8E8E8", minHeight: 40 }} />
            )}
          </div>
          <div style={{ paddingBottom: 24 }}>
            <p style={{ fontSize: 12, letterSpacing: "0.05em", color: "#3DD9C8", margin: 0 }}>
              {etapa.periodo.toUpperCase()}
            </p>
            <p style={{ fontWeight: 500, color: "#1A1A1A", margin: "2px 0 4px" }}>{etapa.foco}</p>
            <p style={{ fontSize: 13, color: "#808080", margin: 0 }}>{etapa.marcos}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { PlanoGerado } from "@/components/pdi/PlanoGerado";

export default function MeuPlanoPage() {
  const supabase = createClient();
  const [mentoradoId, setMentoradoId] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setMentoradoId(data?.user?.id ?? null);
      setCarregando(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (carregando) {
    return (
      <div style={{ padding: 48, fontFamily: "Poppins, sans-serif", color: "#808080" }}>
        Carregando...
      </div>
    );
  }

  if (!mentoradoId) return null;

  return (
    <div style={{ maxWidth: 860, margin: "0 auto", padding: "48px 24px" }}>
      <PlanoGerado mentoradoId={mentoradoId} />
    </div>
  );
}

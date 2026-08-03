import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// PATCH /api/pdi/acoes
// Body: { acaoId: string, concluida: boolean }
// Marca uma ação do plano como feita ou não feita. Usa o client autenticado
// (cookie da sessão) para que a RLS garanta que o mentorado só mexe no que é dele.

export async function PATCH(req: NextRequest) {
  const { acaoId, concluida } = await req.json();

  if (!acaoId || typeof concluida !== "boolean") {
    return NextResponse.json({ erro: "acaoId e concluida são obrigatórios" }, { status: 400 });
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("pdi_acoes")
    .update({
      concluida,
      concluida_em: concluida ? new Date().toISOString() : null,
    })
    .eq("id", acaoId)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ erro: "não consegui atualizar a ação" }, { status: 500 });
  }

  return NextResponse.json({ acao: data });
}

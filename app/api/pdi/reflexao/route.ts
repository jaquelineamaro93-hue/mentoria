import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// POST /api/pdi/reflexao
// Body: {
//   mentoradoId, planoId, mesReferencia ("2026-08-01"),
//   energia, oQueAvancou, oQueTravou, ajusteParaProximoMes
// }
// Cria ou atualiza (upsert) a reflexão do mês. Um registro por mentorado por mês.

export async function POST(req: NextRequest) {
  const {
    planoId,
    mesReferencia,
    energia,
    oQueAvancou,
    oQueTravou,
    ajusteParaProximoMes,
  } = await req.json();

 if (!planoId || !mesReferencia) {
  return NextResponse.json(
    { erro: "planoId e mesReferencia são obrigatórios" },
    { status: 400 }
  );
}

const supabase = await createClient();
const { data: userData, error: userError } = await supabase.auth.getUser();

if (userError || !userData?.user) {
  return NextResponse.json({ erro: "não autorizado" }, { status: 401 });
}

const { data, error } = await supabase
  .from("pdi_reflexoes_mensais")
    .upsert(
      {
        mentorado_id: mentoradoId,
        plano_id: planoId,
        mes_referencia: mesReferencia,
        energia: energia ?? null,
        o_que_avancou: oQueAvancou ?? null,
        o_que_travou: oQueTravou ?? null,
        ajuste_para_o_proximo_mes: ajusteParaProximoMes ?? null,
      },
      { onConflict: "mentorado_id,plano_id,mes_referencia" }
    )
    .select()
    .single();

  if (error) {
    return NextResponse.json({ erro: "não consegui salvar a reflexão" }, { status: 500 });
  }

  return NextResponse.json({ reflexao: data });
}

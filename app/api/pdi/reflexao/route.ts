import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// POST /api/pdi/reflexao
// Body: {
//   mentoradoId, planoId, mesReferencia ("2026-08-01"),
//   energia, oQueAvancou, oQueTravou, ajusteParaProximoMes
// }
// Cria ou atualiza (upsert) a reflexão do mês. Um registro por mentorado por mês.

export async function POST(req: NextRequest) {
  const {
    mentoradoId,
    planoId,
    mesReferencia,
    energia,
    oQueAvancou,
    oQueTravou,
    ajusteParaProximoMes,
  } = await req.json();

  if (!mentoradoId || !planoId || !mesReferencia) {
    return NextResponse.json(
      { erro: "mentoradoId, planoId e mesReferencia são obrigatórios" },
      { status: 400 }
    );
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data, error } = await supabaseAdmin
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

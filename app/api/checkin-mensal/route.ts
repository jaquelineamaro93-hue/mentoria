import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
  }

  const body = await request.json();
  const mesReferencia: string = body.mes_referencia;
  const nota: number = body.nota;
  const feedbackTexto: string | null = body.feedback_texto ?? null;
  const sugestaoMelhoria: string | null = body.sugestao_melhoria ?? null;

  if (!mesReferencia || nota === undefined || nota === null) {
    return NextResponse.json({ error: 'Dados incompletos.' }, { status: 400 });
  }

  if (nota < 0 || nota > 5) {
    return NextResponse.json({ error: 'A nota precisa estar entre 0 e 5.' }, { status: 400 });
  }

  const { data: checkin, error } = await supabase
    .from('checkins_mensais')
    .insert({
      user_id: user.id,
      mes_referencia: mesReferencia,
      nota,
      feedback_texto: feedbackTexto,
      sugestao_melhoria: sugestaoMelhoria,
    })
    .select()
    .single();

  if (error) {
    const mensagem = error.code === '23505'
      ? 'Você já enviou o check-in desse mês.'
      : error.message;
    return NextResponse.json({ error: mensagem }, { status: 500 });
  }

  return NextResponse.json({ checkin });
}

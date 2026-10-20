import { NextResponse } from 'next/server';
import { executarLembretes } from '@/lib/lembretes';
import { executarPausasProgramadas } from '@/lib/pausas-notificacoes';

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
  }

  const pausa = await executarPausasProgramadas();
  const resultado = await executarLembretes();
  return NextResponse.json({...resultado,pausa},{headers:{'Cache-Control':'no-store'}});
}

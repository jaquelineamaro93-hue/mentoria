import { reconcileSaasRecovery } from '@/lib/saas-recovery';
import { executarTrialGrowth } from '@/lib/trial-growth';
import { NextResponse } from 'next/server';
import { executarLembretes } from '@/lib/lembretes';
import { executarPausasProgramadas } from '@/lib/pausas-notificacoes';

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
  }

  const pausa = await executarPausasProgramadas();
  const resultado = await executarLembretes();
  const recovery = await reconcileSaasRecovery();
  const trialGrowth = await executarTrialGrowth();
  return NextResponse.json({...resultado,pausa,recovery,trialGrowth},{headers:{'Cache-Control':'no-store'}});
}

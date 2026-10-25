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

  // A régua de trial é sensível ao vencimento: processar antes de
  // lembretes gerais e recuperação de pagamentos, que podem demorar.
  const trialGrowth = await executarTrialGrowth().catch((error: unknown) => {
    console.error('[trial-growth] Falha inesperada', error instanceof Error ? error.name : 'unknown');
    return { sent: 0, eligible: 0, skipped: 0, errors: ['Falha inesperada na régua de trial.'] };
  });
  console.info('[trial-growth] Execução', {
    sent: trialGrowth.sent, eligible: trialGrowth.eligible,
    skipped: trialGrowth.skipped, errors: trialGrowth.errors,
  });
  const pausa = await executarPausasProgramadas();
  const resultado = await executarLembretes();
  const recovery = await reconcileSaasRecovery();
  return NextResponse.json({...resultado,pausa,recovery,trialGrowth},{headers:{'Cache-Control':'no-store'}});
}

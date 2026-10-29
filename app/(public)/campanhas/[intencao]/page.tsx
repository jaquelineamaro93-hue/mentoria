import Link from 'next/link';
import { notFound } from 'next/navigation';
import { SomaSiteHeader, SomaSiteFooter } from '@/components/public/SomaMarketingChrome';
import CampaignLink from '@/components/public/CampaignLink';
import { BASE_SAAS_CENTAVOS, formatarReais } from '@/lib/soma-saas-pricing';

const campaigns = {
  curriculo: {
    title: 'Seu currículo mostra o que esta vaga pede?',
    intro: 'Antes de enviar outra candidatura, compare a oportunidade com a experiência que você já tem. A SOMA ajuda a identificar o que merece destaque e o que ainda precisa de contexto.',
    module: 'curriculo-ats', label: 'Começar a revisão do meu currículo',
    example: '“Responsável por relatórios” deixa perguntas. “Organizei os relatórios de vendas para apoiar a reunião semanal da equipe” explica a entrega. Exemplo ilustrativo, sem inventar resultados.',
    steps: ['Separe seu currículo e o texto de uma vaga que faça sentido para você.', 'Na ferramenta, compare as exigências com suas experiências.', 'Revise as sugestões e mantenha apenas o que corresponde à sua trajetória.'],
  },
  entrevista: {
    title: 'Tem uma entrevista marcada? Prepare o que vai contar.',
    intro: 'Você conhece sua trajetória. O desafio é escolher o que faz sentido para aquela conversa. Use as ferramentas de entrevista da SOMA para organizar sua preparação.',
    module: 'entrevistas', label: 'Começar minha preparação',
    example: 'Em vez de decorar “sou proativa”, escolha uma situação: qual era o problema, o que você fez e o que aconteceu depois. Uma história real dá conteúdo à resposta.',
    steps: ['Escolha a oportunidade para a qual quer se preparar.', 'Separe situações reais que mostrem suas entregas.', 'Use a ferramenta de entrevistas e revise sua apresentação.'],
  },
} as const;
type Intent = keyof typeof campaigns;
export function generateStaticParams() { return Object.keys(campaigns).map(intencao => ({ intencao })); }
export async function generateMetadata({ params }: { params: Promise<{ intencao: string }> }) {
  const { intencao } = await params;
  const campaign = campaigns[intencao as Intent];
  return campaign ? { title: `${campaign.title} | SOMA`, description: campaign.intro, alternates: { canonical: `/campanhas/${intencao}` } } : {};
}
export default async function CampaignPage({ params }: { params: Promise<{ intencao: string }> }) {
  const { intencao } = await params;
  if (!Object.hasOwn(campaigns, intencao)) notFound();
  const c = campaigns[intencao as Intent];
  const next = `/plataforma?plano=avulso&modulo=${c.module}&iris=0&whatsapp=0`;
  return <><SomaSiteHeader /><main className="soma-marketing"><section className="mx-auto max-w-3xl px-6 py-16 sm:py-24">
    <p className="mb-6 text-sm tracking-widest text-slate-500">SOMA CARREIRA · FERRAMENTAS</p>
    <h1 className="font-display text-4xl leading-tight sm:text-6xl">{c.title}</h1>
    <p className="mt-7 text-lg leading-relaxed text-slate-700">{c.intro}</p>
    <div className="mt-9"><CampaignLink href={`/login?mode=cadastrar&next=${encodeURIComponent(next)}`} intent={intencao} label={c.label} /></div>
    <p className="mt-4 text-sm text-slate-600">7 dias de teste, sem cartão, para novas contas elegíveis. Depois, módulo avulso por {formatarReais(BASE_SAAS_CENTAVOS.avulso)}/mês, mediante contratação. Íris e WhatsApp são adicionais e não estão incluídos nesta escolha.</p>
    <section className="mt-16 border-y border-slate-200 py-8"><h2 className="text-xl font-semibold">Um exemplo para começar</h2><p className="mt-4 leading-relaxed text-slate-700">{c.example}</p></section>
    <section className="mt-10"><h2 className="text-xl font-semibold">Do cadastro à prática</h2><ol className="mt-5 list-decimal space-y-4 pl-5 text-slate-700">{c.steps.map(step => <li key={step}>{step}</li>)}</ol><p className="mt-6 text-sm text-slate-600">Após criar a conta e confirmar o e-mail, confira o módulo selecionado e as condições antes de iniciar o teste. A análise apoia sua preparação e não garante contratação. A SOMA não tem vínculo com a Gupy.</p></section>
    <p className="mt-10">Quer acompanhamento humano? <Link className="underline" href="/planos">Conheça a mentoria e os planos completos.</Link></p>
  </section></main><SomaSiteFooter /></>;
}

import Link from 'next/link';
import Image from 'next/image';
import styles from './campaign.module.css';
import { notFound } from 'next/navigation';
import { SomaSiteFooter } from '@/components/public/SomaMarketingChrome';
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
  const cv = intencao === 'curriculo';
  const href = `/login?mode=cadastrar&next=${encodeURIComponent(next)}`;
  const cta = <CampaignLink href={href} intent={intencao} label={cv ? 'Quero revisar meu currículo' : 'Quero preparar minha entrevista'} />;
  return <><main className={styles.page}>
    <nav className={styles.nav} aria-label="Navegação da campanha"><Link href="/" className={styles.logo}>SOMA<span>carreira</span></Link><Link href="/login">Já tenho conta ↗</Link></nav>
    <section className={styles.hero}>
      <div><p className={styles.eyebrow}>SUA PRÓXIMA OPORTUNIDADE COMEÇA NA PREPARAÇÃO</p>
      <h1>{cv ? <>Sua experiência é boa.<br />Seu currículo <em>mostra isso?</em></> : <>Você tem história.<br />Vamos preparar <em>como contar.</em></>}</h1>
      <p className={styles.lead}>{cv ? 'Chega de trocar duas palavras e enviar de novo. Compare seu currículo com uma vaga e descubra o que precisa ficar mais claro.' : 'Na hora do “fale sobre você”, não precisa começar do zero. Organize experiências reais para a conversa que vem aí.'}</p>
      <div className={styles.action}>{cta}<span>Teste por 7 dias · Sem cartão</span></div>
      <a className={styles.textLink} href="#na-pratica">Veja um exemplo na prática ↓</a></div>
      <div className={styles.demo} id="na-pratica"><div className={styles.demoTop}><span>S.</span><p>PEQUENA MUDANÇA.<br />MAIS CONTEXTO.</p><span>01 / 02</span></div>
        <p className={styles.demoLabel}>{cv ? 'O QUE COSTUMA APARECER' : 'A RESPOSTA QUE DIZ POUCO'}</p>
        <p className={styles.before}>{cv ? '“Responsável por relatórios.”' : '“Sou proativa e gosto de desafios.”'}</p>
        <div className={styles.turn}>↓</div><p className={styles.demoLabel}>O QUE VOCÊ PODE EXPLICAR</p>
        <p className={styles.after}>{cv ? '“Organizei os relatórios de vendas para apoiar a reunião semanal da equipe.”' : '“A equipe precisava organizar as entregas. Criei uma rotina de acompanhamento e passei a revisar os prazos com o time.”'}</p>
        <p className={styles.note}>Exemplo ilustrativo. Use apenas experiências que você viveu.</p>
      </div>
    </section>
    <div className={styles.ribbon}><span>Currículo com contexto</span><span>Preparação para entrevistas</span><span>Seu próximo passo, mais claro</span></div>
    <section className={styles.method}><div><p className={styles.eyebrow}>MENOS TENTATIVA NO ESCURO</p><h2>{cv ? 'Uma vaga de cada vez. Uma revisão com direção.' : 'Uma boa resposta começa antes da entrevista.'}</h2><p>Você traz a trajetória. A SOMA oferece ferramentas para organizar a preparação. A decisão sobre o que faz sentido continua com você.</p></div>
      <ol>{c.steps.map((step,i)=><li key={step}><span>0{i+1}</span><p>{step}</p></li>)}</ol>
    </section>
    <section className={styles.founder}><Image src="/images/jaqueline-amaro-home-20261027.webp" alt="Jaqueline Amaro, fundadora da SOMA" width={480} height={600} sizes="(max-width: 700px) 100vw, 380px" /><div><p className={styles.eyebrow}>TEM GENTE POR TRÁS DA SOMA</p><h2>Sua carreira vai além<br />da próxima candidatura.</h2><p>A SOMA foi criada por Jaqueline Amaro. Aqui, ferramentas de preparação e mentoria humana são caminhos que você escolhe conforme seu momento.</p><p>Quer começar por uma questão concreta? Experimente uma ferramenta. Precisa conversar sobre direção, escolhas e desenvolvimento? Conheça o acompanhamento de carreira.</p><Link className={styles.textLink} href="/quem-faz">Conheça quem faz a SOMA ↗</Link></div></section>
    <section className={styles.offer}><div><p className={styles.eyebrow}>COMECE PELO QUE VOCÊ PRECISA AGORA</p><h2>{cv ? 'Dê uma chance melhor à sua próxima versão.' : 'Leve sua experiência para a conversa.'}</h2><p>Crie sua conta, confirme seu e-mail e confira o módulo selecionado antes de iniciar o teste.</p></div><div className={styles.price}><span>UMA FERRAMENTA À SUA ESCOLHA</span><h3>7 dias para experimentar</h3><p>Sem cartão no teste. Depois, {formatarReais(BASE_SAAS_CENTAVOS.avulso)}/mês, mediante contratação.</p>{cta}<p className={styles.note}>Para novas contas elegíveis. Íris e WhatsApp são adicionais, não incluídos nesta escolha.</p></div></section>
    <section className={styles.faq}><h2>Antes de começar</h2><details><summary>Preciso contratar a mentoria?</summary><p>Não. Este acesso é ao módulo avulso da Plataforma. O acompanhamento humano tem planos próprios em <Link href="/planos">Planos</Link>.</p></details><details><summary>O que acontece quando o teste termina?</summary><p>Para continuar usando a ferramenta, escolha a contratação na Plataforma. O teste não pede cartão. Confira as condições de acesso na sua conta.</p></details><details><summary>Isso garante uma vaga ou aprovação?</summary><p>Não. As ferramentas apoiam sua preparação. Resultados de processos seletivos dependem de vários fatores. A SOMA não tem vínculo com a Gupy.</p></details></section>
  </main><SomaSiteFooter /></>;
}

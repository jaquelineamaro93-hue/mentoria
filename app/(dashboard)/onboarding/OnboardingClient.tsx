'use client';

import { useEffect, useState } from 'react';
import { Mascot } from '@/components/soma/CareerJourney';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowRight, BookOpenText, Check, ChevronDown, Compass, FileSearch,
  Lightbulb, MessageCircle, NotebookPen, Sparkles, Target, Users,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { posthog } from '@/lib/posthog';
import type { Profile } from '@/lib/types';

interface Progresso {
  onboardingFeito: boolean;
  blocosQuemSouEu: number;
  totalBlocosQuemSouEu: number;
  fezVia: boolean;
  secoesPdi: number;
  totalSecoesPdi: number;
  anotacoesDiario: number;
  feedback360Rodadas: number;
  cvSimulacoes: number;
  linkedinRascunhos: number;
}

type Recurso = {
  key: string;
  titulo: string;
  descricao: string;
  beneficio: string;
  href: string;
  cta: string;
  feito?: boolean;
  progresso?: string;
  icon: typeof Compass;
};

const outrasFerramentas = [
  { grupo: 'Autoconhecimento e acompanhamento', itens: [
    { key: 'feedbacks', titulo: 'Feedbacks recebidos', href: '/feedbacks', descricao: 'Releia orientações e transforme comentários em ações.' },
    { key: 'gravacoes', titulo: 'Gravações', href: '/gravacoes', descricao: 'Retome conversas e aprendizados no seu ritmo.' },
  ] },
  { grupo: 'Crescimento na empresa', itens: [
    { key: 'cenario', titulo: 'Leitura de cenário', href: '/leitura-cenario', descricao: 'Entenda pessoas, contexto e oportunidades antes de agir.' },
  ] },
  { grupo: 'Mercado de trabalho', itens: [
    { key: 'gupy', titulo: 'Gupy & ATS', href: '/gupy', descricao: 'Prepare seu currículo para sistemas de seleção.' },
    { key: 'conteudo_linkedin', titulo: 'Conteúdo & marca pessoal', href: '/conteudo-linkedin', descricao: 'Transforme sua experiência em conteúdo relevante.' },
    { key: 'vagas', titulo: 'Vagas & candidaturas', href: '/carreira?etapa=vagas', descricao: 'Organize oportunidades e próximos movimentos.' },
    { key: 'network', titulo: 'Rede & oportunidades', href: '/network', descricao: 'Amplie relacionamentos com intenção.' },
  ] },
  { grupo: 'Comunidade e sua experiência', itens: [
    { key: 'pares', titulo: 'Feedback entre colegas', href: '/feedback-pares', descricao: 'Troque percepções e aprenda com outras pessoas.' },
    { key: 'avaliar', titulo: 'Avaliar a mentoria', href: '/minha-trilha', descricao: 'Conte o que funciona e ajude a melhorar sua jornada.' },
    { key: 'indicar', titulo: 'Indique um amigo', href: '/indique-um-amigo', descricao: 'Apresente a SOMA a quem pode se beneficiar.' },
    { key: 'passaporte', titulo: 'Meu Passaporte', href: '/passaporte', descricao: 'Acompanhe marcos da sua trajetória.' },
    { key: 'plano', titulo: 'Meu Plano', href: '/meu-plano', descricao: 'Consulte as informações do seu plano de mentoria.' },
  ] },
];

export default function OnboardingClient({
  profile,
  progresso,
}: {
  profile: Profile | null;
  progresso: Progresso;
}) {
  const router = useRouter();
  const [salvandoAdmin, setSalvandoAdmin] = useState(false);
  const [mascoteAtivo, setMascoteAtivo] = useState(0);
  const pontos = profile?.pontos_total ?? 0;
  const guias = [
    { nome: 'Lume', frase: 'Comece por suas forças. Você já tem muito para descobrir.', cor: '#E9B95F', etapa: 'Autoconhecimento' },
    { nome: 'Norte', frase: 'Uma direção clara nasce de um próximo passo possível.', cor: '#E79574', etapa: 'Planejamento' },
    { nome: 'Brasa', frase: 'Pequenas ações repetidas também constroem grandes mudanças.', cor: '#8AC6B1', etapa: 'Constância' },
    { nome: 'Íris', frase: 'Sua história pode abrir caminhos que você ainda não imaginou.', cor: '#B9A3DF', etapa: 'Oportunidades' },
  ];
  useEffect(() => {
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) return;
    const targets = document.querySelectorAll<HTMLElement>('[data-soma-capitulo]');
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting).sort((a,b) => b.intersectionRatio - a.intersectionRatio);
      if (visible.length) setMascoteAtivo(Number((visible[0].target as HTMLElement).dataset.somaCapitulo ?? 0));
    }, { rootMargin: '-20% 0px -35% 0px', threshold: [0, 0.2, 0.5, 0.8] });
    targets.forEach((target) => observer.observe(target));
    return () => observer.disconnect();
  }, []);
  const [onboardingAdmin, setOnboardingAdmin] = useState(progresso.onboardingFeito);
  const totalBlocos = Math.max(1, progresso.totalBlocosQuemSouEu);
  const totalPdi = Math.max(1, progresso.totalSecoesPdi);

  const etapas: Recurso[] = [
    {
      key: 'perfil',
      titulo: 'Prepare seu perfil',
      descricao: 'Confirme seus dados e adicione uma foto para identificar sua conta.',
      beneficio: 'Seu espaço fica pronto para acompanhar sua evolução.',
      feito: Boolean(profile?.foto_url && profile?.nome),
      progresso: profile?.foto_url && profile?.nome ? 'Perfil configurado' : 'Foto e nome necessários',
      href: '/perfil', cta: 'Ver meu perfil', icon: Users,
    },
    {
      key: 'boas_vindas',
      titulo: 'Alinhe seus objetivos com a mentoria',
      descricao: 'Use o encontro inicial para combinar expectativas, prioridades e próximos passos.',
      beneficio: 'Você entende por onde começar e o que quer alcançar.',
      feito: progresso.onboardingFeito,
      progresso: progresso.onboardingFeito ? 'Etapa confirmada' : 'Aguardando confirmação do encontro',
      href: '/votar-encontro', cta: 'Ver encontros', icon: MessageCircle,
    },
    {
      key: 'mapa',
      titulo: 'Descubra seu ponto de partida',
      descricao: 'No Mapa Quem Sou Eu, organize sua história, competências, valores e objetivos.',
      beneficio: 'Transforme autoconhecimento em decisões mais claras.',
      feito: progresso.blocosQuemSouEu >= totalBlocos,
      progresso: `${Math.min(progresso.blocosQuemSouEu, totalBlocos)} de ${totalBlocos} blocos preenchidos`,
      href: '/quem-sou-eu', cta: 'Abrir meu mapa', icon: Compass,
    },
    {
      key: 'via',
      titulo: 'Reconheça suas forças',
      descricao: 'Faça o diagnóstico VIA para identificar forças de caráter que pode usar no dia a dia.',
      beneficio: 'Aproveite seus pontos fortes de forma intencional.',
      feito: progresso.fezVia,
      progresso: progresso.fezVia ? 'Diagnóstico registrado' : 'Diagnóstico pendente',
      href: '/exercicios', cta: 'Explorar diagnóstico', icon: Sparkles,
    },
    {
      key: 'pdi',
      titulo: 'Transforme objetivos em um plano',
      descricao: 'No Plano de Desenvolvimento Individual (PDI), organize prioridades e ações.',
      beneficio: 'Saia da reflexão com passos concretos para evoluir.',
      feito: progresso.secoesPdi >= totalPdi,
      progresso: `${Math.min(progresso.secoesPdi, totalPdi)} de ${totalPdi} seções preenchidas`,
      href: '/meu-pdi', cta: 'Abrir meu PDI', icon: Target,
    },
    {
      key: 'diario',
      titulo: 'Registre sua evolução',
      descricao: 'Use o Diário de Bordo após encontros, desafios ou conquistas.',
      beneficio: 'Perceba mudanças ao longo do tempo e leve exemplos às sessões.',
      feito: progresso.anotacoesDiario > 0,
      progresso: progresso.anotacoesDiario > 0
        ? `${progresso.anotacoesDiario} ${progresso.anotacoesDiario === 1 ? 'registro' : 'registros'} no diário`
        : 'Faça seu primeiro registro',
      href: '/diario', cta: 'Abrir meu diário', icon: NotebookPen,
    },
  ];

  const exploracao: Recurso[] = [
    {
      key: 'percepcao_360', titulo: 'Percepção 360',
      descricao: 'Reúna feedbacks de pessoas de diferentes contextos e identifique padrões.',
      beneficio: 'Compare como você se vê com a percepção de outras pessoas.',
      href: '/percepcao-360', cta: 'Explorar feedback 360', icon: Users,
      feito: progresso.feedback360Rodadas > 0,
      progresso: progresso.feedback360Rodadas > 0
        ? `${progresso.feedback360Rodadas} ${progresso.feedback360Rodadas === 1 ? 'rodada criada' : 'rodadas criadas'}`
        : 'Ainda não explorado',
    },
    {
      key: 'curriculo', titulo: 'Análise de currículo',
      descricao: 'Revise como sua trajetória está apresentada para uma oportunidade.',
      beneficio: 'Comunique melhor sua experiência e seus resultados.',
      href: '/carreira?etapa=cv', cta: 'Analisar currículo', icon: FileSearch,
      feito: progresso.cvSimulacoes > 0,
      progresso: progresso.cvSimulacoes > 0
        ? `${progresso.cvSimulacoes} ${progresso.cvSimulacoes === 1 ? 'análise registrada' : 'análises registradas'}`
        : 'Ainda não explorado',
    },
    {
      key: 'primeiros_90_dias', titulo: 'Primeiros 90 dias',
      descricao: 'Planeje sua chegada ou seus primeiros movimentos em uma nova função.',
      beneficio: 'Ganhe clareza sobre prioridades, relações e entregas.',
      href: '/primeiros-90-dias', cta: 'Conhecer a ferramenta', icon: Target,
    },
    {
      key: 'linkedin', titulo: 'LinkedIn estratégico',
      descricao: 'Trabalhe seu posicionamento profissional e sua visibilidade.',
      beneficio: 'Mostre seu valor para as oportunidades certas.',
      href: '/linkedin', cta: 'Explorar LinkedIn', icon: Lightbulb,
    },
    {
      key: 'entrevistas', titulo: 'Entrevistas e simulações',
      descricao: 'Treine como contar suas experiências e responder a perguntas.',
      beneficio: 'Chegue às conversas com exemplos e mais segurança.',
      href: '/carreira?etapa=entrevista', cta: 'Treinar entrevista', icon: BookOpenText,
    },
  ];

  const concluidas = etapas.filter((etapa) => etapa.feito).length;
  const percentual = Math.round((concluidas / etapas.length) * 100);
  const proxima = etapas.find((etapa) => !etapa.feito);
  const registrarClique = (key: string, grupo: string) =>
    posthog.capture('onboarding_recurso_aberto', { recurso: key, grupo });

  async function atualizarOnboarding(checked: boolean) {
    if (!profile || salvandoAdmin) return;
    setSalvandoAdmin(true);
    const supabase = createClient();
    const { error } = await supabase.from('profiles')
      .update({ onboarding_concluido: checked }).eq('id', profile.id);
    if (!error) {
      setOnboardingAdmin(checked);
      router.refresh();
    }
    setSalvandoAdmin(false);
  }

  return (
    <main className="w-full max-w-6xl mx-auto px-4 py-6 sm:px-6 md:py-9 text-black">
      <header className="relative mb-8 overflow-hidden rounded-[28px] bg-[#102A2B] px-6 py-8 text-white sm:px-9 sm:py-10 lg:px-12">
        <div aria-hidden="true" className="pointer-events-none absolute -right-24 -top-28 h-80 w-80 rounded-full border-[45px] border-[#FFB366]/20" />
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-40 right-16 h-80 w-80 rounded-full bg-[#0D8071]/35 blur-3xl" />
        <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1fr)_260px] lg:items-center">
          <div>
            <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold tracking-widest text-[#F9D1A7]">
              <Sparkles size={14} aria-hidden="true" /> SUA JORNADA SOMA
            </p>
            <h1 className="max-w-2xl font-display text-4xl leading-tight text-white sm:text-5xl">Sua evolução começa aqui.</h1>
            <p className="mt-4 max-w-xl text-sm leading-7 text-white/85 sm:text-base">
              Um caminho para se conhecer, planejar seus próximos movimentos e descobrir ferramentas que fazem sentido para você.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <a href="#explorar-titulo" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#FFB366] px-5 py-3 text-sm font-semibold text-[#172C2B] transition-transform hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
                Explorar ferramentas <ArrowRight size={17} aria-hidden="true" />
              </a>
              <a href="#essenciais-titulo" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/30 px-4 py-3 text-sm font-medium text-white hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
                Minha jornada
              </a>
            </div>
          </div>
          <section aria-labelledby="progresso-titulo" className="relative rounded-2xl border border-white/20 bg-white/10 p-5 backdrop-blur-sm">
            <p className="text-xs font-semibold uppercase tracking-widest text-white/75">Seu progresso</p>
            <h2 id="progresso-titulo" className="mt-3 text-4xl font-semibold tracking-tight text-white">{percentual}<span className="text-2xl text-[#FFB366]">%</span></h2>
            <p className="mt-1 text-sm text-white/85">{concluidas} de {etapas.length} etapas essenciais</p>
            <div role="progressbar" aria-label="Etapas essenciais concluídas" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percentual} aria-valuetext={`${concluidas} de ${etapas.length} etapas concluídas`} className="mt-4 h-2 overflow-hidden rounded-full bg-white/20">
              <div className="h-full rounded-full bg-[#FFB366] transition-[width] motion-reduce:transition-none" style={{ width: `${percentual}%` }} />
            </div>
            <p className="mt-4 text-xs leading-5 text-white/80">
              {proxima ? `Próximo passo: ${proxima.titulo}` : 'Sua base está pronta. Continue explorando no seu ritmo.'}
            </p>
            {proxima && <Link href={proxima.href} onClick={() => registrarClique(proxima.key, 'proximo_passo')} className="mt-3 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-[#FFB366] underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">{proxima.cta} <ArrowRight size={15} aria-hidden="true" /></Link>}
          </section>
        </div>
      </header>

      <section aria-label="Seus companheiros da Expedição SOMA" className="mb-8 overflow-hidden rounded-[24px] border border-[#DDE6E0] bg-[#F7F7EE] p-4 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-xl">
            <p className="text-xs font-bold uppercase tracking-[.18em] text-[#386657]">A Expedição SOMA acompanha você</p>
            <h2 className="mt-2 font-display text-2xl text-[#183F37] sm:text-3xl">Quatro companheiros para acompanhar sua história</h2>
            <p className="mt-2 text-sm leading-6 text-[#52675B]">Conheça Lume, Norte, Brasa e Íris. Eles apresentam cada capítulo da jornada e acompanham suas descobertas. Suas conquistas e Impulsos continuam registrados no Meu Passaporte.</p>
            <Link href="/passaporte" onClick={() => registrarClique('passaporte', 'expedicao')} className="mt-3 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-[#183F37] underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#183F37]">Ver minhas conquistas e ranking <ArrowRight size={16} aria-hidden="true" /></Link>
          </div>
          <div className="grid grid-cols-4 gap-2 sm:gap-3" role="group" aria-label="Escolha um companheiro para conhecer sua mensagem">
            {guias.map((guia, i) => (
              <button key={guia.nome} type="button" onClick={() => { setMascoteAtivo(i); posthog.capture('onboarding_mascote_selecionado', { mascote: guia.nome }); }} aria-pressed={mascoteAtivo === i}
                className={`group relative flex min-h-28 min-w-0 flex-col items-center justify-center gap-1 overflow-visible rounded-2xl border p-2 transition-all duration-300 hover:-translate-y-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#183F37] motion-reduce:transform-none ${mascoteAtivo === i ? 'border-[#386657] bg-white shadow-lg' : 'border-transparent bg-white/60 hover:border-[#A7C5B2]'}`}>
                <span aria-hidden="true" className={`pointer-events-none absolute inset-x-3 bottom-7 h-6 rounded-full opacity-30 blur-lg ${mascoteAtivo === i ? 'scale-125' : ''}`} style={{ backgroundColor: guia.cor }} />
                <span className={`relative block origin-bottom transform-gpu transition-transform duration-500 group-hover:rotate-[-5deg] group-hover:scale-110 motion-reduce:transform-none ${mascoteAtivo === i ? 'motion-safe:animate-[soma-float_3s_ease-in-out_infinite]' : ''}`}><Mascot index={i} size={74} /></span>
                <span className="relative text-xs font-bold text-[#183F37]">{guia.nome}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl bg-white px-4 py-3" aria-live="polite">
          <span className="rounded-full px-3 py-1 text-xs font-bold text-[#183F37]" style={{backgroundColor: guias[mascoteAtivo].cor + '55'}}>{guias[mascoteAtivo].nome} · {guias[mascoteAtivo].etapa}</span>
          <p className="flex-1 text-sm text-[#334B41]">“{guias[mascoteAtivo].frase}”</p>
          <span className="text-xs font-semibold text-[#386657]">{pontos.toLocaleString('pt-BR')} Impulsos</span>
        </div>
        <style jsx>{`@keyframes soma-float { 0%, 100% { transform: translateY(0) rotate(-2deg); } 50% { transform: translateY(-9px) rotate(3deg); } } @media (prefers-reduced-motion: reduce) { .motion-safe\\:animate-\\[soma-float_3s_ease-in-out_infinite\\] { animation: none !important; } }`}</style>
      </section>

      <div data-soma-capitulo="0" aria-hidden="true" className="h-px" />
      <section aria-labelledby="essenciais-titulo" className="mb-10">
        <div className="mb-4">
          <h2 id="essenciais-titulo" className="font-display text-3xl text-black">1. Construa sua base</h2>
          <p className="mt-1 text-sm leading-6 text-gray-700">
            Estes passos conectam autoconhecimento, objetivos e acompanhamento. Concluído não significa encerrado: você pode atualizar tudo.
          </p>
        </div>
        <div className="grid gap-3">
          {etapas.map((etapa, i) => {
            const Icon = etapa.icon;
            return (
              <article key={etapa.key} className="group rounded-2xl border border-[#E4E8E7] bg-white p-5 shadow-[0_4px_24px_rgba(16,42,43,0.035)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#0D8071]/40 hover:shadow-[0_12px_36px_rgba(16,42,43,0.08)] motion-reduce:transform-none">
                <div className="flex items-start gap-3 sm:gap-4">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#E4F3F0] text-[#0D8071]" aria-hidden="true">
                    {etapa.feito ? <Check size={18} /> : <span className="text-sm font-semibold">{i + 1}</span>}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-semibold text-black">{etapa.titulo}</h3>
                      <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${etapa.feito ? 'bg-mint-light text-black' : 'bg-gray-100 text-gray-700'}`}>
                        {etapa.feito ? 'Concluído' : 'A fazer'}
                      </span>
                    </div>
                    <p className="mt-1 text-sm leading-6 text-gray-700">{etapa.descricao}</p>
                    <p className="mt-1 text-sm leading-6 text-black"><strong>Por que importa:</strong> {etapa.beneficio}</p>
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                      <span className="text-xs font-medium text-gray-700">{etapa.progresso}</span>
                      <Link href={etapa.href} onClick={() => registrarClique(etapa.key, 'essenciais')}
                        className="inline-flex min-h-11 items-center gap-1.5 rounded-lg px-2 text-sm font-semibold text-mint-deep underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brown">
                        {etapa.feito ? 'Revisitar' : etapa.cta} <ArrowRight size={15} aria-hidden="true" />
                      </Link>
                    </div>
                  </div>
                  <Icon size={20} className="hidden shrink-0 text-mint-deep sm:block" aria-hidden="true" />
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <div data-soma-capitulo="3" aria-hidden="true" className="h-px" />
      <section aria-labelledby="explorar-titulo" className="mb-10">
        <div className="mb-4">
          <h2 id="explorar-titulo" className="font-display text-2xl text-black">2. Explore conforme seu objetivo</h2>
          <p className="mt-1 text-sm leading-6 text-gray-700">
            Não é preciso fazer tudo de uma vez. Escolha o recurso que responde ao seu desafio de agora.
          </p>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {exploracao.map((item) => {
            const Icon = item.icon;
            return (
              <article key={item.key} className="flex flex-col rounded-xl border border-gray-200 bg-white p-5 transition-colors hover:border-mint-border hover:bg-mint-light/20">
                <div className="flex items-center justify-between gap-3">
                  <Icon size={21} className="text-mint-deep" aria-hidden="true" />
                  {item.progresso && (
                    <span className="text-xs font-medium text-gray-700">{item.progresso}</span>
                  )}
                </div>
                <h3 className="mt-3 text-base font-semibold text-black">{item.titulo}</h3>
                <p className="mt-1 text-sm leading-6 text-gray-700">{item.descricao}</p>
                <p className="mt-2 text-sm leading-6 text-black"><strong>Você ganha:</strong> {item.beneficio}</p>
                <Link href={item.href} onClick={() => registrarClique(item.key, 'exploracao')}
                  className="mt-auto inline-flex min-h-11 items-center gap-2 self-start pt-3 text-sm font-semibold text-brown underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brown">
                  {item.cta} <ArrowRight size={15} aria-hidden="true" />
                </Link>
              </article>
            );
          })}
        </div>

        <details className="group mt-4 rounded-xl border border-gray-200 bg-white p-4 sm:p-5">
          <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 rounded-lg text-sm font-semibold text-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brown [&::-webkit-details-marker]:hidden">
            Conhecer todas as outras ferramentas
            <ChevronDown size={19} className="shrink-0 transition-transform group-open:rotate-180" aria-hidden="true" />
          </summary>
          <div className="mt-4 space-y-5 border-t border-gray-200 pt-4">
            {outrasFerramentas.map((grupo) => (
              <div key={grupo.grupo}>
                <h3 className="text-sm font-semibold text-black">{grupo.grupo}</h3>
                <ul className="mt-2 grid gap-2 sm:grid-cols-2">
                  {grupo.itens.map((item) => (
                    <li key={item.key}>
                      <Link href={item.href} onClick={() => registrarClique(item.key, 'catalogo')}
                        className="flex min-h-14 items-center justify-between gap-3 rounded-lg border border-gray-200 p-3 hover:border-brown focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brown">
                        <span>
                          <span className="block text-sm font-medium text-black">{item.titulo}</span>
                          <span className="mt-1 block text-xs leading-5 text-gray-700">{item.descricao}</span>
                        </span>
                        <ArrowRight size={15} className="shrink-0 text-brown" aria-hidden="true" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </details>
      </section>

      {profile?.is_admin && (
        <section aria-label="Configurações administrativas de onboarding" className="rounded-xl border border-amber-300 bg-amber-50 p-5">
          <h2 className="text-sm font-semibold text-amber-950">Configuração administrativa</h2>
          <p className="mt-1 text-sm text-amber-950">Esta opção confirma a sessão inicial. Não altera o preenchimento das demais ferramentas.</p>
          <label className="mt-3 flex min-h-11 items-center gap-3 text-sm font-medium text-amber-950">
            <input type="checkbox" checked={onboardingAdmin} disabled={salvandoAdmin}
              onChange={(event) => void atualizarOnboarding(event.target.checked)}
              className="h-5 w-5 accent-amber-800" />
            Marcar sessão inicial como concluída
          </label>
        </section>
      )}
    </main>
  );
}

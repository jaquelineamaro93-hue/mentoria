'use client';

import { useState } from 'react';
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
      <header className="mb-7">
        <p className="text-xs font-semibold uppercase tracking-widest text-mint-deep">Sua jornada na SOMA</p>
        <h1 className="mt-2 font-display text-3xl md:text-4xl text-black">Primeiros passos</h1>
        <p className="mt-3 max-w-3xl text-base leading-7 text-gray-700">
          Entenda o propósito de cada ferramenta, escolha seu próximo passo e volte sempre que precisar.
          Você pode revisitar qualquer etapa, mesmo depois de concluí-la.
        </p>
      </header>

      <section aria-labelledby="progresso-titulo" className="rounded-2xl border border-mint-border bg-white p-5 sm:p-6 mb-7 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 id="progresso-titulo" className="text-xl font-semibold text-black">Sua jornada essencial: {percentual}%</h2>
            <p className="mt-1 text-sm text-gray-700">
              {concluidas} de {etapas.length} passos essenciais concluídos. As demais ferramentas são opcionais e podem ser usadas no seu ritmo.
            </p>
          </div>
          <span className="rounded-full bg-mint-light px-3 py-1.5 text-sm font-semibold text-black">
            {concluidas}/{etapas.length} etapas
          </span>
        </div>
        <div
          className="mt-4 h-2.5 overflow-hidden rounded-full bg-gray-200"
          role="progressbar"
          aria-label="Progresso dos passos essenciais"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percentual}
          aria-valuetext={`{concluidas} de {etapas.length} etapas concluídas`}
        >
          <div className="h-full rounded-full bg-mint-deep transition-all" style={{ width: `{percentual}%` }} />
        </div>
        {proxima ? (
          <div className="mt-5 flex flex-col gap-3 rounded-xl border border-mint bg-mint-light p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-brown">Próximo passo sugerido</p>
              <p className="mt-1 font-medium text-black">{proxima.titulo}</p>
              <p className="mt-1 text-sm text-gray-700">{proxima.beneficio}</p>
            </div>
            <Link href={proxima.href} onClick={() => registrarClique(proxima.key, 'proximo_passo')}
              className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-lg bg-mint-deep px-4 py-2.5 text-sm font-semibold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brown">
              {proxima.cta} <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>
        ) : (
          <p className="mt-4 text-sm font-medium text-black">
            Sua base está completa. Explore novas ferramentas abaixo e continue revisitando suas anotações e seu plano.
          </p>
        )}
      </section>

      <section aria-labelledby="essenciais-titulo" className="mb-10">
        <div className="mb-4">
          <h2 id="essenciais-titulo" className="font-display text-2xl text-black">1. Construa sua base</h2>
          <p className="mt-1 text-sm leading-6 text-gray-700">
            Estes passos conectam autoconhecimento, objetivos e acompanhamento. Concluído não significa encerrado: você pode atualizar tudo.
          </p>
        </div>
        <div className="grid gap-3">
          {etapas.map((etapa, i) => {
            const Icon = etapa.icon;
            return (
              <article key={etapa.key} className="rounded-xl border border-gray-200 bg-white p-4 sm:p-5 transition-colors hover:border-mint-border hover:bg-mint-light/20">
                <div className="flex items-start gap-3 sm:gap-4">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-mint-light text-black" aria-hidden="true">
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
                  <Icon size={20} className="hidden shrink-0 text-brown sm:block" aria-hidden="true" />
                </div>
              </article>
            );
          })}
        </div>
      </section>

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

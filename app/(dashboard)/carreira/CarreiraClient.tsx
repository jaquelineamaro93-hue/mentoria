'use client';

import { useState } from 'react';
import { BriefcaseBusiness, CheckCircle2, FileSearch, Sparkles } from 'lucide-react';
import SimuladorCVClient from '@/app/(dashboard)/simulador-cv/SimuladorCVClient';
import VagasClient from '@/app/(dashboard)/vagas/VagasClient';
import EntrevistaClient from '@/app/(dashboard)/entrevista/EntrevistaClient';
import type { CvSimulacao, Profile } from '@/lib/types';

type Etapa = 'cv' | 'vagas' | 'entrevista';

interface Props {
  initialStep: Etapa;
  profile: Profile | null;
  userId: string;
  simulacoes: CvSimulacao[];
  usadasEsteMes: number;
  vagas: any[];
  soarCount: number;
  latestCurriculo: string;
  latestVaga: string;
}

export default function CarreiraClient({
  initialStep,
  profile,
  userId,
  simulacoes,
  usadasEsteMes,
  vagas,
  soarCount,
  latestCurriculo,
  latestVaga,
}: Props) {
  const [etapa, setEtapa] = useState<Etapa>(initialStep);

  const steps = [
    {
      id: 'cv' as const,
      numero: '01',
      titulo: 'CV & aderência',
      descricao: 'Entenda seu fit e adapte sua narrativa.',
      icon: FileSearch,
      count: simulacoes.length,
      countLabel: 'análises',
      done: simulacoes.length > 0,
    },
    {
      id: 'vagas' as const,
      numero: '02',
      titulo: 'Candidaturas',
      descricao: 'Compare oportunidades e acompanhe cada processo.',
      icon: BriefcaseBusiness,
      count: vagas.length,
      countLabel: 'vagas',
      done: vagas.length > 0,
    },
    {
      id: 'entrevista' as const,
      numero: '03',
      titulo: 'Entrevista SOAR',
      descricao: 'Transforme experiências em respostas fortes.',
      icon: Sparkles,
      count: soarCount,
      countLabel: 'preparações',
      done: soarCount > 0,
    },
  ];

  function mudarEtapa(nova: Etapa) {
    setEtapa(nova);
    const url = new URL(window.location.href);
    url.searchParams.set('etapa', nova);
    window.history.replaceState({}, '', url.toString());
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <div className="w-full">
      <header className="mb-7">
        <p className="text-xs uppercase tracking-[0.16em] text-gray-text mb-2">Jornada de carreira</p>
        <h1 className="font-display text-3xl md:text-4xl text-black mb-2">Da vaga à entrevista, sem recomeçar do zero</h1>
        <p className="text-sm md:text-base text-gray-text max-w-3xl leading-relaxed">
          Seu currículo, análises, candidaturas e preparação de entrevista ficam conectados. A SOMA reaproveita o que
          você já construiu para que cada etapa gere contexto para a próxima.
        </p>
      </header>

      <div className="grid lg:grid-cols-3 gap-3 mb-8" role="tablist" aria-label="Etapas da jornada de carreira">
        {steps.map((step) => {
          const Icon = step.icon;
          const active = etapa === step.id;
          return (
            <button
              key={step.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => mudarEtapa(step.id)}
              className={`relative text-left rounded-xl border p-4 transition-all ${active
                ? 'border-mint-deep bg-mint-light/50 shadow-sm'
                : 'border-gray-faint bg-white hover:border-mint'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <span
                    className={`w-9 h-9 rounded-lg grid place-items-center shrink-0 ${active
                      ? 'bg-mint-deep text-white'
                      : 'bg-[#eef2f6] text-black'
                    }`}
                  >
                    <Icon size={18} strokeWidth={1.7} />
                  </span>
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.14em] text-gray-text mb-0.5">
                      Etapa {step.numero}
                    </p>
                    <p className="text-sm font-semibold text-black">{step.titulo}</p>
                    <p className="text-xs text-gray-text mt-1 leading-relaxed">{step.descricao}</p>
                  </div>
                </div>
                {step.done && <CheckCircle2 size={17} className="text-mint-deep shrink-0" />}
              </div>
              <div className="mt-3 pt-3 border-t border-gray-faint text-xs text-gray-text">
                {step.count} {step.countLabel}
              </div>
            </button>
          );
        })}
      </div>

      <div className="rounded-2xl border border-gray-faint bg-[#fbfcfd] p-4 md:p-6">
        <div hidden={etapa !== 'cv'}>
          <SimuladorCVClient
            profile={profile}
            userId={userId}
            simulacoesIniciais={simulacoes}
            usadasEsteMes={usadasEsteMes}
            onOpenSoar={() => mudarEtapa('entrevista')}
            onOpenVagas={() => mudarEtapa('vagas')}
          />
        </div>

        <div hidden={etapa !== 'vagas'}>
          <VagasClient profile={profile} embedded />
        </div>

        <div hidden={etapa !== 'entrevista'}>
          <EntrevistaClient
            userId={userId}
            profile={profile}
            embedded
            initialCurriculo={latestCurriculo}
            initialDescricaoVaga={latestVaga}
            applications={vagas}
          />
        </div>
      </div>
    </div>
  );
}

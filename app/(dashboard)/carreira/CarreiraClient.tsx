'use client';

import { useEffect, useState } from 'react';
import { BriefcaseBusiness, CheckCircle2, FileSearch, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
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
  interviewSimulationCount: number;
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
  interviewSimulationCount,
  latestCurriculo,
  latestVaga,
}: Props) {
  const router = useRouter();
  const [etapa, setEtapa] = useState<Etapa>(initialStep);

  useEffect(() => {
    setEtapa(initialStep);
  }, [initialStep]);

  const steps = [
    {
      id: 'cv' as const,
      numero: '01',
      titulo: 'Analisar currículo',
      descricao: 'Compare seu currículo com uma vaga e veja o que fortalecer.',
      icon: FileSearch,
      count: simulacoes.length,
      countLabel: 'análises',
      done: simulacoes.length > 0,
    },
    {
      id: 'vagas' as const,
      numero: '02',
      titulo: 'Vagas & candidaturas',
      descricao: 'Compare oportunidades e acompanhe cada processo seletivo.',
      icon: BriefcaseBusiness,
      count: vagas.length,
      countLabel: 'vagas',
      done: vagas.length > 0,
    },
    {
      id: 'entrevista' as const,
      numero: '03',
      titulo: 'Entrevistas & simulações',
      descricao: 'Prepare suas histórias e pratique com feedback da IA.',
      icon: Sparkles,
      count: soarCount,
      countLabel: `SOAR · ${interviewSimulationCount} simulaç${interviewSimulationCount === 1 ? 'ão' : 'ões'}`,
      done: soarCount > 0 || interviewSimulationCount > 0,
    },
  ];

  function mudarEtapa(nova: Etapa) {
    setEtapa(nova);
    router.replace(`/carreira?etapa=${nova}`, { scroll: false });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <div className="w-full">
      <header className="mb-7">
        <p className="text-xs uppercase tracking-[0.16em] text-gray-text mb-2">Mercado de trabalho</p>
        <h1 className="font-display text-3xl md:text-4xl text-black mb-2">Prepare-se para novas oportunidades</h1>
        <p className="text-sm md:text-base text-gray-text max-w-3xl leading-relaxed">
          Use esta área quando estiver buscando uma nova vaga. Analise seu currículo, compare oportunidades,
          acompanhe candidaturas e pratique entrevistas com todo o contexto conectado.
        </p>
      </header>

      <div className="grid lg:grid-cols-3 gap-3 mb-8" role="tablist" aria-label="Etapas da busca por novas oportunidades">
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

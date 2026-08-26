'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Check, Circle, ArrowRight } from 'lucide-react';
import { Panel, Eyebrow } from '@/components/Panel';
import { createClient } from '@/lib/supabase/client';
import { posthog, limparIdentidade } from '@/lib/posthog';
import type { Profile } from '@/lib/types';

interface Progresso {
  onboardingFeito: boolean;
  blocosQuemSouEu: number;
  totalBlocosQuemSouEu: number;
  fezVia: boolean;
  secoesPdi: number;
  totalSecoesPdi: number;
  anotacoesDiario: number;
}

export default function OnboardingClient({
  profile,
  progresso,
}: {
  profile: Profile | null;
  progresso: Progresso;
}) {
  const router = useRouter();
  const supabase = createClient();

  async function handleSignOut() {
    posthog.capture('logout_realizado');
    await supabase.auth.signOut();
    limparIdentidade();
    router.push('/login');
    router.refresh();
  }

  const etapas = [
    {
      titulo: "Configure seu perfil",
      descricao: "Adicione uma foto, confirme seu nome e defina uma senha. Acesse Meu Perfil pelo menu lateral para atualizar isso a qualquer momento.",
      feita: !!(profile?.foto_url && profile?.nome),
      href: "/perfil",
      cta: "Ir para Meu Perfil",
    },
    {
      titulo: 'Sessão de onboarding',
      descricao: 'Um encontro rápido para alinharmos seus objetivos no início da jornada.',
      feita: progresso.onboardingFeito,
      href: '/votar-encontro',
      cta: 'Ver encontros',
    },
    {
      titulo: 'Mapa Quem Sou Eu',
      descricao: `${progresso.blocosQuemSouEu} de ${progresso.totalBlocosQuemSouEu} blocos preenchidos.`,
      feita: progresso.blocosQuemSouEu >= progresso.totalBlocosQuemSouEu,
      href: '/quem-sou-eu',
      cta: 'Preencher',
    },
    {
      titulo: 'Diagnóstico & Perfil (VIA)',
      descricao: 'Teste de forças de caráter para embasar seu plano de desenvolvimento.',
      feita: progresso.fezVia,
      href: '/exercicios',
      cta: 'Fazer diagnóstico',
    },
    {
      titulo: 'Meu PDI',
      descricao: `${progresso.secoesPdi} de ${progresso.totalSecoesPdi} seções preenchidas.`,
      feita: progresso.secoesPdi >= progresso.totalSecoesPdi,
      href: '/pdi',
      cta: 'Continuar PDI',
    },
    {
      titulo: 'Diário de Bordo',
      descricao:
        progresso.anotacoesDiario > 0
          ? `Você já tem ${progresso.anotacoesDiario} anotação(ões) registrada(s).`
          : 'Registre aprendizados dos seus encontros para acompanhar sua evolução.',
      feita: progresso.anotacoesDiario > 0,
      href: '/diario',
      cta: 'Abrir diário',
    },
  ];

  const concluidas = etapas.filter((e) => e.feita).length;

  return (
    <>
      <div className="px-6 py-8 md:px-12 md:py-12">
        <p className="text-xs uppercase tracking-[0.2em] text-mint mb-2 bg-mint/10 px-3 py-1.5 rounded-md inline-flex items-center gap-2 border border-mint/20">Sua jornada</p>
        <h1 className="font-display text-3xl text-black mb-2">Onboarding</h1>
        <p className="text-sm text-gray-text mb-8">
          {concluidas} de {etapas.length} etapas concluídas. Complete as etapas nesta ordem. Cada uma prepara você para a próxima.
        </p>

        <div className="flex flex-col gap-4">
          {etapas.map((etapa, i) => (
            <Panel
              key={etapa.titulo}
              className={`p-6 flex items-center gap-5 ${etapa.feita ? 'opacity-70' : ''}`}
            >
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 border ${
                  etapa.feita
                    ? 'bg-brown border-brown text-white'
                    : 'border-gray-faint text-gray-text'
                }`}
              >
                {etapa.feita ? <Check size={16} /> : <span className="text-sm">{i + 1}</span>}
              </div>

              <div className="flex-1">
                <p className="text-black font-medium mb-0.5">{etapa.titulo}</p>
                <p className="text-sm text-gray-text">{etapa.descricao}</p>
              </div>

              {!etapa.feita && (
                <Link
                  href={etapa.href}
                  className="shrink-0 flex items-center gap-1.5 text-sm text-black hover:text-orange font-medium whitespace-nowrap"
                >
                  {etapa.cta} <ArrowRight size={14} />
                </Link>
              )}
            </Panel>
          ))}
        </div>

        {profile?.is_admin && (
          <div className="mt-8 bg-amber-50 border border-amber-200 rounded-lg p-6">
            <p className="text-xs uppercase tracking-wide text-amber-900 font-medium mb-3">🔧 Administrador</p>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                defaultChecked={false}
                onChange={async (e) => {
                  const supabase = createClient();
                  await supabase.from('profiles').update({ onboarding_concluido: e.target.checked }).eq('id', profile.id);
                  router.refresh();
                }}
                className="w-4 h-4 accent-amber-700"
              />
              <span className="text-sm text-amber-900">Marcar onboarding como concluído para este mentorado</span>
            </label>
          </div>
        )}

        {concluidas === etapas.length && (
          <div className="mt-8 bg-mint-light border border-mint rounded-lg p-6 text-center">
            <p className="text-black font-medium mb-1">🎉 Você concluiu todo o onboarding!</p>
            <p className="text-sm text-gray-text">
              Agora é seguir acompanhando sua trilha e seu plano de desenvolvimento.
            </p>
          </div>
        )}
      </div>
    </>
  );
}

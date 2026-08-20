'use client';

import { useRouter } from 'next/navigation';
import { Gift, Star, RotateCcw, Megaphone, Users2 } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import { Panel, Eyebrow } from '@/components/Panel';
import { createClient } from '@/lib/supabase/client';
import { posthog, limparIdentidade } from '@/lib/posthog';
import type { Profile } from '@/lib/types';

interface Insights {
  total: number;
  viaIndicacao: number;
  jaIndicaramAlguem: number;
  nuncaAcessaram: number;
  onboardingPendente: number;
}

export default function CrescimentoClient({
  profile,
  insights,
}: {
  profile: Profile;
  insights: Insights;
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

  const percentualIndicacao =
    insights.total > 0 ? Math.round((insights.viaIndicacao / insights.total) * 100) : 0;
  const percentualIndicadoras =
    insights.total > 0 ? Math.round((insights.jaIndicaramAlguem / insights.total) * 100) : 0;

  return (
    
      <div className="mb-6">
        <a href="/admin" className="inline-flex items-center gap-2 text-sm text-ink-faint hover:text-brown-deep transition-colors">← Voltar ao painel
        </a>
      </div>
<div className="flex flex-col md:flex-row w-full">
      <Sidebar profile={profile} onSignOut={handleSignOut} />

      <main className="flex-1 px-6 py-8 md:px-12 md:py-12 max-w-4xl mx-auto w-full">
        <p className="text-xs uppercase tracking-[0.2em] text-sky-deep mb-2">Área administrativa</p>
        <h1 className="font-display text-3xl text-brown-deep mb-1">Boas práticas de crescimento</h1>
        <p className="text-sm text-ink-faint mb-8">
          Um retrato de como as mentoradas atuais chegaram até você, e o que costuma funcionar pra
          trazer as próximas.
        </p>

        <div className="grid sm:grid-cols-3 gap-4 mb-10">
          <Panel className="p-5">
            <Users2 size={18} className="text-sky-deep mb-2" />
            <p className="font-display text-2xl text-brown-deep">{percentualIndicacao}%</p>
            <p className="text-xs text-ink-faint">
              das mentoradas vieram por indicação ({insights.viaIndicacao} de {insights.total})
            </p>
          </Panel>
          <Panel className="p-5">
            <Gift size={18} className="text-sky-deep mb-2" />
            <p className="font-display text-2xl text-brown-deep">{percentualIndicadoras}%</p>
            <p className="text-xs text-ink-faint">
              já indicaram pelo menos uma pessoa ({insights.jaIndicaramAlguem} de {insights.total})
            </p>
          </Panel>
          <Panel className="p-5">
            <RotateCcw size={18} className="text-amber-600 mb-2" />
            <p className="font-display text-2xl text-brown-deep">{insights.nuncaAcessaram}</p>
            <p className="text-xs text-ink-faint">nunca acessaram o portal</p>
          </Panel>
        </div>

        <div className="flex flex-col gap-6">
          <Panel className="p-6">
            <div className="flex items-center gap-2 mb-3">
              <Gift size={17} className="text-brown-deep" />
              <h2 className="font-display text-lg text-brown-deep">Indicação é seu canal mais barato</h2>
            </div>
            <p className="text-sm text-ink-soft leading-relaxed">
              {percentualIndicacao < 30
                ? `Só ${percentualIndicacao}% da sua base veio por indicação, ainda dá pra crescer bastante aqui. `
                : `${percentualIndicacao}% já vem por indicação, é seu canal mais forte hoje. `}
              Quem já teve resultado (fechou um pilar do PDI, subiu de cargo, mudou de área) é quem
              indica com mais convicção. Manda uma mensagem pessoal pra essas pessoas pedindo a
              indicação na hora certa: logo depois de uma conquista visível, não em qualquer momento
              aleatório do mês.
            </p>
          </Panel>

          <Panel className="p-6">
            <div className="flex items-center gap-2 mb-3">
              <Star size={17} className="text-brown-deep" />
              <h2 className="font-display text-lg text-brown-deep">Prova social do que já existe no portal</h2>
            </div>
            <p className="text-sm text-ink-soft leading-relaxed">
              Você já tem PDIs gerados, mapas de essência e planos de desenvolvimento reais. Com
              autorização da mentorada, um trecho anonimizado do diagnóstico ou do "antes e depois"
              do PDI vale mais como conteúdo do que qualquer texto genérico sobre mentoria de
              carreira. Publica no LinkedIn como bastidor do processo, não como resultado fechado.
            </p>
          </Panel>

          <Panel className="p-6">
            <div className="flex items-center gap-2 mb-3">
              <RotateCcw size={17} className="text-brown-deep" />
              <h2 className="font-display text-lg text-brown-deep">Reative antes de captar gente nova</h2>
            </div>
            <p className="text-sm text-ink-soft leading-relaxed">
              {insights.nuncaAcessaram > 0
                ? `${insights.nuncaAcessaram} pessoa(s) nunca acessaram o portal, ` +
                  `e ${insights.onboardingPendente} ainda não fizeram onboarding. `
                : 'Sua base está com acesso em dia. '}
              É mais barato reativar quem já pagou do que captar alguém novo. O lembrete automático
              de inatividade já está rodando, mas uma mensagem pessoal (áudio de 30 segundos) costuma
              converter muito mais do que e-mail pra quem sumiu há mais de duas semanas.
            </p>
          </Panel>

          <Panel className="p-6">
            <div className="flex items-center gap-2 mb-3">
              <Megaphone size={17} className="text-brown-deep" />
              <h2 className="font-display text-lg text-brown-deep">Um funil simples de conteúdo</h2>
            </div>
            <p className="text-sm text-ink-soft leading-relaxed">
              Não precisa postar todo dia. Uma cadência sustentável: 1 post por semana mostrando o
              método (os 4 pilares SOMA, a bússola de posicionamento, o PDI gerado), 1 story por
              semana com bastidor real de encontro ou call, e usar a página pública de checkout como
              destino único de todo link que você compartilha. Consistência baixa e constante bate
              picos esporádicos de esforço alto.
            </p>
          </Panel>
        </div>
      </main>
    </div>
  );
}

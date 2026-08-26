'use client';

import { useRouter } from 'next/navigation';
import { Gift, Star, RotateCcw, Megaphone, Users2 } from 'lucide-react';
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
    <div>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6"><a href="/admin" className="inline-flex items-center gap-2 text-sm text-gray-text hover:text-black transition-colors">← Voltar ao painel</a></div>

        <p className="text-xs uppercase tracking-[0.2em] text-mint mb-2 bg-mint/10 px-3 py-1.5 rounded-md inline-flex items-center gap-2 border border-mint/20">Área administrativa</p>
        <h1 className="font-display text-3xl text-black mb-1">Boas práticas de crescimento</h1>
        <p className="text-sm text-gray-text mb-8">
          Um retrato de como as mentoradas atuais chegaram até você, e o que costuma funcionar pra
          trazer as próximas.
        </p>

        <div className="grid sm:grid-cols-3 gap-4 mb-10">
          <Panel className="p-5">
            <Users2 size={18} className="text-mint mb-2" />
            <p className="font-display text-2xl text-black">{percentualIndicacao}%</p>
            <p className="text-xs text-gray-text">
              das mentoradas vieram por indicação ({insights.viaIndicacao} de {insights.total})
            </p>
          </Panel>
          <Panel className="p-5">
            <Gift size={18} className="text-mint mb-2" />
            <p className="font-display text-2xl text-black">{percentualIndicadoras}%</p>
            <p className="text-xs text-gray-text">
              já indicaram pelo menos uma pessoa ({insights.jaIndicaramAlguem} de {insights.total})
            </p>
          </Panel>
          <Panel className="p-5">
            <RotateCcw size={18} className="text-amber-600 mb-2" />
            <p className="font-display text-2xl text-black">{insights.nuncaAcessaram}</p>
            <p className="text-xs text-gray-text">nunca acessaram o portal</p>
          </Panel>
        </div>

        <div className="flex flex-col gap-6">
          <Panel className="p-6">
            <div className="flex items-center gap-2 mb-3">
              <Gift size={17} className="text-black" />
              <h2 className="font-display text-lg text-black">Indicação é seu canal mais barato</h2>
            </div>
            <p className="text-sm text-gray-text leading-relaxed">
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
              <Star size={17} className="text-black" />
              <h2 className="font-display text-lg text-black">Prova social do que já existe no portal</h2>
            </div>
            <p className="text-sm text-gray-text leading-relaxed">
              Você já tem PDIs gerados, mapas de essência e planos de desenvolvimento reais. Com
              autorização da mentorada, um trecho anonimizado do diagnóstico ou do "antes e depois"
              do PDI vale mais como conteúdo do que qualquer texto genérico sobre mentoria de
              carreira. Publica no LinkedIn como bastidor do processo, não como resultado fechado.
            </p>
          </Panel>

          <Panel className="p-6">
            <div className="flex items-center gap-2 mb-3">
              <RotateCcw size={17} className="text-black" />
              <h2 className="font-display text-lg text-black">Reative antes de captar gente nova</h2>
            </div>
            <p className="text-sm text-gray-text leading-relaxed">
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
              <Megaphone size={17} className="text-black" />
              <h2 className="font-display text-lg text-black">Um funil simples de conteúdo</h2>
            </div>
            <p className="text-sm text-gray-text leading-relaxed">
              Não precisa postar todo dia. Uma cadência sustentável: 1 post por semana mostrando o
              método (os 4 pilares SOMA, a bússola de posicionamento, o PDI gerado), 1 story por
              semana com bastidor real de encontro ou call, e usar a página pública de checkout como
              destino único de todo link que você compartilha. Consistência baixa e constante bate
              picos esporádicos de esforço alto.
            </p>
          </Panel>
        </div>
      </div>
    </div>
  );
}

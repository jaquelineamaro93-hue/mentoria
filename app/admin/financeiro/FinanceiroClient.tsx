'use client';

import { useRouter } from 'next/navigation';
import { Wallet, TrendingUp, Users, AlertTriangle, Gift } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import { Panel, Eyebrow } from '@/components/Panel';
import { createClient } from '@/lib/supabase/client';
import { posthog, limparIdentidade } from '@/lib/posthog';
import type { Profile, PlanoMentoria } from '@/lib/types';

export default function FinanceiroClient({
  profile,
  mentorados,
  planos,
}: {
  profile: Profile;
  mentorados: Profile[];
  planos: PlanoMentoria[];
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

  const planoMap = new Map(planos.map((p) => [p.id, p]));

  function formatarMoeda(valor: number) {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  function valorContratado(mentorado: Profile) {
    const plano = mentorado.plano_id ? planoMap.get(mentorado.plano_id) : null;
    if (!plano) return 0;
    switch (mentorado.forma_pagamento_escolhida) {
      case 'cartao':
        return plano.preco_cartao;
      case 'recorrente':
        return plano.preco_recorrente_total;
      default:
        return plano.preco_avista;
    }
  }

  const ativos = mentorados.filter((m) => m.status_assinatura === 'ativo');
  const inadimplentes = mentorados.filter((m) => m.status_assinatura === 'inadimplente');
  const gratuitos = mentorados.filter((m) => {
    const plano = m.plano_id ? planoMap.get(m.plano_id) : null;
    return plano && plano.preco_avista === 0;
  });
  const pagantes = mentorados.filter((m) => !gratuitos.includes(m));

  const totalContratado = pagantes.reduce((soma, m) => soma + valorContratado(m), 0);
  const totalInadimplente = inadimplentes.reduce((soma, m) => soma + valorContratado(m), 0);

  const porPlano = new Map<string, { nome: string; quantidade: number; total: number }>();
  for (const m of mentorados) {
    if (!m.plano_id) continue;
    const plano = planoMap.get(m.plano_id);
    if (!plano) continue;
    const atual = porPlano.get(plano.id) ?? { nome: plano.nome, quantidade: 0, total: 0 };
    atual.quantidade++;
    atual.total += valorContratado(m);
    porPlano.set(plano.id, atual);
  }

  const proximasCobrancas = mentorados
    .filter((m) => m.proxima_cobranca)
    .sort((a, b) => (a.proxima_cobranca! < b.proxima_cobranca! ? -1 : 1))
    .slice(0, 8);

  return (
    <div className="flex flex-col md:flex-row w-full">
      <Sidebar profile={profile} onSignOut={handleSignOut} />

      <main className="flex-1 px-6 py-8 md:px-12 md:py-12 max-w-6xl mx-auto w-full">
        <p className="text-xs uppercase tracking-[0.2em] text-sky-deep mb-2">Área administrativa</p>
        <h1 className="font-display text-3xl text-brown-deep mb-1">Financeiro</h1>
        <p className="text-sm text-ink-faint mb-8">
          Visão geral de receita contratada, inadimplência e cortesias. Não substitui o extrato real
          do Mercado Pago, é uma leitura do que está cadastrado no portal.
        </p>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          <Panel className="p-5">
            <Wallet size={18} className="text-sky-deep mb-2" />
            <p className="font-display text-2xl text-brown-deep">{formatarMoeda(totalContratado)}</p>
            <p className="text-xs text-ink-faint">Valor total contratado (pagantes)</p>
          </Panel>
          <Panel className="p-5">
            <Users size={18} className="text-sky-deep mb-2" />
            <p className="font-display text-2xl text-brown-deep">{ativos.length}</p>
            <p className="text-xs text-ink-faint">Mentorados com acesso ativo</p>
          </Panel>
          <Panel className="p-5">
            <AlertTriangle size={18} className="text-amber-600 mb-2" />
            <p className="font-display text-2xl text-brown-deep">{inadimplentes.length}</p>
            <p className="text-xs text-ink-faint">
              Inadimplentes ({formatarMoeda(totalInadimplente)} em aberto)
            </p>
          </Panel>
          <Panel className="p-5">
            <Gift size={18} className="text-sky-deep mb-2" />
            <p className="font-display text-2xl text-brown-deep">{gratuitos.length}</p>
            <p className="text-xs text-ink-faint">Em cortesia/gratuito</p>
          </Panel>
        </div>

        <section className="mb-10">
          <Eyebrow>
            <TrendingUp size={13} /> Receita por plano
          </Eyebrow>
          <div className="overflow-x-auto rounded-xl border border-line">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-paper border-b border-line text-left">
                  <th className="px-4 py-3 font-medium text-ink-faint text-xs uppercase tracking-wide">
                    Plano
                  </th>
                  <th className="px-4 py-3 font-medium text-ink-faint text-xs uppercase tracking-wide text-center">
                    Mentorados
                  </th>
                  <th className="px-4 py-3 font-medium text-ink-faint text-xs uppercase tracking-wide">
                    Total contratado
                  </th>
                </tr>
              </thead>
              <tbody>
                {Array.from(porPlano.values()).map((linha) => (
                  <tr key={linha.nome} className="border-b border-line last:border-0 bg-cream">
                    <td className="px-4 py-3 text-ink">{linha.nome}</td>
                    <td className="px-4 py-3 text-center text-ink-soft">{linha.quantidade}</td>
                    <td className="px-4 py-3 text-brown-deep font-medium">
                      {formatarMoeda(linha.total)}
                    </td>
                  </tr>
                ))}
                {porPlano.size === 0 && (
                  <tr>
                    <td colSpan={3} className="px-4 py-6 text-center text-ink-faint text-sm">
                      Nenhum mentorado com plano atribuído ainda.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <Eyebrow>Próximas cobranças cadastradas</Eyebrow>
          <div className="overflow-x-auto rounded-xl border border-line">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-paper border-b border-line text-left">
                  <th className="px-4 py-3 font-medium text-ink-faint text-xs uppercase tracking-wide">
                    Nome
                  </th>
                  <th className="px-4 py-3 font-medium text-ink-faint text-xs uppercase tracking-wide">
                    Data
                  </th>
                  <th className="px-4 py-3 font-medium text-ink-faint text-xs uppercase tracking-wide">
                    Valor
                  </th>
                </tr>
              </thead>
              <tbody>
                {proximasCobrancas.map((m) => (
                  <tr key={m.id} className="border-b border-line last:border-0 bg-cream">
                    <td className="px-4 py-3 text-ink">{m.nome}</td>
                    <td className="px-4 py-3 text-ink-soft">
                      {new Date(m.proxima_cobranca!).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-4 py-3 text-brown-deep font-medium">
                      {formatarMoeda(valorContratado(m))}
                    </td>
                  </tr>
                ))}
                {proximasCobrancas.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-4 py-6 text-center text-ink-faint text-sm">
                      Nenhuma cobrança futura cadastrada.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}

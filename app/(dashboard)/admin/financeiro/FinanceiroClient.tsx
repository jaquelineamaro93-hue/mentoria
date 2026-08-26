'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Wallet, TrendingUp, Users, AlertTriangle, Gift, Target, Loader2, ArrowLeft } from 'lucide-react';
import { Panel, Eyebrow } from '@/components/Panel';
import { createClient } from '@/lib/supabase/client';
import { posthog, limparIdentidade } from '@/lib/posthog';
import type { Profile, PlanoMentoria } from '@/lib/types';

export default function FinanceiroClient({
  profile,
  mentorados,
  planos,
  despesasMensaisIniciais,
}: {
  profile: Profile;
  mentorados: Profile[];
  planos: PlanoMentoria[];
  despesasMensaisIniciais: number;
}) {
  const router = useRouter();
  const supabase = createClient();

  const [despesasMensais, setDespesasMensais] = useState(despesasMensaisIniciais);
  const [inputDespesas, setInputDespesas] = useState(String(despesasMensaisIniciais || ''));
  const [salvandoDespesas, setSalvandoDespesas] = useState(false);

  async function handleSignOut() {
    posthog.capture('logout_realizado');
    await supabase.auth.signOut();
    limparIdentidade();
    router.push('/login');
    router.refresh();
  }

  async function salvarDespesas() {
    const valor = Number(inputDespesas.replace(',', '.')) || 0;
    setSalvandoDespesas(true);
    try {
      const res = await fetch('/api/admin/configuracoes-financeiras', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ despesasMensais: valor }),
      });
      if (res.ok) setDespesasMensais(valor);
    } finally {
      setSalvandoDespesas(false);
    }
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

  function valorMensalEquivalente(mentorado: Profile) {
    const plano = mentorado.plano_id ? planoMap.get(mentorado.plano_id) : null;
    if (!plano || !plano.duracao_meses) return 0;
    return valorContratado(mentorado) / plano.duracao_meses;
  }

  const ativos = mentorados.filter((m) => m.status_assinatura === 'ativo');
  const inadimplentes = mentorados.filter((m) => m.status_assinatura === 'inadimplente');
  const gratuitos = mentorados.filter((m) => {
    const plano = m.plano_id ? planoMap.get(m.plano_id) : null;
    return plano && plano.preco_avista === 0;
  });
  const pagantesAtivos = ativos.filter((m) => !gratuitos.includes(m));

  // "Entrou" é uma estimativa: como os pagamentos atuais são controlados
  // manualmente (sem ledger de transações reais no banco), consideramos que
  // todo mentorado com status ativo já pagou o valor contratado do plano.
  const receitaRealizada = pagantesAtivos.reduce((soma, m) => soma + valorContratado(m), 0);
  const totalInadimplente = inadimplentes.reduce((soma, m) => soma + valorContratado(m), 0);
  const mrr = pagantesAtivos.reduce((soma, m) => soma + valorMensalEquivalente(m), 0);
  const ticketMedioMensal = pagantesAtivos.length > 0 ? mrr / pagantesAtivos.length : 0;

  const mentoradosNecessarios =
    ticketMedioMensal > 0 ? Math.ceil(despesasMensais / ticketMedioMensal) : null;
  const saldoMensal = mrr - despesasMensais;
  const margemMentorados =
    mentoradosNecessarios !== null ? pagantesAtivos.length - mentoradosNecessarios : null;

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

  const meses = [3, 6, 12];

  return (
    <>
      <div className="">
        <div className="mb-6"><a href="/admin" className="inline-flex items-center gap-2 text-sm text-gray-text hover:text-black transition-colors">← Voltar ao painel</a></div>

        <button
          onClick={() => router.push('/admin')}
          className="flex items-center gap-1.5 text-sm text-gray-text hover:text-black transition mb-4"
        >
          <ArrowLeft size={16} />
          Voltar
        </button>
        <p className="text-xs uppercase tracking-[0.2em] text-mint mb-2 bg-mint/10 px-3 py-1.5 rounded-md inline-flex items-center gap-2 border border-mint/20">Área administrativa</p>
        <h1 className="font-display text-3xl text-black mb-1">Financeiro</h1>
        <p className="text-sm text-gray-text mb-8">
          Como os pagamentos atuais são controlados manualmente (sem um extrato de transações no
          portal), os valores de receita aqui são uma estimativa baseada no plano e status de cada
          mentorado, não um extrato bancário. Para conferência exata, use o Mercado Pago.
        </p>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Panel className="p-5">
            <Wallet size={18} className="text-mint mb-2" />
            <p className="font-display text-2xl text-black">{formatarMoeda(receitaRealizada)}</p>
            <p className="text-xs text-gray-text">Já entrou (estimado, mentorados ativos pagantes)</p>
          </Panel>
          <Panel className="p-5">
            <TrendingUp size={18} className="text-mint mb-2" />
            <p className="font-display text-2xl text-black">{formatarMoeda(mrr)}</p>
            <p className="text-xs text-gray-text">Receita mensal recorrente equivalente (MRR)</p>
          </Panel>
          <Panel className="p-5">
            <AlertTriangle size={18} className="text-amber-600 mb-2" />
            <p className="font-display text-2xl text-black">{inadimplentes.length}</p>
            <p className="text-xs text-gray-text">
              Inadimplentes ({formatarMoeda(totalInadimplente)} em aberto)
            </p>
          </Panel>
          <Panel className="p-5">
            <Gift size={18} className="text-mint mb-2" />
            <p className="font-display text-2xl text-black">{gratuitos.length}</p>
            <p className="text-xs text-gray-text">Em cortesia/gratuito</p>
          </Panel>
        </div>

        <section className="mb-10">
          <Eyebrow>
            <Target size={13} /> Ponto de equilíbrio e fluxo de caixa
          </Eyebrow>
          <Panel className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-end gap-3 mb-6">
              <div className="flex-1">
                <label className="block text-xs font-medium text-black mb-1.5">
                  Suas despesas mensais fixas (estrutura, ferramentas, custo do seu tempo etc.)
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={inputDespesas}
                  onChange={(e) => setInputDespesas(e.target.value)}
                  placeholder="Ex: 3000"
                  className="w-full sm:w-56 px-3 py-2 border border-gray-faint rounded-lg text-sm"
                />
              </div>
              <button
                onClick={salvarDespesas}
                disabled={salvandoDespesas}
                className="flex items-center gap-2 bg-brown-deep hover:bg-brown text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors disabled:opacity-50"
              >
                {salvandoDespesas && <Loader2 size={14} className="animate-spin" />}
                Salvar despesas
              </button>
            </div>

            {despesasMensais > 0 ? (
              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-gray-text mb-1">Ticket médio mensal por mentorado</p>
                  <p className="font-display text-xl text-black">
                    {formatarMoeda(ticketMedioMensal)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-text mb-1">Mentorados pagantes necessários</p>
                  <p className="font-display text-xl text-black">
                    {mentoradosNecessarios} (você tem {pagantesAtivos.length})
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-text mb-1">Saldo mensal projetado</p>
                  <p
                    className={`font-display text-xl ${
                      saldoMensal >= 0 ? 'text-green-700' : 'text-red-600'
                    }`}
                  >
                    {formatarMoeda(saldoMensal)}
                  </p>
                </div>
                <div className="sm:col-span-3 text-sm text-gray-text border-t border-gray-faint pt-4">
                  {margemMentorados !== null && margemMentorados >= 0 ? (
                    <>
                      Você está <strong>{margemMentorados} mentorado(s) acima</strong> do ponto de
                      equilíbrio. Perder até essa quantidade de mentoradas pagantes ainda mantém o
                      caixa positivo neste ticket médio.
                    </>
                  ) : (
                    <>
                      Você está <strong>{Math.abs(margemMentorados ?? 0)} mentorado(s) abaixo</strong>{' '}
                      do ponto de equilíbrio neste ticket médio. Precisaria fechar mais{' '}
                      {Math.abs(margemMentorados ?? 0)} contrato(s) do mesmo porte pra cobrir as
                      despesas informadas.
                    </>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-text">
                Informa suas despesas mensais acima pra ver o cálculo de quantos mentorados pagantes
                você precisa manter pra ficar com o caixa positivo.
              </p>
            )}
          </Panel>
        </section>

        {despesasMensais > 0 && (
          <section className="mb-10">
            <Eyebrow>Projeção simples (mantendo a base atual, sem considerar crescimento ou cancelamento)</Eyebrow>
            <div className="overflow-x-auto rounded-xl border border-gray-faint">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-white border-b border-gray-faint text-left">
                    <th className="px-4 py-3 font-medium text-gray-text text-xs uppercase tracking-wide">
                      Período
                    </th>
                    <th className="px-4 py-3 font-medium text-gray-text text-xs uppercase tracking-wide">
                      Receita projetada
                    </th>
                    <th className="px-4 py-3 font-medium text-gray-text text-xs uppercase tracking-wide">
                      Despesas projetadas
                    </th>
                    <th className="px-4 py-3 font-medium text-gray-text text-xs uppercase tracking-wide">
                      Saldo acumulado
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {meses.map((m) => (
                    <tr key={m} className="border-b border-gray-faint last:border-0 bg-white">
                      <td className="px-4 py-3 text-black">{m} meses</td>
                      <td className="px-4 py-3 text-gray-text">{formatarMoeda(mrr * m)}</td>
                      <td className="px-4 py-3 text-gray-text">{formatarMoeda(despesasMensais * m)}</td>
                      <td
                        className={`px-4 py-3 font-medium ${
                          saldoMensal * m >= 0 ? 'text-green-700' : 'text-red-600'
                        }`}
                      >
                        {formatarMoeda(saldoMensal * m)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        <section className="mb-10">
          <Eyebrow>
            <TrendingUp size={13} /> Receita por plano
          </Eyebrow>
          <div className="overflow-x-auto rounded-xl border border-gray-faint">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-white border-b border-gray-faint text-left">
                  <th className="px-4 py-3 font-medium text-gray-text text-xs uppercase tracking-wide">
                    Plano
                  </th>
                  <th className="px-4 py-3 font-medium text-gray-text text-xs uppercase tracking-wide text-center">
                    Mentorados
                  </th>
                  <th className="px-4 py-3 font-medium text-gray-text text-xs uppercase tracking-wide">
                    Total contratado
                  </th>
                </tr>
              </thead>
              <tbody>
                {Array.from(porPlano.values()).map((linha) => (
                  <tr key={linha.nome} className="border-b border-gray-faint last:border-0 bg-white">
                    <td className="px-4 py-3 text-black">{linha.nome}</td>
                    <td className="px-4 py-3 text-center text-gray-text">{linha.quantidade}</td>
                    <td className="px-4 py-3 text-black font-medium">
                      {formatarMoeda(linha.total)}
                    </td>
                  </tr>
                ))}
                {porPlano.size === 0 && (
                  <tr>
                    <td colSpan={3} className="px-4 py-6 text-center text-gray-text text-sm">
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
          <div className="overflow-x-auto rounded-xl border border-gray-faint">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-white border-b border-gray-faint text-left">
                  <th className="px-4 py-3 font-medium text-gray-text text-xs uppercase tracking-wide">
                    Nome
                  </th>
                  <th className="px-4 py-3 font-medium text-gray-text text-xs uppercase tracking-wide">
                    Data
                  </th>
                  <th className="px-4 py-3 font-medium text-gray-text text-xs uppercase tracking-wide">
                    Valor
                  </th>
                </tr>
              </thead>
              <tbody>
                {proximasCobrancas.map((m) => (
                  <tr key={m.id} className="border-b border-gray-faint last:border-0 bg-white">
                    <td className="px-4 py-3 text-black">{m.nome}</td>
                    <td className="px-4 py-3 text-gray-text">
                      {new Date(m.proxima_cobranca!).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-4 py-3 text-black font-medium">
                      {formatarMoeda(valorContratado(m))}
                    </td>
                  </tr>
                ))}
                {proximasCobrancas.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-4 py-6 text-center text-gray-text text-sm">
                      Nenhuma cobrança futura cadastrada.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </>
  );
}

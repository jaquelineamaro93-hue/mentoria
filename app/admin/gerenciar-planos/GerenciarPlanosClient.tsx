'use client';

import { useState } from 'react';
import { Plus, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { posthog } from '@/lib/posthog';
import type { Profile, PlanoMentoria, TipoPacote } from '@/lib/types';

interface Edicao {
  plano_id?: string;
  tipo_pacote?: string;
  origem_assinatura?: string;
  status_pagamento?: string;
  forma_pagamento_escolhida?: string;
  data_fim_acesso?: string;
  proxima_cobranca?: string;
  observacao_pagamento?: string;
}

export default function GerenciarPlanosClient({
  mentorados: mentoradosIniciais,
  planos: planosIniciais,
}: {
  mentorados: Profile[];
  planos: PlanoMentoria[];
}) {
  const supabase = createClient();
  const [mentorados, setMentorados] = useState(mentoradosIniciais);
  const [planos, setPlanos] = useState(planosIniciais);
  const [edicao, setEdicao] = useState<Record<string, Edicao>>({});
  const [salvando, setSalvando] = useState<string | null>(null);
  const [mostrarFormPlano, setMostrarFormPlano] = useState(false);
  const [criandoPlano, setCriandoPlano] = useState(false);
  const [novoPlano, setNovoPlano] = useState({
    nome: '',
    duracaoMeses: '',
    precoAvista: '',
    precoCartao: '',
    precoRecorrenteTotal: '',
    visivelCheckout: false,
  });

  const planoMap = new Map(planos.map((p) => [p.id, p]));

  function formatarMoeda(valor: number | null | undefined) {
    if (valor === null || valor === undefined) return '—';
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  function valorContratado(mentorado: Profile, plano: PlanoMentoria | null | undefined, edicaoLinha?: Edicao) {
    if (!plano) return null;
    const forma = edicaoLinha?.forma_pagamento_escolhida ?? mentorado.forma_pagamento_escolhida;
    switch (forma) {
      case 'avista':
        return plano.preco_avista;
      case 'cartao':
        return plano.preco_cartao;
      case 'recorrente':
        return plano.preco_recorrente_total;
      default:
        return plano.preco_avista;
    }
  }

  async function handleCriarPlano() {
    if (!novoPlano.nome || !novoPlano.duracaoMeses || !novoPlano.precoAvista) {
      alert('Preenche nome, duração e preço à vista pelo menos.');
      return;
    }
    setCriandoPlano(true);
    try {
      const res = await fetch('/api/admin/criar-plano', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: novoPlano.nome,
          duracaoMeses: novoPlano.duracaoMeses,
          precoAvista: novoPlano.precoAvista,
          precoCartao: novoPlano.precoCartao,
          precoRecorrenteTotal: novoPlano.precoRecorrenteTotal,
          visivelCheckout: novoPlano.visivelCheckout,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.erro);
      setPlanos((prev) => [...prev, data.plano].sort((a, b) => a.duracao_meses - b.duracao_meses));
      posthog.capture('admin_plano_criado', { nome: novoPlano.nome });
      setNovoPlano({
        nome: '',
        duracaoMeses: '',
        precoAvista: '',
        precoCartao: '',
        precoRecorrenteTotal: '',
        visivelCheckout: false,
      });
      setMostrarFormPlano(false);
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Não consegui criar o plano.');
    }
    setCriandoPlano(false);
  }

  async function handleSalvar(mentoradoId: string) {
    if (!edicao[mentoradoId] || Object.keys(edicao[mentoradoId]).length === 0) return;

    setSalvando(mentoradoId);
    const changes = edicao[mentoradoId];

    try {
      const updateData: any = {};
      if (changes.plano_id) updateData.plano_id = changes.plano_id;
      if (changes.tipo_pacote) updateData.tipo_pacote = changes.tipo_pacote;
      if (changes.origem_assinatura) updateData.origem_assinatura = changes.origem_assinatura;
      if (changes.forma_pagamento_escolhida) updateData.forma_pagamento_escolhida = changes.forma_pagamento_escolhida;
      if (changes.data_fim_acesso !== undefined) {
        updateData.data_fim_acesso = changes.data_fim_acesso || null;
      }
      if (changes.proxima_cobranca !== undefined) {
        updateData.proxima_cobranca = changes.proxima_cobranca || null;
      }
      if (changes.observacao_pagamento !== undefined) {
        updateData.observacao_pagamento = changes.observacao_pagamento || null;
      }
      if (changes.status_pagamento) {
        updateData.status_pagamento = changes.status_pagamento;
        updateData.status_assinatura = changes.status_pagamento === 'ativo' ? 'ativo' : 'cancelado';
      }

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', mentoradoId);

      if (!error) {
        posthog.capture('admin_plano_atualizado', { mentoradoId, ...changes });
        setMentorados(
          mentorados.map((m) => {
            if (m.id !== mentoradoId) return m;
            return { ...m, ...updateData } as Profile;
          })
        );
        setEdicao((prev) => {
          const novo = { ...prev };
          delete novo[mentoradoId];
          return novo;
        });
      } else {
        alert('Erro ao salvar. Tenta de novo.');
      }
    } catch (e) {
      console.error(e);
      alert('Erro ao salvar.');
    }
    setSalvando(null);
  }

  function handleChange(mentoradoId: string, field: keyof Edicao, value: string) {
    setEdicao((prev) => ({
      ...prev,
      [mentoradoId]: { ...prev[mentoradoId], [field]: value },
    }));
  }

  return (
    
      <div className="mb-6">
        <a href="/admin" className="inline-flex items-center gap-2 text-sm text-ink-faint hover:text-brown-deep transition-colors"> ← Voltar ao painel
        </a>
      </div>
<main className="px-6 py-8 md:px-12 md:py-12 max-w-7xl mx-auto w-full">
      <Link
        href="/admin"
        className="inline-flex items-center gap-1.5 text-sm text-ink-soft hover:text-brown-deep transition mb-4"
      >
        <ArrowLeft size={16} />
        Voltar
      </Link>
      <div className="flex items-start justify-between gap-4 mb-1">
        <h1 className="font-display text-3xl text-brown-deep">Gerenciar Planos e Pagamentos</h1>
        <button
          onClick={() => setMostrarFormPlano((v) => !v)}
          className="flex items-center gap-1.5 text-sm text-brown-deep border border-brown-deep px-3 py-1.5 rounded-lg hover:bg-brown-deep/10 transition-colors whitespace-nowrap"
        >
          <Plus size={14} /> Criar novo plano
        </button>
      </div>
      <p className="text-sm text-ink-faint mb-6">
        Troque o plano, tipo, origem, forma de pagamento, data de fim de acesso e status de cada
        mentorado. O valor mostrado é calculado a partir do plano + forma de pagamento escolhida.
      </p>

      {mostrarFormPlano && (
        <div className="border border-line rounded-xl p-5 mb-8 bg-cream/50">
          <p className="text-sm font-medium text-brown-deep mb-3">Novo plano</p>
          <div className="grid sm:grid-cols-5 gap-3 mb-3">
            <input
              placeholder="Nome (ex: Cortesia)"
              value={novoPlano.nome}
              onChange={(e) => setNovoPlano({ ...novoPlano, nome: e.target.value })}
              className="text-sm border border-line rounded px-3 py-2 sm:col-span-2"
            />
            <input
              placeholder="Duração (meses)"
              type="number"
              value={novoPlano.duracaoMeses}
              onChange={(e) => setNovoPlano({ ...novoPlano, duracaoMeses: e.target.value })}
              className="text-sm border border-line rounded px-3 py-2"
            />
            <input
              placeholder="Preço à vista"
              type="number"
              value={novoPlano.precoAvista}
              onChange={(e) => setNovoPlano({ ...novoPlano, precoAvista: e.target.value })}
              className="text-sm border border-line rounded px-3 py-2"
            />
            <input
              placeholder="Preço cartão (opcional)"
              type="number"
              value={novoPlano.precoCartao}
              onChange={(e) => setNovoPlano({ ...novoPlano, precoCartao: e.target.value })}
              className="text-sm border border-line rounded px-3 py-2"
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-ink-soft mb-4">
            <input
              type="checkbox"
              checked={novoPlano.visivelCheckout}
              onChange={(e) => setNovoPlano({ ...novoPlano, visivelCheckout: e.target.checked })}
            />
            Mostrar esse plano na página pública de checkout
          </label>
          <p className="text-xs text-ink-faint mb-4 -mt-2">
            Desmarcado (padrão): o plano fica disponível só aqui, pra você atribuir manualmente.
            Marcado: qualquer visitante pode escolher e comprar esse plano em /checkout.
          </p>
          <button
            onClick={handleCriarPlano}
            disabled={criandoPlano}
            className="bg-brown-deep text-white text-sm px-4 py-2 rounded-lg hover:bg-brown disabled:opacity-50"
          >
            {criandoPlano ? 'Criando...' : 'Salvar plano'}
          </button>
        </div>
      )}

      <div className="overflow-x-auto border border-line rounded-2xl">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b-2 border-line bg-cream">
              <th className="text-left py-3 px-4 font-medium text-brown-deep">Nome</th>
              <th className="text-left py-3 px-4 font-medium text-brown-deep">Plano</th>
              <th className="text-left py-3 px-4 font-medium text-brown-deep">Tipo</th>
              <th className="text-left py-3 px-4 font-medium text-brown-deep">Origem</th>
              <th className="text-left py-3 px-4 font-medium text-brown-deep">Forma pgto.</th>
              <th className="text-left py-3 px-4 font-medium text-brown-deep">Valor</th>
              <th className="text-left py-3 px-4 font-medium text-brown-deep">Status</th>
              <th className="text-left py-3 px-4 font-medium text-brown-deep">Próx. cobrança</th>
              <th className="text-left py-3 px-4 font-medium text-brown-deep">Acesso até</th>
              <th className="text-left py-3 px-4 font-medium text-brown-deep">Observação</th>
              <th className="text-left py-3 px-4 font-medium text-brown-deep">Ação</th>
            </tr>
          </thead>
          <tbody>
            {mentorados.map((mentorado) => {
              const emEdicao = edicao[mentorado.id];
              const planoAtualId = emEdicao?.plano_id || mentorado.plano_id;
              const planoAtual = planoAtualId ? planoMap.get(planoAtualId) : null;
              const temMudancas = emEdicao && Object.keys(emEdicao).length > 0;

              return (
                <tr key={mentorado.id} className="border-b border-line hover:bg-cream/50">
                  <td className="py-3 px-4 text-brown-deep font-medium whitespace-nowrap">{mentorado.nome}</td>
                  <td className="py-3 px-4">
                    <select
                      value={emEdicao?.plano_id || mentorado.plano_id || ''}
                      onChange={(e) => handleChange(mentorado.id, 'plano_id', e.target.value)}
                      className="text-xs border border-line rounded px-2 py-1 w-44"
                    >
                      <option value="">Selecionar...</option>
                      {planos.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.nome} ({p.duracao_meses}m)
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="py-3 px-4">
                    <select
                      value={emEdicao?.tipo_pacote || mentorado.tipo_pacote || 'online'}
                      onChange={(e) => handleChange(mentorado.id, 'tipo_pacote', e.target.value)}
                      className="text-xs border border-line rounded px-2 py-1 w-28"
                    >
                      <option value="online">Online</option>
                      <option value="presencial">Presencial</option>
                    </select>
                  </td>
                  <td className="py-3 px-4">
                    <select
                      value={emEdicao?.origem_assinatura || mentorado.origem_assinatura || 'manual'}
                      onChange={(e) => handleChange(mentorado.id, 'origem_assinatura', e.target.value)}
                      className="text-xs border border-line rounded px-2 py-1 w-32"
                    >
                      <option value="manual">Manual</option>
                      <option value="mercadopago">Mercado Pago</option>
                    </select>
                  </td>
                  <td className="py-3 px-4">
                    <select
                      value={emEdicao?.forma_pagamento_escolhida ?? mentorado.forma_pagamento_escolhida ?? ''}
                      onChange={(e) => handleChange(mentorado.id, 'forma_pagamento_escolhida', e.target.value)}
                      className="text-xs border border-line rounded px-2 py-1 w-28"
                    >
                      <option value="">—</option>
                      <option value="avista">À vista</option>
                      <option value="cartao">Cartão</option>
                      <option value="recorrente">Recorrente</option>
                    </select>
                  </td>
                  <td className="py-3 px-4 text-ink-soft whitespace-nowrap">
                    {formatarMoeda(valorContratado(mentorado, planoAtual, emEdicao))}
                  </td>
                  <td className="py-3 px-4">
                    <select
                      value={emEdicao?.status_pagamento || mentorado.status_assinatura || 'ativo'}
                      onChange={(e) => handleChange(mentorado.id, 'status_pagamento', e.target.value)}
                      className="text-xs border border-line rounded px-2 py-1 w-28"
                    >
                      <option value="ativo">Ativo</option>
                      <option value="inadimplente">Inadimplente</option>
                    </select>
                  </td>
                  <td className="py-3 px-4">
                    <input
                      type="date"
                      value={emEdicao?.proxima_cobranca ?? mentorado.proxima_cobranca ?? ''}
                      onChange={(e) => handleChange(mentorado.id, 'proxima_cobranca', e.target.value)}
                      className="text-xs border border-line rounded px-2 py-1 w-36"
                    />
                  </td>
                  <td className="py-3 px-4">
                    <input
                      type="date"
                      value={emEdicao?.data_fim_acesso ?? mentorado.data_fim_acesso ?? ''}
                      onChange={(e) => handleChange(mentorado.id, 'data_fim_acesso', e.target.value)}
                      className="text-xs border border-line rounded px-2 py-1 w-36"
                    />
                  </td>
                  <td className="py-3 px-4">
                    <input
                      type="text"
                      value={emEdicao?.observacao_pagamento ?? mentorado.observacao_pagamento ?? ''}
                      onChange={(e) => handleChange(mentorado.id, 'observacao_pagamento', e.target.value)}
                      placeholder="Nota opcional..."
                      className="text-xs border border-line rounded px-2 py-1 w-36"
                    />
                  </td>
                  <td className="py-3 px-4">
                    {temMudancas ? (
                      <button
                        onClick={() => handleSalvar(mentorado.id)}
                        disabled={salvando === mentorado.id}
                        className="bg-green-600 text-white text-xs px-3 py-1.5 rounded hover:bg-green-700 disabled:opacity-50 font-medium whitespace-nowrap"
                      >
                        {salvando === mentorado.id ? 'Salvando...' : 'Salvar'}
                      </button>
                    ) : (
                      <span className="text-xs text-ink-faint">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {mentorados.length === 0 && (
        <p className="text-sm text-ink-faint text-center py-8">Nenhum mentorado cadastrado ainda.</p>
      )}
    </main>
  );
}

'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { posthog } from '@/lib/posthog';
import type { Profile, PlanoMentoria } from '@/lib/types';

interface MentoradoComEdicao extends Profile {
  plano?: { nome: string; duracao_meses: number } | null;
}

export default function GerenciarPlanosClient({
  mentorados: mentoradosIniciais,
  planos,
}: {
  mentorados: Profile[];
  planos: PlanoMentoria[];
}) {
  const supabase = createClient();
  const [mentorados, setMentorados] = useState(mentoradosIniciais);
  const [edicao, setEdicao] = useState<Record<string, { plano_id?: string; tipo_pacote?: string; origem_assinatura?: string; status_pagamento?: string }>>({});
  const [salvando, setSalvando] = useState<string | null>(null);

  const planoMap = new Map(planos.map((p) => [p.id, p]));

  async function handleSalvar(mentoradoId: string) {
    if (!edicao[mentoradoId] || Object.keys(edicao[mentoradoId]).length === 0) return;

    setSalvando(mentoradoId);
    const changes = edicao[mentoradoId];

    try {
      const updateData: any = {};
      if (changes.plano_id) updateData.plano_id = changes.plano_id;
      if (changes.tipo_pacote) updateData.tipo_pacote = changes.tipo_pacote;
      if (changes.origem_assinatura) updateData.origem_assinatura = changes.origem_assinatura;
      if (changes.status_pagamento) {
        updateData.status_pagamento = changes.status_pagamento;
        updateData.status_assinatura = changes.status_pagamento === 'ativo' ? 'ativo' : 'cancelado';
        if (changes.status_pagamento === 'ativo') {
          updateData.data_fim_acesso = null;
        }
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
            const updated: any = { ...m };
            if (changes.plano_id) updated.plano_id = changes.plano_id;
            if (changes.tipo_pacote) updated.tipo_pacote = changes.tipo_pacote as 'online' | 'presencial';
            if (changes.origem_assinatura) updated.origem_assinatura = changes.origem_assinatura as 'manual' | 'mercadopago';
            if (changes.status_pagamento) updated.status_pagamento = changes.status_pagamento;
            return updated;
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

  function handleChange(mentoradoId: string, field: string, value: string) {
    setEdicao((prev) => ({
      ...prev,
      [mentoradoId]: { ...prev[mentoradoId], [field]: value },
    }));
  }

  return (
    <main className="px-6 py-8 md:px-12 md:py-12 max-w-7xl mx-auto w-full">
      <h1 className="font-display text-3xl text-brown-deep mb-1">Gerenciar Planos</h1>
      <p className="text-sm text-ink-faint mb-8">
        Aqui você pode trocar o plano, tipo (Online/Presencial), origem (Manual/Mercado Pago) e status de cada mentorado.
      </p>

      <div className="overflow-x-auto border border-line rounded-2xl">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b-2 border-line bg-cream">
              <th className="text-left py-3 px-4 font-medium text-brown-deep">Nome</th>
              <th className="text-left py-3 px-4 font-medium text-brown-deep">Plano</th>
              <th className="text-left py-3 px-4 font-medium text-brown-deep">Tipo</th>
              <th className="text-left py-3 px-4 font-medium text-brown-deep">Origem</th>
              <th className="text-left py-3 px-4 font-medium text-brown-deep">Status</th>
              <th className="text-left py-3 px-4 font-medium text-brown-deep">Ação</th>
            </tr>
          </thead>
          <tbody>
            {mentorados.map((mentorado) => {
              const planoAtual = mentorado.plano_id ? planoMap.get(mentorado.plano_id) : null;
              const emEdicao = edicao[mentorado.id];
              const temMudancas = emEdicao && Object.keys(emEdicao).length > 0;

              return (
                <tr key={mentorado.id} className="border-b border-line hover:bg-cream/50">
                  <td className="py-3 px-4 text-brown-deep font-medium">{mentorado.nome}</td>
                  <td className="py-3 px-4">
                    <select
                      value={emEdicao?.plano_id || mentorado.plano_id || ''}
                      onChange={(e) => handleChange(mentorado.id, 'plano_id', e.target.value)}
                      className="text-xs border border-line rounded px-2 py-1 w-40"
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
                      value={emEdicao?.status_pagamento || mentorado.status_assinatura || 'ativo'}
                      onChange={(e) => handleChange(mentorado.id, 'status_pagamento', e.target.value)}
                      className="text-xs border border-line rounded px-2 py-1 w-28"
                    >
                      <option value="ativo">Ativo</option>
                      <option value="inadimplente">Inadimplente</option>
                    </select>
                  </td>
                  <td className="py-3 px-4">
                    {temMudancas ? (
                      <button
                        onClick={() => handleSalvar(mentorado.id)}
                        disabled={salvando === mentorado.id}
                        className="bg-green-600 text-white text-xs px-3 py-1.5 rounded hover:bg-green-700 disabled:opacity-50 font-medium"
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

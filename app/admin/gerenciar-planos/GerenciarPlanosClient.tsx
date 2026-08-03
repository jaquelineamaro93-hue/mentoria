'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { posthog } from '@/lib/posthog';
import { Check, X, Save } from 'lucide-react';
import type { Profile, PlanoMentoria } from '@/lib/types';

interface MentoradoComPlano extends Profile {
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
  const [edicao, setEdicao] = useState<Record<string, { plano_id: string; status: string }>>({});
  const [salvando, setSalvando] = useState<string | null>(null);

  async function handleSalvar(mentoradoId: string) {
    if (!edicao[mentoradoId]) return;

    setSalvando(mentoradoId);
    const { plano_id, status } = edicao[mentoradoId];

    try {
      const updateData: any = {};
      if (plano_id) updateData.plano_id = plano_id;

      if (status === 'ativo') {
        updateData.status_assinatura = 'ativo';
        updateData.data_fim_acesso = null;
      } else if (status === 'inadimplente') {
        updateData.status_assinatura = 'inadimplente';
      }

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', mentoradoId);

      if (!error) {
        posthog.capture('admin_plano_atualizado', { mentoradoId, plano_id, status });
        setMentorados(
          mentorados.map((m) =>
            m.id === mentoradoId
              ? { ...m, plano_id, status_assinatura: status === 'ativo' ? 'ativo' : 'inadimplente' }
              : m
          )
        );
        setEdicao((prev) => {
          const novo = { ...prev };
          delete novo[mentoradoId];
          return novo;
        });
      }
    } catch (e) {
      console.error(e);
    }
    setSalvando(null);
  }

  const planoMap = new Map(planos.map((p) => [p.id, p]));

  return (
    <main className="px-6 py-8 md:px-12 md:py-12 max-w-7xl mx-auto w-full">
      <h1 className="font-display text-3xl text-brown-deep mb-1">Gerenciar Planos</h1>
      <p className="text-sm text-ink-faint mb-8">
        Aqui você pode trocar o plano e pagamento de cada mentorado. Salve após fazer as alterações.
      </p>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b-2 border-line">
              <th className="text-left py-3 px-4 font-medium text-brown-deep">Nome</th>
              <th className="text-left py-3 px-4 font-medium text-brown-deep">Email</th>
              <th className="text-left py-3 px-4 font-medium text-brown-deep">Plano Atual</th>
              <th className="text-left py-3 px-4 font-medium text-brown-deep">Novo Plano</th>
              <th className="text-left py-3 px-4 font-medium text-brown-deep">Status</th>
              <th className="text-left py-3 px-4 font-medium text-brown-deep">Ação</th>
            </tr>
          </thead>
          <tbody>
            {mentorados.map((mentorado) => {
              const planoAtual = mentorado.plano_id ? planoMap.get(mentorado.plano_id) : null;
              const emEdicao = edicao[mentorado.id];

              return (
                <tr key={mentorado.id} className="border-b border-line hover:bg-cream transition-colors">
                  <td className="py-3 px-4 text-brown-deep">{mentorado.nome}</td>
                  <td className="py-3 px-4 text-ink-faint text-xs">{mentorado.email}</td>
                  <td className="py-3 px-4 text-sm">
                    {planoAtual ? `${planoAtual.nome} (${planoAtual.duracao_meses}m)` : '—'}
                  </td>
                  <td className="py-3 px-4">
                    <select
                      value={emEdicao?.plano_id || mentorado.plano_id || ''}
                      onChange={(e) =>
                        setEdicao((prev) => ({
                          ...prev,
                          [mentorado.id]: { ...prev[mentorado.id], plano_id: e.target.value },
                        }))
                      }
                      className="text-xs border border-line rounded px-2 py-1"
                    >
                      <option value="">Selecionar plano...</option>
                      {planos.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.nome} ({p.duracao_meses}m)
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="py-3 px-4">
                    <select
                      value={emEdicao?.status || mentorado.status_assinatura || 'ativo'}
                      onChange={(e) =>
                        setEdicao((prev) => ({
                          ...prev,
                          [mentorado.id]: { ...prev[mentorado.id], status: e.target.value },
                        }))
                      }
                      className="text-xs border border-line rounded px-2 py-1"
                    >
                      <option value="ativo">Ativo</option>
                      <option value="inadimplente">Inadimplente</option>
                    </select>
                  </td>
                  <td className="py-3 px-4">
                    {emEdicao ? (
                      <button
                        onClick={() => handleSalvar(mentorado.id)}
                        disabled={salvando === mentorado.id}
                        className="flex items-center gap-1 bg-green-600 text-white text-xs px-2 py-1 rounded hover:bg-green-700 disabled:opacity-50"
                      >
                        <Save size={13} />
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

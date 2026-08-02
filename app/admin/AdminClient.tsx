'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ExternalLink, Users, Activity, Clock, Loader2, Check, LogIn } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import { Panel, Eyebrow } from '@/components/Panel';
import { createClient } from '@/lib/supabase/client';
import { posthog, limparIdentidade } from '@/lib/posthog';
import type { Profile } from '@/lib/types';
import type { LinhaMentorado } from './page';

interface Props {
  profile: Profile;
  linhas: LinhaMentorado[];
  totalBlocosQuemSouEu: number;
  totalSecoesPdi: number;
}

const POSTHOG_URL = 'https://us.posthog.com';

export default function AdminClient({
  profile,
  linhas: linhasIniciais,
  totalBlocosQuemSouEu,
  totalSecoesPdi,
}: Props) {
  const router = useRouter();
  const supabase = createClient();
  const [linhas, setLinhas] = useState(linhasIniciais);
  const [salvandoId, setSalvandoId] = useState<string | null>(null);
  const [entrandoComoId, setEntrandoComoId] = useState<string | null>(null);

  async function entrarComoUsuario(userId: string, nome: string) {
    const confirmado = window.confirm(
      `Você vai sair da sua conta admin e entrar como ${nome}. Sua sessão de admin vai ser substituída, pra voltar a ser você mesma, saia e faça login de novo com seu e-mail. Confirma?`
    );
    if (!confirmado) return;

    setEntrandoComoId(userId);

    try {
      const res = await fetch('/api/admin/gerar-link-impersonacao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      const { error } = await supabase.auth.verifyOtp({
        email: data.email,
        token_hash: data.tokenHash,
        type: 'magiclink',
      });

      if (error) throw error;

      posthog.capture('admin_entrou_como_usuario', { usuario_alvo: userId });
      router.push('/dashboard');
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Não foi possível entrar como esse usuário.');
      setEntrandoComoId(null);
    }
  }

  async function handleSignOut() {
    posthog.capture('logout_realizado');
    await supabase.auth.signOut();
    limparIdentidade();
    router.push('/login');
    router.refresh();
  }

  async function atualizarPagamento(
    userId: string,
    campo: 'status_assinatura' | 'proxima_cobranca' | 'observacao_pagamento',
    valor: string
  ) {
    setLinhas((prev) =>
      prev.map((l) =>
        l.profile.id === userId ? { ...l, profile: { ...l.profile, [campo]: valor } } : l
      )
    );
  }

  async function salvarPagamento(userId: string) {
    const linha = linhas.find((l) => l.profile.id === userId);
    if (!linha) return;

    setSalvandoId(userId);
    await supabase
      .from('profiles')
      .update({
        status_assinatura: linha.profile.status_assinatura,
        proxima_cobranca: linha.profile.proxima_cobranca || null,
        observacao_pagamento: linha.profile.observacao_pagamento || null,
      })
      .eq('id', userId);
    setSalvandoId(null);
    posthog.capture('status_assinatura_atualizado', { status: linha.profile.status_assinatura });
  }

  const total = linhas.length;
  const ativos7dias = linhas.filter((l) => {
    if (!l.profile.last_login_at) return false;
    const dias = (Date.now() - new Date(l.profile.last_login_at).getTime()) / 86400000;
    return dias <= 7;
  }).length;
  const semAcessoNunca = linhas.filter((l) => !l.profile.last_login_at).length;

  return (
    <div className="flex flex-col md:flex-row w-full">
      <Sidebar profile={profile} onSignOut={handleSignOut} />

      <main className="flex-1 px-6 py-8 md:px-12 md:py-12 max-w-7xl mx-auto w-full">
        <p className="text-xs uppercase tracking-[0.2em] text-sky-deep mb-2">
          Área administrativa
        </p>
        <h1 className="font-display text-3xl text-brown-deep mb-1">
          Painel dos mentorados
        </h1>
        <p className="text-sm text-ink-faint mb-8">
          Visão geral de quem está usando o quê. Para dados de sessão, tempo médio de
          acesso e localização, consulte o PostHog.
        </p>

        <div className="grid sm:grid-cols-3 gap-4 mb-10">
          <Panel className="p-5">
            <Users size={18} className="text-sky-deep mb-2" />
            <p className="font-display text-2xl text-brown-deep">{total}</p>
            <p className="text-xs text-ink-faint">Mentorados cadastrados</p>
          </Panel>
          <Panel className="p-5">
            <Activity size={18} className="text-sky-deep mb-2" />
            <p className="font-display text-2xl text-brown-deep">{ativos7dias}</p>
            <p className="text-xs text-ink-faint">Ativos nos últimos 7 dias</p>
          </Panel>
          <Panel className="p-5">
            <Clock size={18} className="text-sky-deep mb-2" />
            <p className="font-display text-2xl text-brown-deep">{semAcessoNunca}</p>
            <p className="text-xs text-ink-faint">Nunca acessaram</p>
          </Panel>
        </div>

        <section className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <Eyebrow>Atividade por mentorado</Eyebrow>
            <a
              href={POSTHOG_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs text-sky-deep hover:text-brown-deep transition-colors"
            >
              Ver sessões e localização no PostHog <ExternalLink size={12} />
            </a>
          </div>

          <div className="overflow-x-auto rounded-xl border border-line">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-paper border-b border-line text-left">
                  <th className="px-4 py-3 font-medium text-ink-faint text-xs uppercase tracking-wide">
                    Nome
                  </th>
                  <th className="px-4 py-3 font-medium text-ink-faint text-xs uppercase tracking-wide">
                    Pacote
                  </th>
                  <th className="px-4 py-3 font-medium text-ink-faint text-xs uppercase tracking-wide">
                    Último acesso
                  </th>
                  <th className="px-4 py-3 font-medium text-ink-faint text-xs uppercase tracking-wide">
                    Onboarding
                  </th>
                  <th className="px-4 py-3 font-medium text-ink-faint text-xs uppercase tracking-wide text-center">
                    Diagnósticos
                  </th>
                  <th className="px-4 py-3 font-medium text-ink-faint text-xs uppercase tracking-wide text-center">
                    Diário
                  </th>
                  <th className="px-4 py-3 font-medium text-ink-faint text-xs uppercase tracking-wide text-center">
                    Quem Sou Eu
                  </th>
                  <th className="px-4 py-3 font-medium text-ink-faint text-xs uppercase tracking-wide text-center">
                    PDI
                  </th>
                  <th className="px-4 py-3 font-medium text-ink-faint text-xs uppercase tracking-wide text-center">
                    VIA
                  </th>
                  <th className="px-4 py-3 font-medium text-ink-faint text-xs uppercase tracking-wide text-center">
                    Pontos
                  </th>
                  <th className="px-4 py-3 font-medium text-ink-faint text-xs uppercase tracking-wide" />
                </tr>
              </thead>
              <tbody>
                {linhas.map((l) => (
                  <tr key={l.profile.id} className="border-b border-line last:border-0 bg-cream">
                    <td className="px-4 py-3">
                      <p className="text-ink">{l.profile.nome}</p>
                      <p className="text-xs text-ink-faint">{l.profile.email}</p>
                    </td>
                    <td className="px-4 py-3 text-ink-soft capitalize">
                      {l.profile.tipo_pacote}
                    </td>
                    <td className="px-4 py-3 text-ink-soft">
                      {l.profile.last_login_at
                        ? new Date(l.profile.last_login_at).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : 'Nunca'}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full ${
                          l.profile.onboarding_concluido
                            ? 'bg-green-50 text-green-700 border border-green-300'
                            : 'bg-amber-50 text-amber-700 border border-amber-300'
                        }`}
                      >
                        {l.profile.onboarding_concluido ? 'Feito' : 'Pendente'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-ink-soft">
                      {l.diagnosticos}
                    </td>
                    <td className="px-4 py-3 text-center text-ink-soft">
                      {l.anotacoesDiario}
                    </td>
                    <td className="px-4 py-3 text-center text-ink-soft">
                      {l.blocosQuemSouEu}/{totalBlocosQuemSouEu}
                    </td>
                    <td className="px-4 py-3 text-center text-ink-soft">
                      {l.secoesPdi}/{totalSecoesPdi || '-'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {l.fezVia ? (
                        <span className="text-sky-deep">✓</span>
                      ) : (
                        <span className="text-ink-faint">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center text-brown-deep font-medium">
                      {l.profile.pontos_total}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => entrarComoUsuario(l.profile.id, l.profile.nome)}
                        disabled={entrandoComoId === l.profile.id}
                        className="flex items-center gap-1.5 text-xs text-sky-deep hover:text-brown-deep transition-colors whitespace-nowrap disabled:opacity-60"
                      >
                        {entrandoComoId === l.profile.id ? (
                          <Loader2 size={12} className="animate-spin" />
                        ) : (
                          <LogIn size={12} />
                        )}
                        Entrar como
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <Eyebrow>Status de assinatura</Eyebrow>
          <p className="text-xs text-ink-faint mb-4">
            Alunos atuais entraram como "manual" (já pagaram fora do sistema). Novos
            cadastros entram automaticamente como "mercadopago", e o status muda sozinho
            conforme os pagamentos chegam. Quando o status vira "encerrado", a pessoa é
            redirecionada para a tela de renovação em qualquer acesso.
          </p>
          <div className="overflow-x-auto rounded-xl border border-line">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-paper border-b border-line text-left">
                  <th className="px-4 py-3 font-medium text-ink-faint text-xs uppercase tracking-wide">
                    Nome
                  </th>
                  <th className="px-4 py-3 font-medium text-ink-faint text-xs uppercase tracking-wide">
                    Origem
                  </th>
                  <th className="px-4 py-3 font-medium text-ink-faint text-xs uppercase tracking-wide">
                    Status
                  </th>
                  <th className="px-4 py-3 font-medium text-ink-faint text-xs uppercase tracking-wide">
                    Próxima cobrança
                  </th>
                  <th className="px-4 py-3 font-medium text-ink-faint text-xs uppercase tracking-wide">
                    Observação
                  </th>
                  <th className="px-4 py-3 font-medium text-ink-faint text-xs uppercase tracking-wide" />
                </tr>
              </thead>
              <tbody>
                {linhas.map((l) => (
                  <tr key={l.profile.id} className="border-b border-line last:border-0 bg-cream">
                    <td className="px-4 py-3 text-ink">{l.profile.nome}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full ${
                          l.profile.origem_assinatura === 'manual'
                            ? 'bg-[#f1e6d6] text-brown border border-brown/30'
                            : 'bg-sky-tint text-sky-deep border border-sky'
                        }`}
                      >
                        {l.profile.origem_assinatura === 'manual' ? 'Manual' : 'Mercado Pago'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={l.profile.status_assinatura}
                        onChange={(e) =>
                          atualizarPagamento(l.profile.id, 'status_assinatura', e.target.value)
                        }
                        className="bg-paper border border-line rounded-md px-2.5 py-1.5 text-sm text-ink"
                      >
                        <option value="ativo">Ativo</option>
                        <option value="inadimplente">Inadimplente</option>
                        <option value="encerrado">Encerrado</option>
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="date"
                        value={l.profile.proxima_cobranca ?? ''}
                        onChange={(e) =>
                          atualizarPagamento(l.profile.id, 'proxima_cobranca', e.target.value)
                        }
                        className="bg-paper border border-line rounded-md px-2.5 py-1.5 text-sm text-ink"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        value={l.profile.observacao_pagamento ?? ''}
                        onChange={(e) =>
                          atualizarPagamento(l.profile.id, 'observacao_pagamento', e.target.value)
                        }
                        placeholder="Nota opcional..."
                        className="bg-paper border border-line rounded-md px-2.5 py-1.5 text-sm text-ink w-40"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => salvarPagamento(l.profile.id)}
                        disabled={salvandoId === l.profile.id}
                        className="flex items-center gap-1.5 text-xs bg-brown hover:bg-brown-deep text-paper px-3 py-1.5 rounded-full transition-colors disabled:opacity-60"
                      >
                        {salvandoId === l.profile.id ? (
                          <Loader2 size={12} className="animate-spin" />
                        ) : (
                          <Check size={12} />
                        )}
                        Salvar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}

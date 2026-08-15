'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ExternalLink, Users, Activity, Clock, Loader2, Check, LogIn, Key, Trash2, CreditCard, Send, Wallet, Rocket, MailWarning, Shield, Lock } from 'lucide-react';
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
  const [entrandoComoId, setEntrandoComoId] = useState<string | null>(null);
  const [resetandoId, setResetandoId] = useState<string | null>(null);
  const [deletandoId, setDeletandoId] = useState<string | null>(null);
  const [confirmandoId, setConfirmandoId] = useState<string | null>(null);
  const [enviandoLembretes, setEnviandoLembretes] = useState(false);
  const [resultadoLembretes, setResultadoLembretes] = useState<string | null>(null);
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [usuariosCarregando, setUsuariosCarregando] = useState(false);
  const [usuarioTogglingId, setUsuarioTogglingId] = useState<string | null>(null);
  const [filtroUsuarios, setFiltroUsuarios] = useState<'todos' | 'admin' | 'geral'>('todos');
  const [buscaUsuario, setBuscaUsuario] = useState('');

  async function confirmarEmailUsuario(userId: string, nome: string) {
    setConfirmandoId(userId);
    try {
      const res = await fetch('/api/admin/confirmar-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.erro);

      setLinhas((prev) =>
        prev.map((l) => (l.profile.id === userId ? { ...l, emailConfirmado: true } : l))
      );
      posthog.capture('admin_confirmou_email', { usuario_alvo: userId });
    } catch (err) {
      alert(
        err instanceof Error
          ? err.message
          : `Não consegui confirmar o e-mail de ${nome}.`
      );
    } finally {
      setConfirmandoId(null);
    }
  }

  async function enviarLembretesAgora() {
    setEnviandoLembretes(true);
    setResultadoLembretes(null);
    try {
      const res = await fetch('/api/admin/enviar-lembretes', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.erro ?? 'Erro ao enviar lembretes.');
      const resumo =
        `Enviados agora: ${data.inatividade} de inatividade, ${data.onboarding} de onboarding, ` +
        `${data.encontros} de encontro, ${data.votacao} de votação. ` +
        (data.erros?.length ? `Erros: ${data.erros.length}.` : 'Sem erros.') +
        ' Uma cópia de cada foi enviada em cópia oculta para jaqueline.amaro93@gmail.com.';
      const detalheErros = data.erros?.length
        ? `\n\nDetalhe dos erros (até 5):\n${data.erros.slice(0, 5).join('\n')}`
        : '';
      setResultadoLembretes(resumo + detalheErros);
    } catch (err) {
      setResultadoLembretes(
        err instanceof Error ? err.message : 'Não foi possível enviar os lembretes agora.'
      );
    } finally {
      setEnviandoLembretes(false);
    }
  }

  async function entrarComoUsuario(userId: string, nome: string) {
    const confirmado = window.confirm(
      `Você vai sair da sua conta admin e entrar como ${nome}. Sua sessão de admin vai ser substituída, para voltar a ser você mesma, saia e faça login de novo com seu e-mail. Confirma?`
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

  async function resetarSenhaUsuario(userId: string, email: string, nome: string) {
    const confirmado = window.confirm(
      `Gerar link de reset de senha para ${nome}? O link será copiado para a área de transferência.`
    );
    if (!confirmado) return;

    setResetandoId(userId);

    try {
      const res = await fetch('/api/admin/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      await navigator.clipboard.writeText(data.link);

      posthog.capture('admin_gerou_reset_senha', { usuario_alvo: userId });
      alert('Link copiado para a área de transferência! Compartilhe com o usuário.');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Não foi possível gerar o link de reset.');
    } finally {
      setResetandoId(null);
    }
  }

  async function deletarUsuario(userId: string, nome: string) {
    const confirmado = window.confirm(
      `ATENÇÃO: Tem certeza que quer deletar ${nome}? Esta ação não pode ser desfeita. O usuário terá que criar uma nova conta.`
    );
    if (!confirmado) return;

    setDeletandoId(userId);

    try {
      const res = await fetch('/api/admin/delete-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setLinhas((prev) => prev.filter((l) => l.profile.id !== userId));
      posthog.capture('admin_deletou_usuario', { usuario_alvo: userId });
      alert('Usuário deletado com sucesso!');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Não foi possível deletar o usuário.');
    } finally {
      setDeletandoId(null);
    }
  }

  async function handleSignOut() {
    posthog.capture('logout_realizado');
    await supabase.auth.signOut();
    limparIdentidade();
    router.push('/login');
    router.refresh();
  }

  async function carregarUsuarios() {
    setUsuariosCarregando(true);
    try {
      const res = await fetch('/api/admin/listar-usuarios');
      const data = await res.json();
      setUsuarios(data || []);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
    } finally {
      setUsuariosCarregando(false);
    }
  }

  async function toggleAdmin(userId: string, currentAdmin: boolean) {
    setUsuarioTogglingId(userId);
    try {
      const res = await fetch('/api/admin/usuarios', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, is_admin: !currentAdmin }),
      });

      if (!res.ok) throw new Error('Erro ao atualizar');

      setUsuarios((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, is_admin: !currentAdmin } : u))
      );
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro ao atualizar usuário');
    } finally {
      setUsuarioTogglingId(null);
    }
  }

  useEffect(() => {
    carregarUsuarios();
  }, []);

  const usuariosFiltrados = usuarios.filter((u) => {
    if (filtroUsuarios === 'admin' && !u.is_admin) return false;
    if (filtroUsuarios === 'geral' && u.is_admin) return false;
    if (buscaUsuario.trim()) {
      const termo = buscaUsuario.trim().toLowerCase();
      if (!(u.nome?.toLowerCase().includes(termo) || u.email?.toLowerCase().includes(termo))) return false;
    }
    return true;
  });

  const total = linhas.length;
  const ativos7dias = linhas.filter((l) => {
    if (!l.profile.last_login_at) return false;
    const dias = (Date.now() - new Date(l.profile.last_login_at).getTime()) / 86400000;
    return dias <= 7;
  }).length;
  const semAcessoNunca = linhas.filter((l) => !l.profile.last_login_at).length;
  const emailsNaoConfirmados = linhas.filter((l) => !l.emailConfirmado);

  return (
    <div className="flex flex-col md:flex-row w-full">
      <Sidebar profile={profile} onSignOut={handleSignOut} />

      <main className="flex-1 px-6 py-8 md:px-12 md:py-12 max-w-7xl mx-auto w-full">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-sky-deep mb-2">
              Área administrativa
            </p>
            <h1 className="font-display text-3xl text-brown-deep mb-1">
              Painel dos mentorados
            </h1>
            <p className="text-sm text-ink-faint">
              Visão geral de quem está usando o quê. Para dados de sessão, tempo médio de
              acesso e localização, consulte o PostHog.
            </p>
          </div>
          <div className="flex flex-col gap-2 shrink-0">
            <Link
              href="/admin/financeiro"
              className="flex items-center justify-center gap-2 bg-brown-deep hover:bg-brown text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors whitespace-nowrap"
            >
              <Wallet size={15} />
              Financeiro
            </Link>
            <Link
              href="/admin/gerenciar-planos"
              className="flex items-center justify-center gap-2 border border-brown-deep text-brown-deep hover:bg-brown-deep/10 text-sm font-medium px-4 py-2.5 rounded-lg transition-colors whitespace-nowrap"
            >
              <CreditCard size={15} />
              Gerenciar planos e pagamentos
            </Link>
            <Link
              href="/admin/crescimento"
              className="flex items-center justify-center gap-2 border border-brown-deep text-brown-deep hover:bg-brown-deep/10 text-sm font-medium px-4 py-2.5 rounded-lg transition-colors whitespace-nowrap"
            >
              <Rocket size={15} />
              Boas práticas de crescimento
            </Link>
            <Link
              href="/admin/enquetes"
              className="flex items-center justify-center gap-2 border border-brown-deep text-brown-deep hover:bg-brown-deep/10 text-sm font-medium px-4 py-2.5 rounded-lg transition-colors whitespace-nowrap"
            >
              <Send size={15} />
              Gerenciar votações
            </Link>
            <button
              onClick={carregarUsuarios}
              disabled={usuariosCarregando}
              className="flex items-center justify-center gap-2 border border-brown-deep text-brown-deep hover:bg-brown-deep/10 text-sm font-medium px-4 py-2.5 rounded-lg transition-colors whitespace-nowrap disabled:opacity-60"
            >
              {usuariosCarregando ? <Loader2 size={15} className="animate-spin" /> : <Users size={15} />}
              {usuariosCarregando ? 'Carregando...' : 'Carregar usuários'}
            </button>
            <button
              onClick={enviarLembretesAgora}
              disabled={enviandoLembretes}
              className="flex items-center justify-center gap-2 border border-brown-deep text-brown-deep hover:bg-brown-deep/10 text-sm font-medium px-4 py-2.5 rounded-lg transition-colors whitespace-nowrap disabled:opacity-60"
            >
              {enviandoLembretes ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
              Enviar lembretes agora
            </button>
          </div>
        </div>

        {resultadoLembretes && (
          <div className="mb-6 text-sm bg-sky-tint border border-sky rounded-lg px-4 py-3 text-brown-deep whitespace-pre-wrap font-mono">
            {resultadoLembretes}
          </div>
        )}

        {emailsNaoConfirmados.length > 0 && (
          <div className="mb-6 text-sm bg-red-50 border border-red-300 rounded-lg px-4 py-3 text-red-700">
            <p className="flex items-center gap-1.5 font-medium mb-1">
              <MailWarning size={14} />
              {emailsNaoConfirmados.length} conta(s) sem confirmar o e-mail, ainda não conseguem
              entrar:
            </p>
            <p>
              {emailsNaoConfirmados.map((l) => l.profile.nome).join(', ')}. Confirma direto na
              tabela &quot;Ações da conta&quot; mais abaixo.
            </p>
          </div>
        )}

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
          <Eyebrow>Ações da conta</Eyebrow>
          <p className="text-xs text-ink-faint mb-4">
            Plano, forma de pagamento, valor, status, próxima cobrança, data de fim de acesso e
            observação de cada mentorado agora ficam todos juntos em{' '}
            <Link href="/admin/gerenciar-planos" className="text-sky-deep hover:underline">
              Gerenciar planos e pagamentos
            </Link>
            . Aqui ficam só as ações de conta que não fazem sentido lá.
          </p>
          <div className="overflow-x-auto rounded-xl border border-line">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-paper border-b border-line text-left">
                  <th className="px-4 py-3 font-medium text-ink-faint text-xs uppercase tracking-wide">
                    Nome
                  </th>
                  <th className="px-4 py-3 font-medium text-ink-faint text-xs uppercase tracking-wide">
                    E-mail
                  </th>
                  <th className="px-4 py-3 font-medium text-ink-faint text-xs uppercase tracking-wide">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody>
                {linhas.map((l) => (
                  <tr key={l.profile.id} className="border-b border-line last:border-0 bg-cream">
                    <td className="px-4 py-3 text-ink">{l.profile.nome}</td>
                    <td className="px-4 py-3">
                      {l.emailConfirmado ? (
                        <span className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-300">
                          Confirmado
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-300 w-fit">
                          <MailWarning size={11} />
                          Não confirmado
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        {!l.emailConfirmado && (
                          <button
                            onClick={() => confirmarEmailUsuario(l.profile.id, l.profile.nome)}
                            disabled={confirmandoId === l.profile.id}
                            className="flex items-center gap-1.5 text-xs bg-amber-600 hover:bg-amber-700 text-paper px-3 py-1.5 rounded-full transition-colors disabled:opacity-60"
                          >
                            {confirmandoId === l.profile.id ? (
                              <Loader2 size={12} className="animate-spin" />
                            ) : (
                              <MailWarning size={12} />
                            )}
                            Confirmar e-mail
                          </button>
                        )}
                        <button
                          onClick={() => resetarSenhaUsuario(l.profile.id, l.profile.email, l.profile.nome)}
                          disabled={resetandoId === l.profile.id}
                          className="flex items-center gap-1.5 text-xs bg-red-600 hover:bg-red-700 text-paper px-3 py-1.5 rounded-full transition-colors disabled:opacity-60"
                        >
                          {resetandoId === l.profile.id ? (
                            <Loader2 size={12} className="animate-spin" />
                          ) : (
                            <Key size={12} />
                          )}
                          Reset senha
                        </button>
                        <button
                          onClick={() => deletarUsuario(l.profile.id, l.profile.nome)}
                          disabled={deletandoId === l.profile.id}
                          className="flex items-center gap-1.5 text-xs bg-red-800 hover:bg-red-900 text-paper px-3 py-1.5 rounded-full transition-colors disabled:opacity-60"
                        >
                          {deletandoId === l.profile.id ? (
                            <Loader2 size={12} className="animate-spin" />
                          ) : (
                            <Trash2 size={12} />
                          )}
                          Deletar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {usuarios.length > 0 && (
          <section className="mt-10">
            <Eyebrow>Gerenciar usuários e permissões</Eyebrow>
            <p className="text-xs text-ink-faint mb-4">
              Clique em um usuário para alternar seu status de admin. Admins não aparecem no ranking de competição.
            </p>
            <div className="grid sm:grid-cols-2 gap-6">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-brown-deep flex items-center gap-2">
                    <Users size={18} />
                    Usuários ({usuariosFiltrados.length})
                  </h3>
                  <select
                    value={filtroUsuarios}
                    onChange={(e) => setFiltroUsuarios(e.target.value as any)}
                    className="text-xs border border-line rounded px-2 py-1 bg-cream text-brown-deep"
                  >
                    <option value="todos">Todos</option>
                    <option value="admin">Apenas Admins</option>
                    <option value="geral">Apenas Geral</option>
                  </select>
                </div>
                <input
                  type="text"
                  value={buscaUsuario}
                  onChange={(e) => setBuscaUsuario(e.target.value)}
                  placeholder="Buscar por nome ou e-mail..."
                  className="w-full text-sm border border-line rounded-lg px-3 py-2 mb-3 bg-cream text-ink placeholder:text-ink-faint focus:outline-none focus:border-brown-deep"
                />
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {usuariosFiltrados.map((usuario) => (
                    <div
                      key={usuario.id}
                      className={`w-full text-left px-4 py-3 rounded-lg border transition-all ${
                        usuario.is_admin
                          ? 'bg-amber-50 border-amber-300'
                          : 'bg-cream border-line'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex-1">
                          <p className="font-medium text-ink flex items-center gap-1">
                            {usuario.nome}
                            {usuario.is_admin && <Shield size={14} className="text-amber-600" />}
                          </p>
                          <p className="text-xs text-ink-faint mb-1.5">{usuario.email}</p>
                          <span className={`inline-block text-[10px] uppercase tracking-wide font-medium px-2.5 py-0.5 rounded-full border ${
                            usuario.is_admin
                              ? 'bg-amber-100 text-amber-700 border-amber-300'
                              : 'bg-sky-50 text-sky-700 border-sky-200'
                          }`}>
                            {usuario.is_admin ? '👮 Admin' : '👤 Usuário'}
                          </span>
                        </div>
                        <button
                          onClick={() => toggleAdmin(usuario.id, usuario.is_admin)}
                          disabled={usuarioTogglingId === usuario.id}
                          className={`shrink-0 p-1.5 rounded-lg transition-colors ${
                            usuarioTogglingId === usuario.id ? 'opacity-60' : 'hover:bg-black/5'
                          }`}
                          title={usuario.is_admin ? 'Remover acesso admin' : 'Conceder acesso admin'}
                        >
                          {usuarioTogglingId === usuario.id ? (
                            <Loader2 size={16} className="animate-spin text-brown-deep" />
                          ) : (
                            <Shield size={16} className={usuario.is_admin ? 'text-amber-600' : 'text-ink-faint'} />
                          )}
                        </button>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        <button
                          onClick={() => confirmarEmailUsuario(usuario.id, usuario.nome)}
                          disabled={confirmandoId === usuario.id}
                          className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-brown hover:bg-brown-deep text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors disabled:opacity-60"
                        >
                          {confirmandoId === usuario.id ? <Loader2 size={12} className="animate-spin" /> : <Key size={12} />}
                          Reset senha
                        </button>
                        <button
                          onClick={() => deletarUsuario(usuario.id, usuario.nome)}
                          disabled={deletandoId === usuario.id}
                          className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors disabled:opacity-60"
                        >
                          {deletandoId === usuario.id ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                          Deletar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-brown-deep mb-3 flex items-center gap-2">
                  <Lock size={18} />
                  Tipos de acesso
                </h3>
                <div className="space-y-3">
                  <div className="bg-amber-50 border border-amber-300 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <Shield size={18} className="text-amber-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-brown-deep">Usuário Admin</p>
                        <p className="text-xs text-ink-faint mt-1">
                          ✓ Acesso à área administrativa<br/>
                          ✓ Gerenciar usuários e permissões<br/>
                          ✓ Enviar lembretes em massa<br/>
                          ✓ Não aparece no ranking
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-sky-50 border border-sky-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <Users size={18} className="text-sky-deep mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-brown-deep">Usuário Regular</p>
                        <p className="text-xs text-ink-faint mt-1">
                          ✓ Acesso ao portal do mentorado<br/>
                          ✓ Participa do ranking<br/>
                          ✓ Acesso a todos os módulos<br/>
                          ✗ Sem acesso administrativo
                        </p>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-ink-faint pt-2">
                    💡 Clique em um usuário à esquerda para promover ou rebaixar seu acesso.
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ExternalLink, Users, Activity, Clock, Loader2, Check, LogIn, Key, Trash2, CreditCard, Send, Wallet, Rocket, MailWarning, Shield, Lock, MessageSquare, MoreVertical } from 'lucide-react';
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
  const [buscaUsuario, setBuscaUsuario] = useState('');
  const [filtroUsuarios, setFiltroUsuarios] = useState<'todos' | 'admin' | 'geral'>('todos');
  const [usuariosCarregando, setUsuariosCarregando] = useState(false);

  async function carregarUsuarios() {
    setUsuariosCarregando(true);
    try {
      const res = await fetch('/api/admin/listar-usuarios');
      if (!res.ok) {
        console.error('Erro ao carregar usuários:', res.status, res.statusText);
        setUsuarios([]);
        return;
      }
      const data = await res.json();
      setUsuarios(Array.isArray(data?.profiles) ? data.profiles : []);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
      setUsuarios([]);
    } finally {
      setUsuariosCarregando(false);
    }
  }

  async function toggleAdmin(userId: string, currentAdmin: boolean) {
    try {
      const res = await fetch('/api/admin/usuarios', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, is_admin: !currentAdmin }),
      });
      if (!res.ok) throw new Error('Erro ao atualizar');
      carregarUsuarios();
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro ao atualizar usuário');
    }
  }

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

  const total = linhas.length;
  const ativos7dias = linhas.filter((l) => {
    if (!l.profile.last_login_at) return false;
    const dias = (Date.now() - new Date(l.profile.last_login_at).getTime()) / 86400000;
    return dias <= 7;
  }).length;
  const semAcessoNunca = linhas.filter((l) => !l.profile.last_login_at).length;
  const emailsNaoConfirmados = linhas.filter((l) => !l.emailConfirmado);
  const usuariosFiltrados = usuarios.filter((u) => {
    if (filtroUsuarios === "admin" && !u.is_admin) return false;
    if (filtroUsuarios === "geral" && u.is_admin) return false;
    if (buscaUsuario.trim()) {
      const termo = buscaUsuario.trim().toLowerCase();
      if (!(u.nome?.toLowerCase().includes(termo) || u.email?.toLowerCase().includes(termo))) return false;
    }
    return true;
  });


  return (
    <>
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-mint mb-2 bg-mint/10 px-3 py-1.5 rounded-md inline-flex items-center gap-2 border border-mint/20">
              Área administrativa
            </p>
            <h1 className="font-display text-3xl text-black mb-1">
              Painel dos mentorados
            </h1>
            <p className="text-sm text-gray-text">
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
              className="flex items-center justify-center gap-2 border border-brown-deep text-black hover:bg-brown-deep/10 text-sm font-medium px-4 py-2.5 rounded-lg transition-colors whitespace-nowrap"
            >
              <CreditCard size={15} />
              Gerenciar planos e pagamentos
            </Link>
            <Link
              href="/admin/crescimento"
              className="flex items-center justify-center gap-2 border border-brown-deep text-black hover:bg-brown-deep/10 text-sm font-medium px-4 py-2.5 rounded-lg transition-colors whitespace-nowrap"
            >
              <Rocket size={15} />
              Boas práticas de crescimento
            </Link>
            <Link
              href="/admin/enquetes"
              className="flex items-center justify-center gap-2 border border-brown-deep text-black hover:bg-brown-deep/10 text-sm font-medium px-4 py-2.5 rounded-lg transition-colors whitespace-nowrap"
            >
              <Send size={15} />
              Gerenciar votações
            </Link>
            <Link
              href="/admin/feedbacks"
              className="flex items-center justify-center gap-2 border border-brown-deep text-black hover:bg-brown-deep/10 text-sm font-medium px-4 py-2.5 rounded-lg transition-colors whitespace-nowrap"
            >
              <MessageSquare size={15} />
              Feedbacks do PDI
            </Link>

            <button
              onClick={enviarLembretesAgora}
              disabled={enviandoLembretes}
              className="flex items-center justify-center gap-2 border border-brown-deep text-black hover:bg-brown-deep/10 text-sm font-medium px-4 py-2.5 rounded-lg transition-colors whitespace-nowrap disabled:opacity-60"
            >
              {enviandoLembretes ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
              Enviar lembretes agora
            </button>
          </div>
        </div>

        {resultadoLembretes && (
          <div className="mb-6 text-sm bg-mint-light border border-mint rounded-lg px-4 py-3 text-black whitespace-pre-wrap font-mono">
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
            <Users size={18} className="text-mint mb-2" />
            <p className="font-display text-2xl text-black">{total}</p>
            <p className="text-xs text-gray-text">Mentorados cadastrados</p>
          </Panel>
          <Panel className="p-5">
            <Activity size={18} className="text-mint mb-2" />
            <p className="font-display text-2xl text-black">{ativos7dias}</p>
            <p className="text-xs text-gray-text">Ativos nos últimos 7 dias</p>
          </Panel>
          <Panel className="p-5">
            <Clock size={18} className="text-mint mb-2" />
            <p className="font-display text-2xl text-black">{semAcessoNunca}</p>
            <p className="text-xs text-gray-text">Nunca acessaram</p>
          </Panel>
        </div>

        <section className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <Eyebrow>Atividade por mentorado</Eyebrow>
            <a
              href={POSTHOG_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs text-mint hover:text-black transition-colors"
            >
              Ver sessões e localização no PostHog <ExternalLink size={12} />
            </a>
          </div>

          <div className="overflow-x-auto rounded-xl border border-gray-faint">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-white border-b border-gray-faint text-left">
                  <th className="px-4 py-3 font-medium text-gray-text text-xs uppercase tracking-wide">
                    Nome
                  </th>
                  <th className="px-4 py-3 font-medium text-gray-text text-xs uppercase tracking-wide">
                    Pacote
                  </th>
                  <th className="px-4 py-3 font-medium text-gray-text text-xs uppercase tracking-wide">
                    Último acesso
                  </th>
                  <th className="px-4 py-3 font-medium text-gray-text text-xs uppercase tracking-wide">
                    Onboarding
                  </th>
                  <th className="px-4 py-3 font-medium text-gray-text text-xs uppercase tracking-wide text-center">
                    Diagnósticos
                  </th>
                  <th className="px-4 py-3 font-medium text-gray-text text-xs uppercase tracking-wide text-center">
                    Diário
                  </th>
                  <th className="px-4 py-3 font-medium text-gray-text text-xs uppercase tracking-wide text-center">
                    Quem Sou Eu
                  </th>
                  <th className="px-4 py-3 font-medium text-gray-text text-xs uppercase tracking-wide text-center">
                    PDI
                  </th>
                  <th className="px-4 py-3 font-medium text-gray-text text-xs uppercase tracking-wide text-center">
                    VIA
                  </th>
                  <th className="px-4 py-3 font-medium text-gray-text text-xs uppercase tracking-wide text-center">
                    Pontos
                  </th>
                  <th className="px-4 py-3 font-medium text-gray-text text-xs uppercase tracking-wide" />
                </tr>
              </thead>
              <tbody>
                {linhas.map((l) => (
                  <tr key={l.profile.id} className="border-b border-gray-faint last:border-0 bg-white">
                    <td className="px-4 py-3">
                      <p className="text-black">{l.profile.nome}</p>
                      <p className="text-xs text-gray-text">{l.profile.email}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-text capitalize">
                      {l.profile.tipo_pacote}
                    </td>
                    <td className="px-4 py-3 text-gray-text">
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
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={l.profile.onboarding_concluido}
                          onChange={async () => {
                            const { createClient } = await import('@/lib/supabase/client');
                            const sb = createClient();
                            await sb.from('profiles').update({ onboarding_concluido: !l.profile.onboarding_concluido }).eq('id', l.profile.id);
                            window.location.reload();
                          }}
                          className="w-4 h-4 accent-green-600 cursor-pointer"
                        />
                        <span className={`text-[10px] uppercase ${l.profile.onboarding_concluido ? 'text-green-700' : 'text-amber-700'}`}>
                          {l.profile.onboarding_concluido ? 'Feito' : 'Pendente'}
                        </span>
                      </label>
                    </td>
                    <td className="px-4 py-3 text-center text-gray-text">
                      {l.diagnosticos}
                    </td>
                    <td className="px-4 py-3 text-center text-gray-text">
                      {l.anotacoesDiario}
                    </td>
                    <td className="px-4 py-3 text-center text-gray-text">
                      {l.blocosQuemSouEu}/{totalBlocosQuemSouEu}
                    </td>
                    <td className="px-4 py-3 text-center text-gray-text">
                      {l.secoesPdi}/{totalSecoesPdi || '-'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {l.fezVia ? (
                        <span className="text-mint">✓</span>
                      ) : (
                        <span className="text-gray-text">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center text-black font-medium">
                      {l.profile.pontos_total}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => entrarComoUsuario(l.profile.id, l.profile.nome)}
                        disabled={entrandoComoId === l.profile.id}
                        className="flex items-center gap-1.5 text-xs text-mint hover:text-black transition-colors whitespace-nowrap disabled:opacity-60"
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

        <section className="mb-10">
          <Eyebrow>Ações da conta</Eyebrow>
          <p className="text-xs text-gray-text mb-4">
            Plano, forma de pagamento, valor, status, próxima cobrança, data de fim de acesso e
            observação de cada mentorado agora ficam todos juntos em{' '}
            <Link href="/admin/gerenciar-planos" className="text-mint hover:underline">
              Gerenciar planos e pagamentos
            </Link>
            . Aqui ficam só as ações de conta que não fazem sentido lá.
          </p>
          <div className="overflow-x-auto rounded-xl border border-gray-faint">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-white border-b border-gray-faint text-left">
                  <th className="px-4 py-3 font-medium text-gray-text text-xs uppercase tracking-wide">
                    Nome
                  </th>
                  <th className="px-4 py-3 font-medium text-gray-text text-xs uppercase tracking-wide">
                    E-mail
                  </th>
                  <th className="px-4 py-3 font-medium text-gray-text text-xs uppercase tracking-wide">
                    Tipo
                  </th>
                  <th className="px-4 py-3 font-medium text-gray-text text-xs uppercase tracking-wide text-center">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody>
                {linhas.map((l) => (
                  <tr key={l.profile.id} className="border-b border-gray-faint last:border-0 bg-white">
                    <td className="px-4 py-3 text-black">{l.profile.nome}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block text-[10px] uppercase px-2 py-0.5 rounded-full ${
                        l.profile.is_admin
                          ? 'bg-amber-100 text-amber-700 border border-amber-300'
                          : 'bg-mint-50 text-mint-700 border border-mint-200'
                      }`}>
                        {l.profile.is_admin ? '👮 Admin' : '👤 Usuário'}
                      </span>
                    </td>
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
                    <td className="px-4 py-3 text-center">
                      <div className="relative group inline-block">
                        <button className="p-2 hover:bg-white rounded-lg transition-colors">
                          <MoreVertical size={16} className="text-gray-text" />
                        </button>
                        <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-faint rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                          <button
                            onClick={() => window.location.href = `/admin/usuarios-permissoes/${l.profile.id}`}
                            className="w-full text-left px-3 py-2 text-sm text-black hover:bg-white border-b border-gray-faint"
                          >
                            ✏️ Editar Permissões
                          </button>
                          {!l.emailConfirmado && (
                            <button
                              onClick={() => confirmarEmailUsuario(l.profile.id, l.profile.nome)}
                              disabled={confirmandoId === l.profile.id}
                              className="w-full text-left px-4 py-2 text-sm text-black hover:bg-white border-b border-gray-faint disabled:opacity-60"
                            >
                              📧 Confirmar e-mail
                            </button>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => resetarSenhaUsuario(l.profile.id, l.profile.email, l.profile.nome)}
                          disabled={resetandoId === l.profile.id}
                          className="flex items-center gap-1.5 text-xs bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-full transition-colors disabled:opacity-60"
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
                          className="flex items-center gap-1.5 text-xs bg-red-800 hover:bg-red-900 text-white px-3 py-1.5 rounded-full transition-colors disabled:opacity-60"
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

        <section className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <Eyebrow>Gerenciar usuários e permissões</Eyebrow>
            <button
              onClick={carregarUsuarios}
              disabled={usuariosCarregando}
              className="text-xs text-mint hover:text-black disabled:opacity-60"
            >
              {usuariosCarregando ? '⟳ Carregando...' : '⟳ Recarregar'}
            </button>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-gray-faint p-6">
              <h3 className="flex items-center gap-2 font-medium text-black mb-4">
                <Shield size={18} />
                Usuários
              </h3>
              <p className="text-xs text-gray-text mb-4">
                Clique para promover ou remover acesso de administrador
              </p>
              {usuariosCarregando ? (
                <div className="text-center py-8 text-gray-text">Carregando usuários...</div>
              ) : usuarios.length === 0 ? (
                <div className="text-center py-8 text-gray-text">Nenhum usuário encontrado</div>
              ) : (
                <>
                  <div className="mb-4 flex gap-3">
                    <input
                      type="text"
                      value={buscaUsuario}
                      onChange={(e) => setBuscaUsuario(e.target.value)}
                      placeholder="Buscar por nome ou email..."
                      className="flex-1 border border-gray-faint rounded px-3 py-2 text-sm bg-white"
                    />
                    <select
                      value={filtroUsuarios}
                      onChange={(e) => setFiltroUsuarios(e.target.value as any)}
                      className="border border-gray-faint rounded px-3 py-2 text-sm bg-white"
                    >
                      <option value="todos">Todos</option>
                      <option value="admin">Apenas Admins</option>
                      <option value="geral">Apenas Geral</option>
                    </select>
                  </div>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {usuariosFiltrados.map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center justify-between p-3 bg-white rounded border border-gray-faint text-sm"
                      >
                        <div className="flex-1 text-left">
                          <p className="font-medium text-black flex items-center gap-2">
                            {user.nome}
                            {user.is_admin && <Shield size={14} className="text-black" />}
                          </p>
                          <p className="text-xs text-gray-text mb-2">{user.email}</p>
                          <span className={`inline-block text-[10px] uppercase px-2 py-1 rounded ${
                            user.is_admin ? 'bg-amber-100 text-amber-700' : 'bg-mint-50 text-mint-700'
                          }`}>
                            {user.is_admin ? '👮 Admin' : '👤 Usuário'}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => toggleAdmin(user.id, user.is_admin)}
                            className="px-2 py-1 text-xs bg-brown text-white rounded hover:bg-brown-deep"
                          >
                            Toggle
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>


          </div>
        </section>
    </>
  );
}

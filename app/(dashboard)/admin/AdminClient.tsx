'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Loader2, Send, Search } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { posthog } from '@/lib/posthog';
import type { Profile } from '@/lib/types';
import type { LinhaMentorado } from './page';

interface Props {
  profile: Profile;
  linhas: LinhaMentorado[];
  totalBlocosQuemSouEu: number;
  totalSecoesPdi: number;
}


export default function AdminClient({
  linhas: linhasIniciais,
  totalBlocosQuemSouEu,
  totalSecoesPdi,
}: Props) {
  const supabase = createClient();
  const [linhas, setLinhas] = useState(linhasIniciais);
  const [buscaMentorado, setBuscaMentorado] = useState('');
  const [filtroAtividade, setFiltroAtividade] = useState<'todos' | 'ativos7' | 'inativos7' | 'nunca' | 'email' | 'onboarding'>('todos');
  const [entrandoComoId, setEntrandoComoId] = useState<string | null>(null);
  const [resetandoId, setResetandoId] = useState<string | null>(null);
  const [deletandoId, setDeletandoId] = useState<string | null>(null);
  const [confirmandoId, setConfirmandoId] = useState<string | null>(null);
  const [enviandoLembretes, setEnviandoLembretes] = useState(false);
  const [resultadoLembretes, setResultadoLembretes] = useState<string | null>(null);
  const [agora] = useState(() => Date.now());
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
      const totalEnviado =
        Number(data.inatividade || 0) +
        Number(data.onboarding || 0) +
        Number(data.encontros || 0) +
        Number(data.votacao || 0);

      const base = data.base;
      const diagnosticoBase = base
        ? `Base real: ${base.ativosConsiderados} mentorados ativos, ${base.nuncaAcessaram} nunca acessaram, ` +
          `${base.inativos7dias} estão sem atividade há mais de 7 dias e ${base.onboardingPendentes} têm onboarding pendente.\n` +
          `Em cooldown: ${base.cooldownInatividade} de inatividade e ${base.cooldownOnboarding} de onboarding.\n\n`
        : '';

      const resumo =
        diagnosticoBase +
        `Enviados nesta execução: ${data.inatividade} de inatividade, ${data.onboarding} de onboarding, ` +
        `${data.encontros} de encontro, ${data.votacao} de votação. ` +
        (data.erros?.length ? `Erros: ${data.erros.length}.` : 'Sem erros.') +
        (totalEnviado > 0
          ? ' As mensagens enviadas foram copiadas em BCC para jaqueline.amaro93@gmail.com.'
          : ' Nenhum e-mail foi enviado nesta execução, então não houve cópia em BCC.');
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
      `Deseja inspecionar a SOMA como ${nome}? Um botão "Voltar ao backoffice" ficará disponível em todas as páginas durante 2 horas. Alterações feitas nessa conta podem afetar dados reais. Continuar?`
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
      // Uma navegação completa limpa a identidade anterior da memória do
      // browser Supabase, para que cookies e contexto da sessão coincidam.
      window.location.assign('/dashboard');
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
      `Excluir a conta de ${nome}? A exclusão só será permitida para uma conta nova sem histórico ou assinatura. Contas de alunos e conteúdos salvos serão preservados.`
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

  const linhasDeMentorados = linhas;
  const total = linhasDeMentorados.length;
  const diasDesdeAtividade = (data: string | null | undefined) =>
    data ? Math.max(0, Math.floor((agora - new Date(data).getTime()) / 86400000)) : null;

  const ativos7dias = linhasDeMentorados.filter((l) => {
    const dias = diasDesdeAtividade(l.profile.last_activity_at);
    return dias !== null && dias <= 7;
  }).length;

  const inativos7dias = linhasDeMentorados.filter((l) => {
    const dias = diasDesdeAtividade(l.profile.last_activity_at);
    return dias !== null && dias > 7;
  }).length;

  const semAcessoNunca = linhasDeMentorados.filter((l) => !l.profile.last_activity_at).length;
  const emailsNaoConfirmados = linhasDeMentorados.filter((l) => !l.emailConfirmado);
  const normalizarPesquisa = (valor: string) => valor
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR').trim();
  const combinaNomeOuEmail = (nome: string | null | undefined, email: string | null | undefined, busca: string) => {
    const consulta = normalizarPesquisa(busca);
    if (!consulta) return true;
    const palavras = normalizarPesquisa(nome ?? '').split(/\s+/);
    const endereco = normalizarPesquisa(email ?? '');
    if (endereco.includes(consulta)) return true;
    return consulta.split(/\s+/).every((fragmento) =>
      palavras.some((palavra) => palavra.startsWith(fragmento))
    );
  };
  const termoMentorado = buscaMentorado.trim();
  const linhasFiltradas = linhas.filter((l) => {
    const combinaBusca = combinaNomeOuEmail(l.profile.nome, l.profile.email, termoMentorado);

    if (!combinaBusca) return false;

    const dias = diasDesdeAtividade(l.profile.last_activity_at);
    if (filtroAtividade === 'ativos7') return dias !== null && dias <= 7;
    if (filtroAtividade === 'inativos7') return dias !== null && dias > 7;
    if (filtroAtividade === 'nunca') return dias === null;
    if (filtroAtividade === 'email') return !l.emailConfirmado;
    if (filtroAtividade === 'onboarding') return !l.profile.onboarding_concluido;

    return true;
  });
  const filtros = [
    { value: 'todos', title: 'Todos', count: total },
    { value: 'email', title: 'E-mail não confirmado', count: emailsNaoConfirmados.length },
    { value: 'onboarding', title: 'Onboarding pendente', count: linhasDeMentorados.filter(l => !l.profile.onboarding_concluido).length },
    { value: 'inativos7', title: 'Sem atividade há mais de 7 dias', count: inativos7dias },
    { value: 'nunca', title: 'Sem acesso registrado', count: semAcessoNunca },
    { value: 'ativos7', title: 'Ativos nos últimos 7 dias', count: ativos7dias },
  ] as const;
  const acaoClass = 'inline-flex min-h-11 items-center justify-center rounded-lg border border-[#bbcfc5] bg-white px-3 py-2 text-sm text-[#24594b] hover:bg-[#f5f8f6] focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50';

  return <div className="min-w-0 text-[#213d34]">
    <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div><h1 className="text-2xl font-semibold">Acompanhamento dos mentorados</h1><p className="mt-2 text-sm text-[#53685e]">Localize uma pessoa, confira sua atividade e abra os detalhes para acompanhar.</p></div>
      <Link href="/admin/usuarios" className={acaoClass}>Pessoas e acessos</Link>
    </header>
    <section aria-label="Sinais para acompanhamento" className="mb-6">
      <h2 className="mb-3 text-base font-semibold">Onde olhar agora</h2>
      <div className="flex flex-wrap gap-2">{filtros.map(item => <button key={item.value} type="button" aria-pressed={filtroAtividade === item.value} onClick={() => { setFiltroAtividade(item.value); setBuscaMentorado(''); }} className={'min-h-11 rounded-lg border px-3 py-2 text-left text-sm focus-visible:outline-2 focus-visible:outline-offset-2 ' + (filtroAtividade === item.value ? 'border-[#24594b] bg-[#edf5f0] font-semibold' : 'border-[#d7e3dc] bg-white hover:bg-[#f5f8f6]')}><span className="mr-2 font-semibold">{item.count}</span>{item.title}</button>)}</div>
      <p className="mt-3 text-xs leading-5 text-[#53685e]">Os sinais podem se sobrepor. Atividade e onboarding ajudam a orientar o acompanhamento; não indicam, sozinhos, pagamento pendente ou falta de evolução.</p>
    </section>
    <section aria-label="Lista de acompanhamento">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <label className="flex w-full max-w-xl items-center gap-2 rounded-lg border border-[#bbcfc5] bg-white px-3 py-3 focus-within:ring-2 focus-within:ring-[#24594b]"><Search size={17} aria-hidden="true" /><span className="sr-only">Buscar mentorado por nome ou e-mail</span><input type="search" value={buscaMentorado} onChange={event => setBuscaMentorado(event.target.value)} placeholder="Buscar pessoa por nome ou e-mail" className="w-full min-w-0 bg-transparent text-base outline-none" /></label>
        <Link href="/admin/analytics" className="inline-flex min-h-11 items-center text-sm text-[#24594b] underline underline-offset-4">Ver indicadores de uso</Link>
      </div>
      <p role="status" className="mb-3 text-sm text-[#53685e]">{linhasFiltradas.length} {linhasFiltradas.length === 1 ? 'pessoa encontrada' : 'pessoas encontradas'} · {filtros.find(filtro => filtro.value === filtroAtividade)?.title}</p>
      <div className="divide-y divide-[#d7e3dc] overflow-hidden rounded-xl border border-[#d7e3dc] bg-white">{linhasFiltradas.map(l => <details key={l.profile.id} className="group">
        <summary className="cursor-pointer p-4 focus-visible:outline-2 focus-visible:-outline-offset-2">
          <span className="inline-grid w-[calc(100%_-_1.5rem)] gap-3 align-top sm:grid-cols-[minmax(0,1fr)_12rem]">
            <span className="min-w-0"><span className="block break-words font-semibold">{l.profile.nome || 'Sem nome'}{l.profile.is_admin && <span className="ml-2 text-xs font-normal text-[#53685e]">Conta de teste · admin</span>}</span><span className="mt-1 block break-all text-sm text-[#53685e]">{l.profile.email}</span>
              <span className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-[#53685e]">{!l.emailConfirmado && <span className="text-amber-800">E-mail não confirmado</span>}{!l.profile.onboarding_concluido && <span>Onboarding pendente</span>}</span>
            </span>
            <span className="text-sm text-[#53685e]"><span className="block">{l.profile.last_activity_at ? 'Última atividade: ' + new Date(l.profile.last_activity_at).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' }) : 'Sem acesso registrado'}</span><span className="mt-2 block font-medium text-[#24594b] group-open:hidden">Ver acompanhamento</span><span className="mt-2 hidden font-medium text-[#24594b] group-open:block">Recolher detalhes</span></span>
          </span>
        </summary>
        <div className="border-t border-[#edf2ef] bg-[#fafcfb] p-4 sm:p-5">
          <h3 className="mb-3 text-sm font-semibold">Registros na jornada</h3>
          <dl className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3 lg:grid-cols-6">{[
            ['Diagnósticos', l.diagnosticos], ['Diário de bordo', l.anotacoesDiario], ['Quem sou eu', `${l.blocosQuemSouEu}/${totalBlocosQuemSouEu}`], ['Respostas do PDI', `${l.secoesPdi}/${totalSecoesPdi || '-'}`], ['VIA', l.fezVia ? 'Registrado' : 'Sem registro'], ['Pontos', l.profile.pontos_total],
          ].map(([label,value]) => <div key={label}><dt className="text-xs text-[#53685e]">{label}</dt><dd className="mt-1 font-semibold">{value}</dd></div>)}</dl>
          <p className="mt-4 text-xs text-[#53685e]">Os números mostram registros disponíveis, não uma avaliação de desempenho.</p>
          <div className="mt-5 flex flex-wrap gap-2"><button type="button" onClick={() => entrarComoUsuario(l.profile.id, l.profile.nome)} disabled={entrandoComoId === l.profile.id} className={acaoClass}>{entrandoComoId === l.profile.id ? 'Abrindo...' : 'Inspecionar jornada'}</button><Link href={'/admin/usuarios-permissoes/' + l.profile.id} className={acaoClass}>Permissões da pessoa</Link></div>
          <details className="mt-5 border-t border-[#d7e3dc] pt-2">
            <summary className="cursor-pointer py-3 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2">Ações de acesso da conta</summary>
            <p className="mb-3 text-sm text-[#53685e]">E-mail {l.emailConfirmado ? 'confirmado' : 'não confirmado'}. Onboarding {l.profile.onboarding_concluido ? 'concluído' : 'pendente'}.{l.profile.tipo_pacote ? ' Pacote registrado: ' + l.profile.tipo_pacote + '.' : ''}</p>
            <div className="flex flex-wrap gap-2">
              {!l.emailConfirmado && <button type="button" onClick={() => confirmarEmailUsuario(l.profile.id, l.profile.nome)} disabled={confirmandoId === l.profile.id} className={acaoClass}>{confirmandoId === l.profile.id ? 'Confirmando...' : 'Confirmar e-mail'}</button>}
              <button type="button" onClick={() => resetarSenhaUsuario(l.profile.id, l.profile.email, l.profile.nome)} disabled={resetandoId === l.profile.id} className={acaoClass}>{resetandoId === l.profile.id ? 'Gerando...' : 'Gerar link de senha'}</button>
              <button type="button" onClick={() => deletarUsuario(l.profile.id, l.profile.nome)} disabled={deletandoId === l.profile.id} className={acaoClass + ' border-red-200 text-red-800'}>{deletandoId === l.profile.id ? 'Excluindo...' : 'Excluir conta'}</button>
            </div>
            <p className="mt-3 text-xs text-[#53685e]">Papéis e onboarding são gerenciados em <Link href="/admin/usuarios" className="underline">Pessoas e acessos</Link>. Condições da contratação ficam em <Link href="/admin/gerenciar-planos" className="underline">Planos e contratos</Link>.</p>
          </details>
        </div>
      </details>)}</div>
      {!linhasFiltradas.length && <p className="rounded-xl border border-[#d7e3dc] bg-white p-6 text-sm text-[#53685e]">Nenhuma pessoa corresponde a esta busca e filtro. <button type="button" onClick={() => { setFiltroAtividade('todos'); setBuscaMentorado(''); }} className="min-h-11 underline">Limpar filtros</button></p>}
    </section>
    <footer className="mt-6 border-t border-[#d7e3dc] pt-4">
      <details><summary className="cursor-pointer py-3 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2">Lembretes da operação</summary><p className="mb-3 text-sm text-[#53685e]">Executa as regras de lembretes existentes para a base elegível. Os filtros acima não definem os destinatários.</p><button type="button" onClick={enviarLembretesAgora} disabled={enviandoLembretes} className={acaoClass}>{enviandoLembretes ? <Loader2 size={15} aria-hidden="true" className="mr-2 animate-spin" /> : <Send size={15} aria-hidden="true" className="mr-2" />}Enviar lembretes agora</button>{resultadoLembretes && <p role="status" className="mt-3 whitespace-pre-wrap text-sm leading-6">{resultadoLembretes}</p>}</details>
    </footer>
  </div>;
}

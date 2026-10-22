import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowLeft, MessageCircle, ShieldCheck, ThumbsDown, Users } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { validConversationId } from '@/lib/iris-web-history';

export const dynamic = 'force-dynamic';

type Params = { conversa?: string };
type Thread = { id: string; user_id: string; title: string; updated_at: string };
type Message = { id: string; role: 'user' | 'assistant'; content: string; created_at: string;
  feedback_rating: 'util' | 'nao_util' | null; feedback_reason: string | null };

export default async function CentralIrisAdmin({ searchParams }: { searchParams: Promise<Params> }) {
  const db = await createClient();
  const { data: { user } } = await db.auth.getUser();
  if (!user) redirect('/login');
  const { data: perfil, error: profileError } = await db.from('profiles')
    .select('is_admin').eq('id', user.id).maybeSingle();
  if (profileError || !perfil?.is_admin) redirect('/dashboard');

  const admin = createAdminClient();
  // Auditoria ocorre antes de qualquer leitura administrativa. Falha = nenhum dado.
  const { error: auditError } = await admin.from('iris_web_admin_audit').insert({
    actor_id: user.id, purpose: 'painel_qualidade', action: 'summary',
  });
  if (auditError) {
    return <main className="mx-auto max-w-4xl p-6"><h1 className="text-xl font-semibold">Central da Íris indisponível</h1>
      <p className="mt-3">Não foi possível registrar a auditoria de acesso. Nenhuma conversa foi consultada.</p></main>;
  }
  const [threadsResult, messagesResult] = await Promise.all([
    admin.from('iris_web_conversations')
      .select('id,user_id,title,updated_at').order('updated_at', { ascending: false }).limit(60),
    admin.from('iris_web_messages')
      .select('user_id,role,feedback_rating,created_at')
      .order('created_at', { ascending: false }).limit(400),
  ]);
  if (threadsResult.error || messagesResult.error) {
    return <main className="mx-auto max-w-4xl p-6"><h1 className="text-xl font-semibold">Central da Íris</h1>
      <p className="mt-3">O histórico ainda não está disponível. A configuração privada precisa ser validada.</p></main>;
  }
  const threads = (threadsResult.data ?? []) as Thread[];
  const metrics = messagesResult.data ?? [];
  const users = [...new Set(threads.map(t => t.user_id))];
  const { data: profiles } = users.length ? await admin.from('profiles')
    .select('id,nome').in('id', users) : { data: [] as {id:string;nome:string}[] };
  const names = new Map((profiles ?? []).map(p => [p.id, p.nome || 'Pessoa sem nome']));
  const chosenId = (await searchParams).conversa;
  let detail: { thread: Thread; messages: Message[] } | null = null;
  if (chosenId && validConversationId(chosenId)) {
    const chosen = threads.find(t => t.id === chosenId);
    // Paginação principal limita a 60; não permite consultar ids arbitrários pela URL.
    if (chosen) {
      const { error: readAuditError } = await admin.from('iris_web_admin_audit').insert({
        actor_id: user.id, subject_user_id: chosen.user_id,
        conversation_id: chosen.id, purpose: 'revisao_de_feedback', action: 'read_conversation',
      });
      if (!readAuditError) {
        const { data: msgs, error } = await admin.from('iris_web_messages')
          .select('id,role,content,created_at,feedback_rating,feedback_reason')
          .eq('conversation_id', chosen.id).eq('user_id', chosen.user_id)
          .order('created_at', { ascending: true }).limit(200);
        if (!error) detail = { thread: chosen, messages: (msgs ?? []) as Message[] };
      }
    }
  }
  const rated = metrics.filter(m => m.feedback_rating);
  const negatives = metrics.filter(m => m.feedback_rating === 'nao_util');
  return (
    <main className="mx-auto max-w-6xl space-y-7 px-4 py-7 sm:px-6">
      <Link href="/admin" className="inline-flex min-h-11 items-center gap-2 text-sm text-[#0D8071]">
        <ArrowLeft size={17} /> Administração
      </Link>
      <div className="space-y-2">
        <p className="text-xs font-bold uppercase tracking-widest text-[#0D8071]">Qualidade e experiência</p>
        <h1 className="font-display text-3xl text-[#183c32]">Central de Conversas da Íris</h1>
        <p className="max-w-3xl text-sm text-gray-600">
          Acompanhe adoção e feedbacks. Conteúdos de conversas privadas só são exibidos após uma
          consulta explícita, restrita a administradores e registrada em auditoria.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { label: 'Conversas recentes', value: threads.length, icon: MessageCircle },
          { label: 'Mentorados com conversas recentes', value: new Set(threads.map(t => t.user_id)).size, icon: Users },
          { label: 'Respostas avaliadas negativamente', value: negatives.length, icon: ThumbsDown },
        ].map(card => <section key={card.label} className="rounded-xl border border-[#e1e9e5] bg-white p-5">
          <card.icon size={21} className="mb-3 text-[#0D8071]" />
          <p className="text-3xl font-semibold text-[#163f35]">{card.value}</p>
          <p className="mt-1 text-xs text-gray-600">{card.label}</p>
        </section>)}
      </div>
      <p className="text-xs text-gray-500">Indicadores parciais das últimas 60 conversas e 400 mensagens consultadas.
        Avaliações registradas anteriormente em eventos podem não estar vinculadas ao histórico novo.
        Total de votos no recorte: {rated.length}.</p>
      <div className="grid gap-6 lg:grid-cols-[minmax(280px,0.9fr)_minmax(0,1.5fr)]">
        <section className="space-y-2" aria-label="Conversas recentes">
          <h2 className="text-lg font-semibold text-[#183c32]">Conversas recentes</h2>
          {threads.length === 0 && <p className="text-sm text-gray-600">Ainda não há conversas salvas.</p>}
          {threads.map(c => <Link key={c.id} href={'/admin/copiloto?conversa=' + c.id}
            className={'block rounded-xl border px-4 py-3 transition hover:border-[#0D8071] ' +
              (chosenId === c.id ? 'border-[#0D8071] bg-[#e8f5f0]' : 'border-gray-200 bg-white')}>
            <p className="truncate text-sm font-semibold text-[#25463b]">{c.title}</p>
            <p className="mt-1 text-xs text-gray-600">{names.get(c.user_id) || 'Mentorado'} · {new Date(c.updated_at).toLocaleDateString('pt-BR')}</p>
          </Link>)}
        </section>
        <section className="min-w-0 rounded-xl border border-[#e1e9e5] bg-white p-4 sm:p-5" aria-label="Leitura auditada de conversa">
          <div className="flex items-start gap-2 text-[#0D8071]">
            <ShieldCheck size={22} className="shrink-0" />
            <div>
              <h2 className="text-lg font-semibold text-[#183c32]">Leitura controlada</h2>
              <p className="text-xs text-gray-600">Acesso administrativo monitorado. Não compartilhe mensagens fora da SOMA.</p>
            </div>
          </div>
          {!detail && <p className="mt-8 text-sm text-gray-600">Selecione uma conversa para abrir o conteúdo.
            Se você selecionou e ela não apareceu, a consulta pode não estar disponível ou a auditoria falhou.</p>}
          {detail && <div className="mt-5 space-y-3">
            <p className="text-sm font-semibold">{names.get(detail.thread.user_id) || 'Mentorado'} · {detail.thread.title}</p>
            {detail.messages.map(m => <article key={m.id}
              className={'max-w-[92%] rounded-xl px-4 py-3 text-sm leading-relaxed ' +
                (m.role === 'user' ? 'ml-auto bg-[#e5f6f0] text-[#23493d]' : 'mr-auto bg-[#f5f2ef] text-[#382e29]')}>
              <p className="text-[11px] font-semibold">{m.role === 'user' ? 'Mentorado' : 'Íris'}</p>
              <p className="mt-2 whitespace-pre-wrap break-words">{m.content}</p>
              {m.feedback_rating && <p className="mt-2 text-xs font-semibold text-[#0D8071]">Avaliação: {m.feedback_rating === 'util' ? 'Útil' : 'Não ajudou'}</p>}
              {m.feedback_reason && <p className="mt-1 text-xs">Motivo: {m.feedback_reason}</p>}
            </article>)}
          </div>}
        </section>
      </div>
    </main>
  );
}

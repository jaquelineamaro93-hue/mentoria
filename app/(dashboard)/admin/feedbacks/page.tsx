import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Star } from 'lucide-react';
import EnviarFeedbackClient from '../EnviarFeedbackClient';
import ListarFeedbacksEnviadosClient from '../ListarFeedbacksEnviadosClient';
import AdminJournalClient from '../AdminJournalClient';

export default async function AdminFeedbacksPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: perfilAdmin } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single();

  if (!perfilAdmin?.is_admin) redirect('/dashboard');

  const [
    { data: mentorados },
    { data: feedbacksEnviados },
    { data: checkins },
    { data: diarioEntries },
  ] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, nome')
      .eq('is_admin', false)
      .order('nome'),
    supabase
      .from('feedback_sessoes')
      .select('id, user_id, titulo, conteudo, tipo, data, profiles:user_id(nome)')
      .eq('admin_id', user.id)
      .order('data', { ascending: false }),
    supabase
      .from('checkins_mensais')
      .select('*, profiles(nome, email)')
      .order('created_at', { ascending: false }),
    supabase
      .from('journal_notes')
      .select('id, user_id, encontro_data, tipo_encontro, anotacoes, ai_summary, created_at, profiles:user_id(nome)')
      .order('encontro_data', { ascending: false })
      .order('created_at', { ascending: false }),
  ]);

  const mediaGeral =
    checkins && checkins.length > 0
      ? (checkins.reduce((soma, c) => soma + c.nota, 0) / checkins.length).toFixed(1)
      : '—';

  return (
    <main className="px-6 py-8 md:px-12 md:py-12 w-full">
      <div className="mb-6">
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 text-sm text-gray-text hover:text-black transition-colors"
        >
          ← Voltar ao painel
        </Link>
      </div>

      <div className="flex items-start justify-between gap-4 flex-wrap mb-8">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-gray-text mb-2">Acompanhamento da jornada</p>
          <h1 className="font-display text-3xl text-black mb-1">Feedbacks & evolução</h1>
          <p className="text-sm text-gray-text max-w-2xl">
            Use Diário de Bordo, check-ins e histórico de feedbacks como contexto para acompanhar a evolução de cada mentorado.
          </p>
        </div>
        <div className="bg-white border border-gray-faint rounded-2xl px-5 py-3 text-center">
          <p className="text-2xl font-display text-black">{mediaGeral}</p>
          <p className="text-xs text-gray-text">nota média geral</p>
        </div>
      </div>

      <AdminJournalClient entries={(diarioEntries as any[]) ?? []} />

      <div className="mb-10">
        <EnviarFeedbackClient mentorados={mentorados ?? []} />
      </div>

      <ListarFeedbacksEnviadosClient feedbacks={(feedbacksEnviados as any[]) ?? []} />

      <section>
        <h2 className="font-display text-xl text-black mb-1">Check-ins dos mentorados</h2>
        <p className="text-sm text-gray-text mb-4">
          Percepção mensal sobre a experiência da mentoria e pontos de melhoria sinalizados pelos participantes.
        </p>
        {!checkins || checkins.length === 0 ? (
          <p className="text-sm text-gray-text">Ninguém enviou check-in ainda.</p>
        ) : (
          <div className="space-y-3">
            {checkins.map((c) => (
              <div key={c.id} className="bg-white border border-gray-faint rounded-xl p-4">
                <div className="flex items-start justify-between gap-4 flex-wrap mb-2">
                  <div>
                    <p className="text-sm font-medium text-black">
                      {(c as unknown as { profiles: { nome: string } }).profiles?.nome}
                    </p>
                    <p className="text-xs text-gray-text">
                      {new Date(c.mes_referencia + 'T00:00:00').toLocaleDateString('pt-BR', {
                        month: 'long',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-1" aria-label={`${c.nota} de 5`}>
                    {Array.from({ length: 5 }).map((_, idx) => (
                      <Star
                        key={idx}
                        size={13}
                        className={idx < c.nota ? 'fill-amber-400 text-amber-400' : 'text-line'}
                      />
                    ))}
                  </div>
                </div>
                {c.feedback_texto && <p className="text-sm text-black mb-1">{c.feedback_texto}</p>}
                {c.sugestao_melhoria && (
                  <p className="text-xs text-gray-text">
                    Sugestão de melhoria: {c.sugestao_melhoria}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

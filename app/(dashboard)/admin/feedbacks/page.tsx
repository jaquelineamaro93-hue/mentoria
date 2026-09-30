import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import AdminFeedbackHubClient from '../AdminFeedbackHubClient';

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

      <header className="mb-8">
        <p className="text-xs uppercase tracking-[0.16em] text-gray-text mb-2">
          Acompanhamento da jornada
        </p>
        <h1 className="font-display text-3xl text-black mb-1">Feedbacks & evolução</h1>
        <p className="text-sm text-gray-text max-w-2xl">
          Escolha a fonte que deseja consultar. Diário, devolutivas da mentoria e check-ins ficam separados para deixar claro quem escreveu cada informação e em qual contexto ela foi registrada.
        </p>
      </header>

      <AdminFeedbackHubClient
        mentorados={(mentorados as any[]) ?? []}
        feedbacks={(feedbacksEnviados as any[]) ?? []}
        checkins={(checkins as any[]) ?? []}
        diarioEntries={(diarioEntries as any[]) ?? []}
      />
    </main>
  );
}

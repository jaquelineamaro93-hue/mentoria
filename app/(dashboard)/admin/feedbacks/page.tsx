import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Star } from 'lucide-react';
import EnviarFeedbackClient from '../EnviarFeedbackClient';

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

  const { data: mentorados } = await supabase
    .from('profiles')
    .select('id, nome')
    .eq('is_admin', false)
    .order('nome');

  const { data: checkins } = await supabase
    .from('checkins_mensais')
    .select('*, profiles(nome, email)')
    .order('created_at', { ascending: false });

  const mediaGeral =
    checkins && checkins.length > 0
      ? (checkins.reduce((soma, c) => soma + c.nota, 0) / checkins.length).toFixed(1)
      : '—';

  return (
    
<main className="max-w-4xl mx-auto w-full">
        <div className="mb-6"><a href="/admin" className="inline-flex items-center gap-2 text-sm text-gray-text hover:text-black transition-colors">← Voltar ao painel</a></div>

      <div className="flex items-start justify-between gap-4 flex-wrap mb-8">
        <div>
          <h1 className="font-display text-3xl text-black mb-1">Feedbacks da Trilha</h1>
          <p className="text-sm text-gray-text">Check-ins mensais enviados pelos mentorados.</p>
        </div>
        <div className="bg-white border border-gray-faint rounded-2xl px-5 py-3 text-center">
          <p className="text-2xl font-display text-black">{mediaGeral}</p>
          <p className="text-xs text-gray-text">nota média geral</p>
        </div>
      </div>

      <div className="mb-10">
        <EnviarFeedbackClient mentorados={mentorados ?? []} />
      </div>

      <h2 className="font-display text-xl text-black mb-4">Check-ins dos mentorados</h2>
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
                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, idx) => (
                    <Star
                      key={idx}
                      size={13}
                      className={idx < c.nota ? 'fill-amber-400 text-amber-400' : 'text-line'}
                    />
                  ))}
                </div>
              </div>
              {c.feedback_texto && (
                <p className="text-sm text-black mb-1">{c.feedback_texto}</p>
              )}
              {c.sugestao_melhoria && (
                <p className="text-xs text-gray-text">
                  Sugestão de melhoria: {c.sugestao_melhoria}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </main>
  );
}

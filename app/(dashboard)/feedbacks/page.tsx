import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { MessageSquare, Paperclip } from 'lucide-react';

export default async function FeedbacksRecebidosPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: feedbacks } = await supabase
    .from('feedback_sessoes')
    .select('id, titulo, conteudo, tipo, arquivo_url, data, created_at')
    .eq('user_id', user.id)
    .order('data', { ascending: false });

  const itens = feedbacks ?? [];

  return (
    <main className="px-6 py-8 md:px-12 md:py-10 w-full">
      <header className="max-w-3xl mb-8">
        <p className="text-xs uppercase tracking-[0.16em] text-mint-deep mb-2">Minha jornada</p>
        <h1 className="font-display text-3xl md:text-4xl text-black mb-2">Feedbacks recebidos</h1>
        <p className="text-sm md:text-base text-gray-text leading-relaxed">
          Aqui fica o histórico completo das devolutivas enviadas pela sua mentora ao longo da jornada.
        </p>
      </header>

      {itens.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-faint bg-white px-6 py-12 text-center">
          <MessageSquare size={28} className="mx-auto text-gray-text mb-3" />
          <p className="text-sm text-gray-text">Você ainda não recebeu feedbacks da mentoria.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {itens.map((feedback) => (
            <Link
              key={feedback.id}
              href={`/feedback/${feedback.id}`}
              className="block rounded-xl border border-gray-faint bg-white p-5 hover:border-mint transition"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-mint-light grid place-items-center shrink-0">
                  {feedback.tipo === 'arquivo' ? (
                    <Paperclip size={17} className="text-mint-deep" />
                  ) : (
                    <MessageSquare size={17} className="text-mint-deep" />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-black">{feedback.titulo}</p>
                    <span className="text-[10px] uppercase tracking-wide text-gray-text">
                      {feedback.tipo === 'feedback'
                        ? 'Feedback'
                        : feedback.tipo === 'nota'
                          ? 'Nota'
                          : 'Arquivo'}
                    </span>
                  </div>

                  <p className="mt-2 text-sm text-black line-clamp-3 whitespace-pre-wrap">
                    {feedback.conteudo}
                  </p>

                  <p className="mt-2 text-xs text-gray-text">
                    {new Date(feedback.data).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}

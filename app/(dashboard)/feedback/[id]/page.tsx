import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';

export default async function FeedbackPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: feedback } = await supabase
    .from('feedback_sessoes')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (!feedback) {
    redirect('/dashboard');
  }

  return (
    <div className="px-6 py-10 md:px-12">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 text-sm font-medium text-gray-text hover:text-black mb-8 transition-colors"
      >
        <ArrowLeft size={16} />
        Voltar ao Dashboard
      </Link>

      <div className="bg-white rounded-xl border border-gray-faint p-8">
        <div className="mb-6">
          <div className="flex items-start justify-between gap-4 mb-2">
            <h1 className="font-display text-3xl text-black">{feedback.titulo}</h1>
            <span className="text-[11px] uppercase tracking-wide text-gray-text px-3 py-1.5 bg-gray-100 rounded-md shrink-0">
              {feedback.tipo === 'feedback' ? 'Feedback' : feedback.tipo === 'nota' ? 'Nota' : 'Arquivo'}
            </span>
          </div>
          <p className="text-sm text-gray-text">
            {new Date(feedback.data).toLocaleDateString('pt-BR', {
              day: '2-digit',
              month: 'long',
              year: 'numeric',
            })}
          </p>
        </div>

        <div className="prose prose-sm">
          <p className="text-base text-black leading-relaxed whitespace-pre-wrap">
            {feedback.conteudo}
          </p>
        </div>
      </div>
    </div>
  );
}

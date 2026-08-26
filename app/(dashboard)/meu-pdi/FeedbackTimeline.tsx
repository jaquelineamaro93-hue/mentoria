'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { MessageSquare, Download } from 'lucide-react';

interface Feedback {
  id: string;
  data: string;
  titulo: string;
  conteudo: string;
  tipo: 'feedback' | 'nota' | 'arquivo';
  arquivo_url?: string;
}

export default function FeedbackTimeline({ userId }: { userId: string }) {
  const supabase = createClient();
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    carregarFeedbacks();
  }, [userId]);

  async function carregarFeedbacks() {
    try {
      const { data } = await supabase
        .from('feedback_sessoes')
        .select('*')
        .eq('user_id', userId)
        .order('data', { ascending: false });

      setFeedbacks(data ?? []);
    } catch (error) {
      console.error('Erro ao carregar feedbacks:', error);
    } finally {
      setCarregando(false);
    }
  }

  if (carregando) return <div className="text-center py-8">Carregando feedbacks...</div>;

  if (feedbacks.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-xl border border-gray-faint border-dashed">
        <MessageSquare size={32} className="mx-auto mb-3 text-gray-text" />
        <p className="text-gray-text mb-2">Nenhum feedback recebido ainda</p>
        <p className="text-xs text-gray-text">Seus feedbacks das sessões aparecerão aqui</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {feedbacks.map((feedback, index) => (
        <div key={feedback.id} className="flex gap-4">
          <div className="flex flex-col items-center">
            <div className="w-4 h-4 rounded-full bg-brown-deep" />
            {index < feedbacks.length - 1 && (
              <div className="w-0.5 h-16 bg-line mt-2 mb-2" />
            )}
          </div>
          
          <div className="flex-1 pb-4">
            <div className="bg-white rounded-lg border border-gray-faint p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h4 className="font-medium text-black">{feedback.titulo}</h4>
                  <p className="text-xs text-gray-text mt-1">
                    {new Date(feedback.data).toLocaleDateString('pt-BR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
                <span className={`text-xs font-medium px-2 py-1 rounded ${
                  feedback.tipo === 'feedback' ? 'bg-blue-50 text-blue-700' :
                  feedback.tipo === 'nota' ? 'bg-amber-50 text-amber-700' :
                  'bg-green-50 text-green-700'
                }`}>
                  {feedback.tipo}
                </span>
              </div>
              
              <p className="text-sm text-black leading-relaxed mb-3">{feedback.conteudo}</p>
              
              {feedback.arquivo_url && (
                <a
                  href={feedback.arquivo_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-xs text-black hover:text-orange font-medium"
                >
                  <Download size={14} />
                  Baixar anexo
                </a>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

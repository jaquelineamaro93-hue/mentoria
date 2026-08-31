'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Edit2, X, Check, Loader2 } from 'lucide-react';

interface FeedbackEnviado {
  id: string;
  user_id: string;
  titulo: string;
  conteudo: string;
  tipo: 'feedback' | 'nota' | 'arquivo';
  data: string;
  nome_mentorado: string;
}

export default function ListarFeedbacksEnviadosClient() {
  const supabase = createClient();
  const [feedbacks, setFeedbacks] = useState<FeedbackEnviado[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [conteudoEditado, setConteudoEditado] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');

  useEffect(() => {
    async function carregarFeedbacks() {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      const { data, error } = await supabase
        .from('feedback_sessoes')
        .select('id, user_id, titulo, conteudo, tipo, data, profiles(nome)')
        .eq('admin_id', user.user.id)
        .order('data', { ascending: false });

      if (error) {
        setErro('Erro ao carregar feedbacks enviados');
        console.error(error);
      } else {
        const feedbacksFormatados = (data || []).map((f: any) => ({
          id: f.id,
          user_id: f.user_id,
          titulo: f.titulo,
          conteudo: f.conteudo,
          tipo: f.tipo,
          data: f.data,
          nome_mentorado: f.profiles?.nome || 'Desconhecido',
        }));
        setFeedbacks(feedbacksFormatados);
      }
      setCarregando(false);
    }

    carregarFeedbacks();
  }, [supabase]);

  async function handleSalvarEdicao(feedbackId: string) {
    setSalvando(true);
    setErro('');

    const { error } = await supabase
      .from('feedback_sessoes')
      .update({ conteudo: conteudoEditado })
      .eq('id', feedbackId);

    setSalvando(false);

    if (error) {
      setErro('Erro ao salvar edição: ' + error.message);
      return;
    }

    setFeedbacks(
      feedbacks.map((f) =>
        f.id === feedbackId ? { ...f, conteudo: conteudoEditado } : f
      )
    );
    setEditandoId(null);
    setConteudoEditado('');
  }

  if (carregando) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-gray-text">Carregando feedbacks enviados...</p>
      </div>
    );
  }

  return (
    <div className="mt-12">
      <h2 className="font-display text-xl text-black mb-4">Feedbacks que Você Enviou</h2>
      {feedbacks.length === 0 ? (
        <p className="text-sm text-gray-text">Você ainda não enviou nenhum feedback.</p>
      ) : (
        <div className="space-y-3">
          {feedbacks.map((feedback) => (
            <div key={feedback.id} className="bg-white border border-gray-faint rounded-xl p-4">
              <div className="flex items-start justify-between gap-4 mb-3 flex-wrap">
                <div className="flex-1">
                  <p className="text-sm font-medium text-black">{feedback.titulo}</p>
                  <p className="text-xs text-gray-text">
                    Para: {feedback.nome_mentorado} •{' '}
                    {new Date(feedback.data).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </p>
                </div>
                <span className="text-[11px] uppercase tracking-wide text-gray-text px-2.5 py-1 bg-gray-100 rounded shrink-0">
                  {feedback.tipo === 'feedback' ? 'Feedback' : feedback.tipo === 'nota' ? 'Nota' : 'Arquivo'}
                </span>
              </div>

              {editandoId === feedback.id ? (
                <div className="space-y-2">
                  <textarea
                    value={conteudoEditado}
                    onChange={(e) => setConteudoEditado(e.target.value)}
                    className="w-full h-24 border border-gray-faint rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brown-deep resize-none"
                  />
                  {erro && (
                    <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded px-2 py-1">
                      {erro}
                    </p>
                  )}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSalvarEdicao(feedback.id)}
                      disabled={salvando || !conteudoEditado.trim()}
                      className="inline-flex items-center gap-1 text-sm bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                    >
                      {salvando ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <Check size={14} />
                      )}
                      Salvar
                    </button>
                    <button
                      onClick={() => {
                        setEditandoId(null);
                        setConteudoEditado('');
                        setErro('');
                      }}
                      className="inline-flex items-center gap-1 text-sm bg-gray-200 hover:bg-gray-300 text-black px-3 py-1.5 rounded-lg transition-colors"
                    >
                      <X size={14} />
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-sm text-black mb-3 whitespace-pre-wrap">{feedback.conteudo}</p>
                  <button
                    onClick={() => {
                      setEditandoId(feedback.id);
                      setConteudoEditado(feedback.conteudo);
                    }}
                    className="inline-flex items-center gap-1 text-sm text-brown-deep hover:text-brown-deep/80 transition-colors"
                  >
                    <Edit2 size={14} />
                    Editar
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

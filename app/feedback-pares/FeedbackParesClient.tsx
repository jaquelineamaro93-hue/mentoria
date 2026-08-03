'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MessageCircle, Send, Loader2, Inbox, Users } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import { Panel, Eyebrow } from '@/components/Panel';
import { createClient } from '@/lib/supabase/client';
import { posthog, limparIdentidade } from '@/lib/posthog';
import type { MentoradoPublico, PeerFeedback, Profile } from '@/lib/types';

interface Props {
  profile: Profile | null;
  userId: string;
  colegas: MentoradoPublico[];
  recebidos: PeerFeedback[];
  enviados: PeerFeedback[];
  nomesPorId: Record<string, string>;
}

export default function FeedbackParesClient({
  profile,
  userId,
  colegas,
  recebidos: recebidosIniciais,
  enviados: enviadosIniciais,
  nomesPorId,
}: Props) {
  const router = useRouter();
  const supabase = createClient();

  const [paraUserId, setParaUserId] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [recebidos, setRecebidos] = useState(recebidosIniciais);
  const [enviados, setEnviados] = useState(enviadosIniciais);
  const [aba, setAba] = useState<'recebidos' | 'enviados'>('recebidos');

  async function handleSignOut() {
    posthog.capture('logout_realizado');
    await supabase.auth.signOut();
    limparIdentidade();
    router.push('/login');
    router.refresh();
  }

  async function enviarFeedback() {
    if (!paraUserId || !mensagem.trim()) return;
    setEnviando(true);
    setErro(null);

    const { data, error } = await supabase
      .from('peer_feedbacks')
      .insert({ de_user_id: userId, para_user_id: paraUserId, mensagem: mensagem.trim() })
      .select()
      .single();

    setEnviando(false);

    if (error) {
      setErro('Não foi possível enviar agora. Tenta de novo em instantes.');
      return;
    }

    setEnviados((prev) => [data, ...prev]);
    setMensagem('');
    setParaUserId('');
    posthog.capture('feedback_par_enviado');
  }

  return (
    <div className="flex flex-col md:flex-row w-full">
      <Sidebar profile={profile} onSignOut={handleSignOut} />

      <main className="flex-1 px-6 py-8 md:px-12 md:py-12 max-w-4xl mx-auto w-full">
        <p className="text-xs uppercase tracking-[0.2em] text-sky-deep mb-2">
          Comunidade
        </p>
        <h1 className="font-display text-3xl text-brown-deep mb-1">
          Feedback entre Colegas
        </h1>
        <p className="text-sm text-ink-faint mb-8">
          A mentoria fica mais rica quando vocês trocam entre si. Deixe um feedback pra
          alguém da turma, sobre o que você percebeu, admirou ou aprendeu com essa pessoa.
        </p>

        <section className="mb-10">
          <Eyebrow>
            <MessageCircle size={13} /> Novo feedback
          </Eyebrow>
          <Panel className="p-6">
            {colegas.length === 0 ? (
              <p className="text-sm text-ink-faint">
                Ainda não tem outras pessoas cadastradas na mentoria para você dar
                feedback. Assim que mais gente entrar, aparece aqui.
              </p>
            ) : (
              <>
                <label className="flex flex-col gap-1.5 mb-4 max-w-xs">
                  <span className="text-xs uppercase tracking-wide text-ink-faint">
                    Para quem
                  </span>
                  <select
                    value={paraUserId}
                    onChange={(e) => setParaUserId(e.target.value)}
                    className="bg-cream border border-line rounded-lg px-4 py-2.5 text-sm text-ink focus:border-sky-deep"
                  >
                    <option value="">Selecione uma colega...</option>
                    {colegas.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nome}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="flex flex-col gap-1.5 mb-4">
                  <span className="text-xs uppercase tracking-wide text-ink-faint">
                    Sua mensagem
                  </span>
                  <textarea
                    value={mensagem}
                    onChange={(e) => setMensagem(e.target.value)}
                    rows={4}
                    placeholder="O que você admira, aprendeu ou percebeu nessa pessoa durante a mentoria?"
                    className="bg-cream border border-line rounded-lg px-4 py-3 text-sm text-ink focus:border-sky-deep resize-none"
                  />
                </label>

                {erro && (
                  <p className="text-sm text-red-700 bg-red-50 border border-red-300 rounded-md px-4 py-2.5 mb-4">
                    {erro}
                  </p>
                )}

                <button
                  onClick={enviarFeedback}
                  disabled={enviando || !paraUserId || !mensagem.trim()}
                  className="flex items-center gap-2 bg-brown hover:bg-brown-deep disabled:opacity-50 text-paper text-sm font-medium px-5 py-2.5 rounded-full transition-colors"
                >
                  {enviando ? (
                    <Loader2 size={15} className="animate-spin" />
                  ) : (
                    <Send size={15} />
                  )}
                  {enviando ? 'Enviando...' : 'Enviar feedback'}
                </button>
              </>
            )}
          </Panel>
        </section>

        <section>
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setAba('recebidos')}
              className={`flex items-center gap-1.5 text-sm px-4 py-1.5 rounded-full border transition-colors ${
                aba === 'recebidos'
                  ? 'bg-sky-tint border-sky text-sky-deep'
                  : 'border-line text-ink-soft bg-paper'
              }`}
            >
              <Inbox size={13} /> Recebidos ({recebidos.length})
            </button>
            <button
              onClick={() => setAba('enviados')}
              className={`flex items-center gap-1.5 text-sm px-4 py-1.5 rounded-full border transition-colors ${
                aba === 'enviados'
                  ? 'bg-sky-tint border-sky text-sky-deep'
                  : 'border-line text-ink-soft bg-paper'
              }`}
            >
              <Users size={13} /> Enviados ({enviados.length})
            </button>
          </div>

          {aba === 'recebidos' ? (
            recebidos.length === 0 ? (
              <Panel className="p-6 text-sm text-ink-faint text-center">
                Você ainda não recebeu nenhum feedback. Que tal ser a primeira a mandar um?
              </Panel>
            ) : (
              <div className="flex flex-col gap-3">
                {recebidos.map((f) => (
                  <Panel key={f.id} className="p-5">
                    <p className="text-xs text-sky-deep uppercase tracking-wide mb-1.5">
                      {nomesPorId[f.de_user_id] ?? 'Alguém da turma'}
                    </p>
                    <p className="text-sm text-ink leading-relaxed">{f.mensagem}</p>
                    <p className="text-xs text-ink-faint mt-2">
                      {new Date(f.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  </Panel>
                ))}
              </div>
            )
          ) : enviados.length === 0 ? (
            <Panel className="p-6 text-sm text-ink-faint text-center">
              Você ainda não enviou nenhum feedback.
            </Panel>
          ) : (
            <div className="flex flex-col gap-3">
              {enviados.map((f) => (
                <Panel key={f.id} className="p-5">
                  <p className="text-xs text-ink-faint uppercase tracking-wide mb-1.5">
                    Para {nomesPorId[f.para_user_id] ?? 'alguém da turma'}
                  </p>
                  <p className="text-sm text-ink leading-relaxed">{f.mensagem}</p>
                  <p className="text-xs text-ink-faint mt-2">
                    {new Date(f.created_at).toLocaleDateString('pt-BR')}
                  </p>
                </Panel>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

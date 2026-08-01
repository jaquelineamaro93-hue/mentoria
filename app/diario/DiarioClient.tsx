'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { NotebookPen, Sparkles, Loader2, Users, User as UserIcon } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import { Panel, Eyebrow } from '@/components/Panel';
import { createClient } from '@/lib/supabase/client';
import { posthog, limparIdentidade } from '@/lib/posthog';
import type { JournalNote, Profile, TipoEncontro } from '@/lib/types';

interface Props {
  profile: Profile | null;
  notes: JournalNote[];
  userId: string;
}

export default function DiarioClient({ profile, notes, userId }: Props) {
  const router = useRouter();
  const supabase = createClient();

  const [anotacoes, setAnotacoes] = useState('');
  const [tipoEncontro, setTipoEncontro] = useState<TipoEncontro>('individual');
  const [encontroData, setEncontroData] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [salvando, setSalvando] = useState(false);
  const [analisandoId, setAnalisandoId] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  async function handleSignOut() {
    posthog.capture('logout_realizado');
    await supabase.auth.signOut();
    limparIdentidade();
    router.push('/login');
    router.refresh();
  }

  async function handleSalvar() {
    if (!anotacoes.trim()) return;
    setSalvando(true);
    setErro(null);

    const { error } = await supabase.from('journal_notes').insert({
      user_id: userId,
      encontro_data: encontroData,
      tipo_encontro: tipoEncontro,
      anotacoes,
    });

    setSalvando(false);

    if (error) {
      posthog.capture('anotacao_diario_falhou');
      setErro('Não foi possível salvar sua anotação agora.');
      return;
    }

    posthog.capture('anotacao_diario_criada', {
      tipo_encontro: tipoEncontro,
      total_anotacoes_anteriores: notes.length,
    });

    setAnotacoes('');
    router.refresh();
  }

  // Espaço reservado para o resumo automático via IA.
  // Basta plugar aqui uma chamada real (ex: Anthropic API) que recebe
  // `anotacoes` e grava o resultado em `ai_summary` na tabela journal_notes.
  async function handleAnalisar(note: JournalNote) {
    setAnalisandoId(note.id);

    await new Promise((resolve) => setTimeout(resolve, 900));

    const resumoSimulado = `Resumo gerado automaticamente a partir da anotação de ${new Date(
      note.encontro_data
    ).toLocaleDateString('pt-BR')}. Conecte este botão à sua chamada de IA preferida para gerar um resumo real.`;

    await supabase
      .from('journal_notes')
      .update({ ai_summary: resumoSimulado })
      .eq('id', note.id);

    setAnalisandoId(null);
    router.refresh();
  }

  return (
    <div className="flex flex-col md:flex-row w-full">
      <Sidebar profile={profile} onSignOut={handleSignOut} />

      <main className="flex-1 px-6 py-8 md:px-12 md:py-12 max-w-4xl mx-auto w-full">
        <div className="mb-10">
          <p className="text-xs uppercase tracking-[0.2em] text-gold-400 mb-2">
            Registro pessoal
          </p>
          <h1 className="font-display text-3xl sm:text-4xl text-cream">Diário de Bordo</h1>
          <p className="text-sm text-cream-faint mt-2">
            Registre aprendizados, dúvidas e sacadas dos seus encontros individuais e em
            grupo.
          </p>
        </div>

        {/* Campo de nova anotação */}
        <section className="mb-10">
          <Eyebrow>
            <NotebookPen size={13} /> Nova anotação
          </Eyebrow>
          <Panel className="p-6">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <label className="flex flex-col gap-1.5 flex-1">
                  <span className="text-xs uppercase tracking-wide text-cream-faint">
                    Data do encontro
                  </span>
                  <input
                    type="date"
                    value={encontroData}
                    onChange={(e) => setEncontroData(e.target.value)}
                    className="bg-panel border border-line rounded-lg px-4 py-2.5 text-sm text-cream focus:border-gold-500"
                  />
                </label>
                <label className="flex flex-col gap-1.5 flex-1">
                  <span className="text-xs uppercase tracking-wide text-cream-faint">
                    Tipo de encontro
                  </span>
                  <select
                    value={tipoEncontro}
                    onChange={(e) => setTipoEncontro(e.target.value as TipoEncontro)}
                    className="bg-panel border border-line rounded-lg px-4 py-2.5 text-sm text-cream focus:border-gold-500"
                  >
                    <option value="individual">Sessão individual</option>
                    <option value="grupo">Encontro em grupo</option>
                  </select>
                </label>
              </div>

              <label className="flex flex-col gap-1.5">
                <span className="text-xs uppercase tracking-wide text-cream-faint">
                  Anotações
                </span>
                <textarea
                  value={anotacoes}
                  onChange={(e) => setAnotacoes(e.target.value)}
                  rows={5}
                  placeholder="O que você aprendeu, quais dúvidas surgiram, quais foram as principais sacadas?"
                  className="bg-panel border border-line rounded-lg px-4 py-3 text-sm text-cream focus:border-gold-500 resize-none"
                />
              </label>

              {erro && (
                <p className="text-sm text-red-300 bg-red-500/10 border border-red-500/30 rounded-md px-4 py-2.5">
                  {erro}
                </p>
              )}

              <button
                onClick={handleSalvar}
                disabled={salvando || !anotacoes.trim()}
                className="self-start bg-gold-400 hover:bg-gold-300 disabled:opacity-60 text-[#100d12] text-sm font-medium px-5 py-2.5 rounded-lg transition-colors"
              >
                {salvando ? 'Salvando...' : 'Salvar anotação'}
              </button>
            </div>
          </Panel>
        </section>

        {/* Histórico */}
        <section>
          <Eyebrow>Histórico</Eyebrow>

          {notes.length === 0 ? (
            <Panel className="p-6 text-sm text-cream-faint">
              Nenhuma anotação ainda. Registre a primeira acima.
            </Panel>
          ) : (
            <div className="flex flex-col gap-4">
              {notes.map((note) => (
                <Panel key={note.id} className="p-6">
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2">
                      <span
                        className={`flex items-center gap-1.5 text-[11px] uppercase tracking-wide px-2 py-1 rounded-full border ${
                          note.tipo_encontro === 'individual'
                            ? 'bg-gold-500/10 border-gold-500/30 text-gold-300'
                            : 'bg-blue-500/10 border-blue-500/30 text-blue-300'
                        }`}
                      >
                        {note.tipo_encontro === 'individual' ? (
                          <UserIcon size={11} />
                        ) : (
                          <Users size={11} />
                        )}
                        {note.tipo_encontro === 'individual' ? 'Individual' : 'Grupo'}
                      </span>
                      <span className="text-xs text-cream-faint">
                        {new Date(note.encontro_data).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  </div>

                  <p className="text-sm text-cream leading-relaxed whitespace-pre-wrap">
                    {note.anotacoes}
                  </p>

                  {note.ai_summary ? (
                    <div className="mt-4 flex gap-2 rounded-lg bg-gold-500/5 border border-gold-500/20 px-4 py-3">
                      <Sparkles size={15} className="text-gold-400 shrink-0 mt-0.5" />
                      <p className="text-sm text-gold-200/90 leading-relaxed">
                        {note.ai_summary}
                      </p>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleAnalisar(note)}
                      disabled={analisandoId === note.id}
                      className="mt-4 flex items-center gap-2 text-xs text-gold-300 hover:text-gold-100 transition-colors disabled:opacity-60"
                    >
                      {analisandoId === note.id ? (
                        <Loader2 size={13} className="animate-spin" />
                      ) : (
                        <Sparkles size={13} />
                      )}
                      {analisandoId === note.id
                        ? 'Analisando...'
                        : 'Gerar resumo com IA'}
                    </button>
                  )}
                </Panel>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

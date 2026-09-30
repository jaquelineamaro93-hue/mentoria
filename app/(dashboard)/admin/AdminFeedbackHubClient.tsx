'use client';

import { useState } from 'react';
import {
  CheckCircle2,
  MessageSquareText,
  NotebookPen,
  Star,
} from 'lucide-react';
import AdminJournalClient from './AdminJournalClient';
import EnviarFeedbackClient from './EnviarFeedbackClient';
import ListarFeedbacksEnviadosClient from './ListarFeedbacksEnviadosClient';

type Fonte = 'diario' | 'mentor' | 'checkins';

interface ProfileOption {
  id: string;
  nome: string;
}

interface DiarioAdminItem {
  id: string;
  user_id: string;
  encontro_data: string;
  tipo_encontro: 'individual' | 'grupo' | 'pessoal' | null;
  anotacoes: string;
  ai_summary: string | null;
  created_at: string;
  profiles?: { nome: string } | { nome: string }[] | null;
}

interface FeedbackEnviado {
  id: string;
  user_id: string;
  titulo: string;
  conteudo: string;
  tipo: 'feedback' | 'nota' | 'arquivo';
  data: string;
  profiles?: { nome: string } | { nome: string }[];
}

interface Checkin {
  id: string;
  user_id: string;
  mes_referencia: string;
  nota: number;
  feedback_texto: string | null;
  sugestao_melhoria: string | null;
  created_at: string;
  profiles?: { nome: string; email?: string | null } | { nome: string; email?: string | null }[] | null;
}

function nomePerfil(profiles?: Checkin['profiles']) {
  if (!profiles) return 'Mentorado';
  return Array.isArray(profiles) ? profiles[0]?.nome || 'Mentorado' : profiles.nome;
}

export default function AdminFeedbackHubClient({
  mentorados,
  feedbacks,
  checkins,
  diarioEntries,
}: {
  mentorados: ProfileOption[];
  feedbacks: FeedbackEnviado[];
  checkins: Checkin[];
  diarioEntries: DiarioAdminItem[];
}) {
  const [fonte, setFonte] = useState<Fonte>('diario');

  const mediaCheckins =
    checkins.length > 0
      ? (checkins.reduce((soma, item) => soma + item.nota, 0) / checkins.length).toFixed(1)
      : '—';

  const cards = [
    {
      id: 'diario' as const,
      numero: '01',
      titulo: 'Diário de Bordo',
      descricao: 'Escrito pelo mentorado sobre sessões, dúvidas, aprendizados e dia a dia.',
      icon: NotebookPen,
      quantidade: diarioEntries.length,
      rodape: `${diarioEntries.length} registro${diarioEntries.length === 1 ? '' : 's'}`,
    },
    {
      id: 'mentor' as const,
      numero: '02',
      titulo: 'Feedbacks do mentor',
      descricao: 'Devolutivas, notas e orientações enviadas pela mentoria ao mentorado.',
      icon: MessageSquareText,
      quantidade: feedbacks.length,
      rodape: `${feedbacks.length} enviado${feedbacks.length === 1 ? '' : 's'}`,
    },
    {
      id: 'checkins' as const,
      numero: '03',
      titulo: 'Check-ins mensais',
      descricao: 'Avaliação periódica do mentorado sobre sua evolução e experiência na mentoria.',
      icon: Star,
      quantidade: checkins.length,
      rodape: `${checkins.length} check-in${checkins.length === 1 ? '' : 's'} · média ${mediaCheckins}`,
    },
  ];

  return (
    <div>
      <div
        className="grid lg:grid-cols-3 gap-3 mb-8"
        role="tablist"
        aria-label="Fontes de acompanhamento do mentorado"
      >
        {cards.map((card) => {
          const Icon = card.icon;
          const ativo = fonte === card.id;

          return (
            <button
              key={card.id}
              type="button"
              role="tab"
              aria-selected={ativo}
              onClick={() => setFonte(card.id)}
              className={`relative text-left rounded-xl border p-5 transition-all ${
                ativo
                  ? 'border-mint-deep bg-mint-light/50 shadow-sm'
                  : 'border-gray-faint bg-white hover:border-mint'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <span
                    className={`w-10 h-10 rounded-lg grid place-items-center shrink-0 ${
                      ativo ? 'bg-mint-deep text-white' : 'bg-[#eef2f6] text-black'
                    }`}
                  >
                    <Icon size={19} strokeWidth={1.7} />
                  </span>

                  <div className="min-w-0">
                    <p className="text-[10px] uppercase tracking-[0.14em] text-gray-text mb-0.5">
                      Fonte {card.numero}
                    </p>
                    <p className="text-sm font-semibold text-black">{card.titulo}</p>
                    <p className="text-xs text-gray-text mt-1 leading-relaxed">
                      {card.descricao}
                    </p>
                  </div>
                </div>

                {card.quantidade > 0 && (
                  <CheckCircle2 size={17} className="text-mint-deep shrink-0" />
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-gray-faint text-xs text-gray-text">
                {card.rodape}
              </div>
            </button>
          );
        })}
      </div>

      <div className="rounded-2xl border border-gray-faint bg-[#fbfcfd] p-4 md:p-6">
        {fonte === 'diario' && (
          <div>
            <div className="mb-5">
              <p className="text-[11px] uppercase tracking-[0.14em] text-mint-deep mb-1">
                Origem: mentorado
              </p>
              <h2 className="font-display text-2xl text-black">Diário de Bordo</h2>
              <p className="text-sm text-gray-text mt-1">
                Registros escritos pelo próprio mentorado. Use como contexto para identificar mudanças,
                dúvidas recorrentes, aprendizados e compromissos.
              </p>
            </div>
            <AdminJournalClient entries={diarioEntries} showHeader={false} />
          </div>
        )}

        {fonte === 'mentor' && (
          <div>
            <div className="mb-6">
              <p className="text-[11px] uppercase tracking-[0.14em] text-mint-deep mb-1">
                Origem: mentoria
              </p>
              <h2 className="font-display text-2xl text-black">Feedbacks do mentor</h2>
              <p className="text-sm text-gray-text mt-1">
                Crie uma devolutiva para o mentorado e consulte o histórico do que já foi enviado.
              </p>
            </div>

            <div className="mb-8">
              <EnviarFeedbackClient mentorados={mentorados} />
            </div>

            <ListarFeedbacksEnviadosClient feedbacks={feedbacks} />
          </div>
        )}

        {fonte === 'checkins' && (
          <div>
            <div className="flex items-start justify-between gap-4 flex-wrap mb-6">
              <div>
                <p className="text-[11px] uppercase tracking-[0.14em] text-mint-deep mb-1">
                  Origem: mentorado
                </p>
                <h2 className="font-display text-2xl text-black">Check-ins mensais</h2>
                <p className="text-sm text-gray-text mt-1">
                  Avaliações periódicas sobre evolução, experiência na mentoria e sugestões de melhoria.
                </p>
              </div>

              <div className="bg-white border border-gray-faint rounded-xl px-4 py-2.5 text-center min-w-[92px]">
                <p className="font-display text-2xl text-black">{mediaCheckins}</p>
                <p className="text-[11px] text-gray-text">média geral</p>
              </div>
            </div>

            {checkins.length === 0 ? (
              <div className="bg-white border border-gray-faint rounded-xl p-5 text-sm text-gray-text">
                Nenhum check-in registrado ainda.
              </div>
            ) : (
              <div className="space-y-3">
                {checkins.map((checkin) => (
                  <article key={checkin.id} className="bg-white border border-gray-faint rounded-xl p-5">
                    <div className="flex items-start justify-between gap-4 flex-wrap mb-3">
                      <div>
                        <p className="text-sm font-medium text-black">{nomePerfil(checkin.profiles)}</p>
                        <p className="text-xs text-gray-text mt-0.5">
                          {new Date(checkin.mes_referencia + 'T12:00:00').toLocaleDateString('pt-BR', {
                            month: 'long',
                            year: 'numeric',
                          })}
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-[10px] uppercase tracking-wide rounded-full border border-mint bg-mint-light px-2.5 py-1 text-black">
                          Check-in mensal
                        </span>
                        <div className="flex items-center gap-1" aria-label={`${checkin.nota} de 5`}>
                          {Array.from({ length: 5 }).map((_, index) => (
                            <Star
                              key={index}
                              size={13}
                              className={
                                index < checkin.nota
                                  ? 'fill-amber-400 text-amber-400'
                                  : 'text-line'
                              }
                            />
                          ))}
                        </div>
                      </div>
                    </div>

                    {checkin.feedback_texto && (
                      <p className="text-sm text-black leading-relaxed whitespace-pre-wrap">
                        {checkin.feedback_texto}
                      </p>
                    )}

                    {checkin.sugestao_melhoria && (
                      <div className="mt-3 rounded-lg bg-[#f7f8f9] border border-gray-faint px-4 py-3">
                        <p className="text-[10px] uppercase tracking-wide text-gray-text mb-1">
                          Sugestão de melhoria
                        </p>
                        <p className="text-sm text-black">{checkin.sugestao_melhoria}</p>
                      </div>
                    )}
                  </article>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { GripVertical, X, Zap, Plus } from 'lucide-react';
import { Panel, Eyebrow } from '@/components/Panel';

interface Vaga {
  id: string;
  empresa: string;
  cargo: string;
  etapa: string;
  fit_score: number | null;
  descricao_vaga: string | null;
  link_vaga: string | null;
  proximo_passo: string | null;
  observacoes: string | null;
}

interface Props {
  vagas: Vaga[];
  onVagaAtualizada: () => void;
}

const ETAPAS = [
  { id: 'para_aplicar', label: 'Para Aplicar', bg: 'bg-cream', border: 'border-line' },
  { id: 'aplicada', label: 'Aplicada', bg: 'bg-sky-tint', border: 'border-sky' },
  { id: 'entrevista_agendada', label: 'Entrevista Agendada', bg: 'bg-sky-tint', border: 'border-sky' },
  { id: 'aguardando_retorno', label: 'Aguardando Retorno', bg: 'bg-sky-tint', border: 'border-sky' },
  { id: 'entrevista_decisor', label: 'Entrevista c/ Decisor', bg: 'bg-sky-tint', border: 'border-sky-deep' },
  { id: 'case', label: 'Case', bg: 'bg-cream', border: 'border-brown' },
  { id: 'oferta', label: 'Oferta', bg: 'bg-sky-tint', border: 'border-sky-deep' },
  { id: 'lost', label: 'Lost', bg: 'bg-cream', border: 'border-line' },
];

export default function KanbanTab({ vagas, onVagaAtualizada }: Props) {
  const [draggedVaga, setDraggedVaga] = useState<Vaga | null>(null);
  const [modalVaga, setModalVaga] = useState<Vaga | null>(null);
  const [atualizando, setAtualizando] = useState(false);

  async function moveVaga(vaga: Vaga, novaEtapa: string) {
    setAtualizando(true);
    try {
      const res = await fetch(`/api/vagas/${vaga.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ etapa: novaEtapa }),
      });

      if (res.ok) {
        onVagaAtualizada();
      }
    } catch (erro) {
      console.error('Erro ao mover vaga:', erro);
    } finally {
      setAtualizando(false);
    }
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }

  function handleDrop(e: React.DragEvent, etapa: string) {
    e.preventDefault();
    if (draggedVaga) {
      moveVaga(draggedVaga, etapa);
      setDraggedVaga(null);
    }
  }

  return (
    <div>
      <Eyebrow>
        <Zap size={14} />
        Jornada de Candidaturas
      </Eyebrow>
      <h2 className="font-display text-3xl text-brown-deep mb-8">Kanban</h2>

      <div className="overflow-x-auto pb-4 border border-line rounded-lg bg-paper">
        <div className="flex gap-4 p-4 min-w-max">
          {ETAPAS.map((etapa) => {
            const vagasEtapa = vagas.filter((v) => v.etapa === etapa.id);

            return (
              <div
                key={etapa.id}
                className={`flex-shrink-0 w-72 ${etapa.bg} rounded-xl p-4 border-2 ${etapa.border}`}
              >
                <div className="mb-4">
                  <h3 className="font-medium text-brown-deep">{etapa.label}</h3>
                  <p className="text-xs text-ink-faint mt-1">{vagasEtapa.length} vaga{vagasEtapa.length !== 1 ? 's' : ''}</p>
                </div>

                <div
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, etapa.id)}
                  className="space-y-3 min-h-[400px] rounded-lg border-2 border-dashed border-line p-3"
                >
                  {vagasEtapa.length === 0 ? (
                    <div className="text-center text-ink-faint text-sm py-12">
                      Nenhuma vaga
                    </div>
                  ) : (
                    vagasEtapa.map((vaga) => (
                      <div
                        key={vaga.id}
                        draggable
                        onDragStart={() => setDraggedVaga(vaga)}
                        onDragEnd={() => setDraggedVaga(null)}
                        onClick={() => setModalVaga(vaga)}
                        className="bg-paper p-3 rounded-lg border border-line cursor-move hover:shadow-md hover:border-sky transition group"
                      >
                        <div className="flex items-start gap-2">
                          <GripVertical className="w-4 h-4 text-ink-faint mt-0.5 flex-shrink-0 opacity-40" />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-ink truncate text-sm">
                              {vaga.cargo}
                            </p>
                            <p className="text-xs text-ink-soft truncate">{vaga.empresa}</p>
                            {vaga.fit_score !== null && (
                              <div className="mt-2 inline-block bg-sky-tint border border-sky text-sky-deep px-2 py-1 rounded-full text-xs font-bold">
                                {vaga.fit_score}% fit
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {modalVaga && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Panel className="max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-line">
            <div className="sticky top-0 bg-paper border-b border-line p-6 flex items-start justify-between">
              <div>
                <h2 className="font-display text-2xl text-brown-deep">{modalVaga.cargo}</h2>
                <p className="text-ink-soft text-sm mt-1">{modalVaga.empresa}</p>
              </div>
              <button
                onClick={() => setModalVaga(null)}
                className="text-ink-faint hover:text-ink transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {modalVaga.fit_score !== null && (
                <Panel className="p-4 bg-sky-tint border border-sky">
                  <p className="text-sm text-sky-deep font-medium">Compatibilidade</p>
                  <p className="text-4xl font-display text-sky-deep mt-1">{modalVaga.fit_score}%</p>
                </Panel>
              )}

              {modalVaga.descricao_vaga && (
                <div>
                  <h3 className="font-medium text-brown-deep mb-2">Descrição da Vaga</h3>
                  <p className="text-ink whitespace-pre-wrap text-sm leading-relaxed">
                    {modalVaga.descricao_vaga}
                  </p>
                </div>
              )}

              {modalVaga.link_vaga && (
                <div>
                  <h3 className="font-medium text-brown-deep mb-2">Link da Vaga</h3>
                  <a
                    href={modalVaga.link_vaga}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sky-deep hover:text-sky-deep/80 underline break-all text-sm"
                  >
                    {modalVaga.link_vaga}
                  </a>
                </div>
              )}

              {modalVaga.proximo_passo && (
                <div>
                  <h3 className="font-medium text-brown-deep mb-2">Próximo Passo</h3>
                  <p className="text-ink text-sm">{modalVaga.proximo_passo}</p>
                </div>
              )}

              {modalVaga.observacoes && (
                <div>
                  <h3 className="font-medium text-brown-deep mb-2">Observações</h3>
                  <p className="text-ink text-sm">{modalVaga.observacoes}</p>
                </div>
              )}
            </div>
          </Panel>
        </div>
      )}
    </div>
  );
}

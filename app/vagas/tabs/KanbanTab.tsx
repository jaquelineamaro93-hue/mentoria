'use client';

import { useState } from 'react';
import { GripVertical, X } from 'lucide-react';

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
  { id: 'para_aplicar', label: 'Para Aplicar', cor: 'bg-red-50' },
  { id: 'aplicada', label: 'Aplicada', cor: 'bg-orange-50' },
  { id: 'entrevista_agendada', label: 'Entrevista Agendada', cor: 'bg-yellow-50' },
  { id: 'aguardando_retorno', label: 'Aguardando Retorno', cor: 'bg-blue-50' },
  { id: 'entrevista_decisor', label: 'Entrevista c/ Decisor', cor: 'bg-purple-50' },
  { id: 'case', label: 'Case', cor: 'bg-pink-50' },
  { id: 'oferta', label: 'Oferta', cor: 'bg-green-50' },
  { id: 'lost', label: 'Lost', cor: 'bg-gray-50' },
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
      <h2 className="text-xl font-bold mb-6">Kanban de Candidaturas</h2>

      <div className="overflow-x-auto pb-4">
        <div className="flex gap-4 min-w-max">
          {ETAPAS.map((etapa) => {
            const vagasEtapa = vagas.filter((v) => v.etapa === etapa.id);

            return (
              <div
                key={etapa.id}
                className={`flex-shrink-0 w-80 ${etapa.cor} rounded-lg p-4 border border-gray-200`}
              >
                {/* Header */}
                <div className="mb-4">
                  <h3 className="font-bold text-gray-900">{etapa.label}</h3>
                  <p className="text-sm text-gray-600">{vagasEtapa.length} vagas</p>
                </div>

                {/* Zona de drop */}
                <div
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, etapa.id)}
                  className="space-y-3 min-h-[400px] rounded border-2 border-dashed border-gray-300 p-3"
                >
                  {vagasEtapa.length === 0 ? (
                    <div className="text-center text-gray-500 text-sm py-12">
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
                        className="bg-white p-3 rounded border border-gray-200 cursor-move hover:shadow-md hover:border-gray-300 transition group"
                      >
                        <div className="flex items-start gap-2">
                          <GripVertical className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-900 truncate">
                              {vaga.cargo}
                            </p>
                            <p className="text-sm text-gray-600 truncate">{vaga.empresa}</p>
                            {vaga.fit_score !== null && (
                              <div className="mt-2 inline-block bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-bold">
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

      {/* Modal de detalhes */}
      {modalVaga && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{modalVaga.cargo}</h2>
                <p className="text-gray-600">{modalVaga.empresa}</p>
              </div>
              <button
                onClick={() => setModalVaga(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Fit Score */}
              {modalVaga.fit_score !== null && (
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-600 font-medium">Compatibilidade</p>
                  <p className="text-3xl font-bold text-blue-600">{modalVaga.fit_score}%</p>
                </div>
              )}

              {/* Descrição */}
              {modalVaga.descricao_vaga && (
                <div>
                  <h3 className="font-bold text-gray-900 mb-2">Descrição da Vaga</h3>
                  <p className="text-gray-700 whitespace-pre-wrap text-sm">
                    {modalVaga.descricao_vaga}
                  </p>
                </div>
              )}

              {/* Link */}
              {modalVaga.link_vaga && (
                <div>
                  <h3 className="font-bold text-gray-900 mb-2">Link da Vaga</h3>
                  <a
                    href={modalVaga.link_vaga}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline break-all"
                  >
                    {modalVaga.link_vaga}
                  </a>
                </div>
              )}

              {/* Próximo Passo */}
              {modalVaga.proximo_passo && (
                <div>
                  <h3 className="font-bold text-gray-900 mb-2">Próximo Passo</h3>
                  <p className="text-gray-700 text-sm">{modalVaga.proximo_passo}</p>
                </div>
              )}

              {/* Observações */}
              {modalVaga.observacoes && (
                <div>
                  <h3 className="font-bold text-gray-900 mb-2">Observações</h3>
                  <p className="text-gray-700 text-sm">{modalVaga.observacoes}</p>
                </div>
              )}

              <button
                onClick={() => setModalVaga(null)}
                className="w-full bg-gray-200 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-300 transition"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

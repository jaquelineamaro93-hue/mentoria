'use client';

import { useState, useEffect } from 'react';
import { CheckCircle2, Circle, AlertCircle } from 'lucide-react';

interface RoadmapItem {
  tipo: 'skill' | 'project' | 'course';
  titulo: string;
  descricao: string;
  semanas: number;
  prioridade: 'high' | 'medium' | 'low';
  recursos: string[];
}

interface Roadmap {
  id: string;
  readiness_score: number;
  readiness_gap: number;
  weeks_to_ready: number;
  estimated_readiness_date: string;
  roadmap_items: RoadmapItem[];
  progress_percentage: number;
  items_completed: number;
  total_items: number;
}

interface Props {
  vagaId: string;
}

export default function PreparacaoTab({ vagaId }: Props) {
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
  const [loading, setLoading] = useState(true);
  const [completedItems, setCompletedItems] = useState<Set<number>>(new Set());
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    carregarRoadmap();
  }, [vagaId]);

  async function carregarRoadmap() {
    try {
      setLoading(true);
      const res = await fetch(`/api/vagas/readiness?vaga_id=${vagaId}`);

      if (res.ok) {
        const data = await res.json();
        setRoadmap(data.roadmap);
      } else if (res.status !== 404) {
        setErro('Erro ao carregar roadmap');
      }
    } catch (err) {
      setErro('Erro ao carregar roadmap');
    } finally {
      setLoading(false);
    }
  }

  async function toggleItemCompletion(itemIndex: number) {
    if (!roadmap) return;

    const isCompleted = completedItems.has(itemIndex);
    const newCompleted = new Set(completedItems);

    if (isCompleted) {
      newCompleted.delete(itemIndex);
    } else {
      newCompleted.add(itemIndex);
    }

    setCompletedItems(newCompleted);

    try {
      await fetch('/api/vagas/readiness/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roadmap_id: roadmap.id,
          item_index: itemIndex,
          completed: !isCompleted,
        }),
      });
    } catch (err) {
      console.error('Erro ao atualizar progresso:', err);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-gray-500">Carregando roadmap...</div>
      </div>
    );
  }

  if (!roadmap) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex gap-2">
          <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-yellow-900">Roadmap não gerado</p>
            <p className="text-sm text-yellow-700">
              Analise essa vaga com IA para gerar um roadmap personalizado de preparação.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (erro) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
        {erro}
      </div>
    );
  }

  const progressPercentage = (completedItems.size / roadmap.total_items) * 100;
  const readinessIncrease = (completedItems.size / roadmap.total_items) * roadmap.readiness_gap;
  const projectedFinalScore = roadmap.readiness_score + readinessIncrease;

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
          <div className="text-sm text-gray-600 mb-1">Prontidão Atual</div>
          <div className="text-3xl font-bold text-purple-600 mb-1">{roadmap.readiness_score}%</div>
          <div className="text-xs text-gray-600">
            {Math.round(roadmap.readiness_gap)}% até estar 100% pronto
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
          <div className="text-sm text-gray-600 mb-1">Tempo de Preparação</div>
          <div className="text-3xl font-bold text-blue-600 mb-1">{roadmap.weeks_to_ready}w</div>
          <div className="text-xs text-gray-600">
            Até {new Date(roadmap.estimated_readiness_date).toLocaleDateString('pt-BR')}
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
          <div className="text-sm text-gray-600 mb-1">Progresso</div>
          <div className="text-3xl font-bold text-green-600 mb-1">
            {completedItems.size}/{roadmap.total_items}
          </div>
          <div className="text-xs text-gray-600">Items concluídos</div>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between items-end">
          <div>
            <h3 className="font-medium text-gray-900">Progresso Geral</h3>
            <p className="text-sm text-gray-600">
              Prontidão projetada: {Math.round(projectedFinalScore)}% com todos os items
            </p>
          </div>
          <span className="text-sm font-medium text-gray-700">{Math.round(progressPercentage)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className="bg-gradient-to-r from-green-500 to-green-600 h-3 rounded-full transition-all duration-300"
            style={{ width: `${Math.min(progressPercentage, 100)}%` }}
          />
        </div>
      </div>

      {['high', 'medium', 'low'].map((priority) => {
        const items = roadmap.roadmap_items.filter((item) => item.prioridade === priority);
        if (items.length === 0) return null;

        const priorityLabel =
          priority === 'high' ? '🔴 Alta Prioridade' : priority === 'medium' ? '🟡 Média Prioridade' : '🟢 Baixa Prioridade';
        const bgColor =
          priority === 'high' ? 'bg-red-50' : priority === 'medium' ? 'bg-yellow-50' : 'bg-green-50';
        const borderColor =
          priority === 'high' ? 'border-red-200' : priority === 'medium' ? 'border-yellow-200' : 'border-green-200';

        return (
          <div key={priority}>
            <h3 className="font-bold text-gray-900 mb-3">{priorityLabel}</h3>
            <div className="space-y-2">
              {items.map((item, idx) => {
                const itemIndex = roadmap.roadmap_items.indexOf(item);
                const isCompleted = completedItems.has(itemIndex);

                return (
                  <div
                    key={idx}
                    className={`p-4 rounded-lg border cursor-pointer transition ${bgColor} ${borderColor} ${
                      isCompleted ? 'opacity-60' : ''
                    }`}
                    onClick={() => toggleItemCompletion(itemIndex)}
                  >
                    <div className="flex gap-3 items-start">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleItemCompletion(itemIndex);
                        }}
                        className="mt-1 flex-shrink-0"
                      >
                        {isCompleted ? (
                          <CheckCircle2 className="w-6 h-6 text-green-600" />
                        ) : (
                          <Circle className="w-6 h-6 text-gray-400" />
                        )}
                      </button>

                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start gap-2 mb-1">
                          <h4
                            className={`font-medium ${isCompleted ? 'line-through text-gray-600' : 'text-gray-900'}`}
                          >
                            {item.titulo}
                          </h4>
                          <span className="text-xs px-2 py-1 bg-gray-200 text-gray-700 rounded whitespace-nowrap">
                            {item.semanas}w
                          </span>
                        </div>

                        <p className={`text-sm mb-2 ${isCompleted ? 'line-through text-gray-500' : 'text-gray-700'}`}>
                          {item.descricao}
                        </p>

                        <div className="flex flex-wrap gap-2">
                          <span
                            className={`text-xs px-2 py-1 rounded ${
                              item.tipo === 'skill'
                                ? 'bg-blue-100 text-blue-700'
                                : item.tipo === 'project'
                                  ? 'bg-purple-100 text-purple-700'
                                  : 'bg-orange-100 text-orange-700'
                            }`}
                          >
                            {item.tipo === 'skill' ? '💡' : item.tipo === 'project' ? '🏗️' : '📚'}{' '}
                            {item.tipo === 'skill' ? 'Skill' : item.tipo === 'project' ? 'Project' : 'Course'}
                          </span>
                          {item.recursos.map((recurso, ridx) => (
                            <span key={ridx} className="text-xs px-2 py-1 bg-gray-200 text-gray-700 rounded">
                              {recurso}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {completedItems.size === roadmap.total_items && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-green-900">Parabéns! 🎉</p>
              <p className="text-sm text-green-700">
                Você completou todos os items de preparação e está {Math.round(projectedFinalScore)}% pronto para essa vaga!
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

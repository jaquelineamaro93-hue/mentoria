'use client';

import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { MapPin, Zap, ArrowRight } from 'lucide-react';
import posthog from 'posthog-js';

export default function ExerciciosPage() {
  const exercises = [
    {
      id: 'mapa-quem-sou',
      title: 'Mapa de Quem Sou Eu',
      description: 'Jornada de 9 blocos para descobrir seus valores, potências, feridas, ciclos, chamados, contribuição, paixões, habilidades e presença.',
      duration: '~2 horas',
      icon: '🗺️',
      status: 'completed', // 'not_started', 'in_progress', 'completed'
      completedAt: '12/07/2024',
    },
    {
      id: 'teste-personalidade',
      title: 'Teste de Personalidade Profissional',
      description: 'Descubra seu arquétipo profissional e estilo de trabalho através de um teste interativo customizado para carreira.',
      duration: '~30 min',
      icon: '🎯',
      status: 'not_started',
    },
  ];

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Exercícios de Desenvolvimento</h1>
        <p className="text-gray-600 mt-2">Ferramentas para autoconhecimento e evolução profissional</p>
      </div>

      {/* Grid de Exercícios */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {exercises.map((exercise) => (
          <Card key={exercise.id} className="p-8 hover:shadow-lg transition flex flex-col">
            <div className="flex items-start justify-between mb-4">
              <span className="text-4xl">{exercise.icon}</span>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                exercise.status === 'completed' ? 'bg-green-100 text-green-800' :
                exercise.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {exercise.status === 'completed' ? '✓ Concluído' :
                 exercise.status === 'in_progress' ? 'Em Progresso' :
                 'Não iniciado'}
              </span>
            </div>

            <h3 className="text-xl font-bold text-gray-900 mb-2">{exercise.title}</h3>
            <p className="text-gray-600 text-sm flex-1 mb-4">{exercise.description}</p>

            <div className="mb-6 pt-4 border-t border-gray-200">
              <p className="text-gray-600 text-sm">
                ⏱️ Tempo estimado: {exercise.duration}
              </p>
              {exercise.completedAt && (
                <p className="text-gray-600 text-sm">
                  ✓ Completado em: {exercise.completedAt}
                </p>
              )}
            </div>

            <Link
              href={`/exercicios/${exercise.id}`}
              onClick={() => posthog.capture('exercise_opened', {
                exercise_id: exercise.id,
                exercise_status: exercise.status,
              })}
            >
              <button className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium flex items-center justify-center space-x-2 group">
                <span>{exercise.status === 'completed' ? 'Revisar' : 'Começar'}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
              </button>
            </Link>
          </Card>
        ))}
      </div>

      {/* Próximos Exercícios */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Breve - Em Desenvolvimento</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-8 opacity-50">
            <span className="text-4xl mb-4 block">📊</span>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Análise de Força de Carreira</h3>
            <p className="text-gray-600 text-sm">Matriz 2x2 com forças, fraquezas, oportunidades e ameaças na sua jornada</p>
            <p className="text-gray-500 text-sm mt-4">Em breve...</p>
          </Card>

          <Card className="p-8 opacity-50">
            <span className="text-4xl mb-4 block">🎯</span>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Planejamento de 90 Dias</h3>
            <p className="text-gray-600 text-sm">Estruture seus objetivos e ações para os próximos 3 meses</p>
            <p className="text-gray-500 text-sm mt-4">Em breve...</p>
          </Card>
        </div>
      </div>
    </div>
  );
}

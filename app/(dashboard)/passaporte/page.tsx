'use client';

import { Card } from '@/components/ui/card';
import { Trophy, Star, Zap, Users } from 'lucide-react';

export default function PassaportePage() {
  const achievements = [
    {
      id: 1,
      name: 'Primeiro Passo',
      description: 'Completou seu primeiro exercício',
      icon: '🎯',
      category: 'completion',
      points: 50,
      unlockedAt: '12/07/2024',
    },
    {
      id: 2,
      name: 'Autoconhecimento',
      description: 'Completou o Mapa de Quem Sou Eu',
      icon: '🗺️',
      category: 'growth',
      points: 100,
      unlockedAt: '15/07/2024',
    },
    {
      id: 3,
      name: 'Jornalista',
      description: 'Fez 5 registros no diário de bordo',
      icon: '📔',
      category: 'consistency',
      points: 75,
      unlockedAt: '20/07/2024',
    },
    {
      id: 4,
      name: 'Comunicador Ativo',
      description: 'Fez 2 sessões de feedback com mentor',
      icon: '💬',
      category: 'community',
      points: 80,
      locked: true,
    },
    {
      id: 5,
      name: 'Maestro da Evolução',
      description: 'Aumentou 2 níveis em uma habilidade',
      icon: '📈',
      category: 'growth',
      points: 150,
      locked: true,
    },
  ];

  const categories = [
    { name: 'Completion', icon: '🎯', color: 'blue' },
    { name: 'Growth', icon: '📈', color: 'green' },
    { name: 'Consistency', icon: '⭐', color: 'yellow' },
    { name: 'Community', icon: '👥', color: 'purple' },
  ];

  const totalPoints = achievements.filter(a => !a.locked).reduce((sum, a) => sum + a.points, 0);
  const unlockedCount = achievements.filter(a => !a.locked).length;

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Seu Passaporte</h1>
        <p className="text-gray-600 mt-2">Desbloqueie achievements e ganhe pontos na sua jornada</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6">
          <p className="text-gray-600 text-sm">Achievements Desbloqueados</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{unlockedCount}</p>
          <p className="text-gray-600 text-sm mt-1">de {achievements.length}</p>
        </Card>

        <Card className="p-6">
          <p className="text-gray-600 text-sm">Pontos Ganhos</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{totalPoints}</p>
          <p className="text-gray-600 text-sm mt-1">Resgatáveis na loja</p>
        </Card>

        <Card className="p-6">
          <p className="text-gray-600 text-sm">Progresso</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{Math.round((unlockedCount / achievements.length) * 100)}%</p>
          <p className="text-gray-600 text-sm mt-1">Da jornada</p>
        </Card>
      </div>

      {/* Categories */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Categorias de Achievements</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {categories.map((cat) => (
            <Card key={cat.name} className="p-4 text-center">
              <span className="text-4xl mb-2 block">{cat.icon}</span>
              <p className="font-semibold text-gray-900 text-sm">{cat.name}</p>
            </Card>
          ))}
        </div>
      </div>

      {/* Achievements Grid */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Seus Achievements</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {achievements.map((achievement) => (
            <Card
              key={achievement.id}
              className={`p-6 ${achievement.locked ? 'opacity-50' : ''}`}
            >
              <div className="text-center">
                <span className={`text-5xl mb-3 block ${achievement.locked ? 'grayscale' : ''}`}>
                  {achievement.icon}
                </span>
                <h3 className="font-bold text-gray-900">{achievement.name}</h3>
                <p className="text-gray-600 text-sm mt-2">{achievement.description}</p>

                <div className="mt-4 pt-4 border-t border-gray-200">
                  {achievement.locked ? (
                    <p className="text-gray-500 text-sm font-semibold">🔒 Bloqueado</p>
                  ) : (
                    <div className="space-y-1">
                      <p className="text-blue-600 font-bold">+{achievement.points} pontos</p>
                      <p className="text-gray-600 text-xs">Desbloqueado em {achievement.unlockedAt}</p>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Progress to Next */}
      <Card className="p-6 bg-purple-50 border-purple-200">
        <h3 className="font-bold text-purple-900 mb-4">Próximos Achievements Próximos</h3>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between mb-2">
              <span className="font-semibold text-purple-900">Comunicador Ativo</span>
              <span className="text-purple-600 text-sm">1 de 2 sessões</span>
            </div>
            <div className="w-full h-2 bg-purple-200 rounded-full overflow-hidden">
              <div className="h-full w-1/2 bg-purple-600"></div>
            </div>
          </div>

          <div>
            <div className="flex justify-between mb-2">
              <span className="font-semibold text-purple-900">Maestro da Evolução</span>
              <span className="text-purple-600 text-sm">+1.2 de +2.0 níveis</span>
            </div>
            <div className="w-full h-2 bg-purple-200 rounded-full overflow-hidden">
              <div className="h-full w-3/5 bg-purple-600"></div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

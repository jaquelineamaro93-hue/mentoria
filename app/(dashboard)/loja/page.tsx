'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { ShoppingBag, Lock } from 'lucide-react';
import posthog from 'posthog-js';

export default function LojaPage() {
  const [userPoints] = useState(210);

  const rewards = [
    {
      id: 1,
      name: 'Sessão Individual Extra (30 min)',
      description: 'Uma sessão adicional de 30 minutos com mentoria',
      cost: 150,
      category: 'sessao',
      icon: '📞',
    },
    {
      id: 2,
      name: 'E-book: Estruturando sua Carreira',
      description: 'Guia completo com framework de desenvolvimento profissional',
      cost: 50,
      category: 'recurso',
      icon: '📚',
    },
    {
      id: 3,
      name: 'Consultoria de Estratégia (1h)',
      description: 'Uma sessão especializada de estratégia de carreira',
      cost: 200,
      category: 'consultoria',
      icon: '🎯',
    },
    {
      id: 4,
      name: 'Acesso ao Programa Premium (1 mês)',
      description: 'Acesso a conteúdos exclusivos e comunidade premium',
      cost: 180,
      category: 'badge',
      icon: '👑',
    },
    {
      id: 5,
      name: 'Análise de Perfil Aprofundada',
      description: 'Relatório customizado com insights de desenvolvimento',
      cost: 120,
      category: 'recurso',
      icon: '📊',
    },
    {
      id: 6,
      name: 'Pack 3 Sessões Mensais (3 meses)',
      description: 'Desconto especial: 3 sessões por 3 meses',
      cost: 400,
      category: 'sessao',
      icon: '📅',
    },
  ];

  const handleRedeem = (reward: any) => {
    if (userPoints >= reward.cost) {
      alert(`✓ Resgaste de "${reward.name}" processado!\n\nVocê receberá em breve!`);
      posthog.capture('reward_redeemed', {
        reward_id: reward.id,
        reward_category: reward.category,
        points_spent: reward.cost,
      });
    }
  };

  const categoryLabels = {
    sessao: '📞 Sessões',
    recurso: '📚 Recursos',
    consultoria: '🎯 Consultoria',
    badge: '👑 Premium',
  };

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Loja de Pontos</h1>
        <p className="text-gray-600 mt-2">Use seus pontos para desbloquear benefícios exclusivos</p>
      </div>

      {/* Saldo de Pontos */}
      <Card className="p-8 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-blue-100">Seus Pontos Disponíveis</p>
            <p className="text-5xl font-bold mt-2">{userPoints}</p>
          </div>
          <ShoppingBag className="w-16 h-16 opacity-20" />
        </div>
      </Card>

      {/* Filtros por categoria */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Todas as Recompensas</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rewards.map((reward) => {
            const canBuy = userPoints >= reward.cost;

            return (
              <Card key={reward.id} className={`p-6 flex flex-col ${!canBuy ? 'opacity-60' : ''}`}>
                <div className="flex items-start justify-between mb-3">
                  <span className="text-4xl">{reward.icon}</span>
                  <span className="text-xs font-semibold text-gray-600 bg-gray-100 px-2 py-1 rounded">
                    {categoryLabels[reward.category as keyof typeof categoryLabels]}
                  </span>
                </div>

                <h3 className="font-bold text-gray-900 text-lg mb-2">{reward.name}</h3>
                <p className="text-gray-600 text-sm flex-1 mb-4">{reward.description}</p>

                <div className="border-t border-gray-200 pt-4">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-2xl font-bold text-yellow-600">{reward.cost}</span>
                    <span className="text-gray-600 text-sm">pontos</span>
                  </div>

                  <button
                    onClick={() => handleRedeem(reward)}
                    disabled={!canBuy}
                    className={`w-full py-3 rounded-lg font-semibold transition ${
                      canBuy
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-gray-200 text-gray-600 cursor-not-allowed'
                    }`}
                  >
                    {canBuy ? 'Resgatar' : `Faltam ${reward.cost - userPoints}`}
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Info */}
      <Card className="p-6 bg-amber-50 border-amber-200">
        <h3 className="font-bold text-amber-900 mb-3">Como Ganhar Mais Pontos?</h3>
        <ul className="text-amber-900 text-sm space-y-2">
          <li>✓ Complete exercícios e desafios na plataforma</li>
          <li>✓ Participe de sessões em grupo</li>
          <li>✓ Mantenha consistência (registros diários)</li>
          <li>✓ Desbloqueie achievements</li>
          <li>✓ Indique amigos para a mentoria</li>
        </ul>
      </Card>

      {/* Histórico */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Seus Resgates</h2>
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-4 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">📚</span>
                <div>
                  <p className="font-semibold text-gray-900">E-book: Estruturando Carreira</p>
                  <p className="text-gray-600 text-sm">Resgatado há 5 dias</p>
                </div>
              </div>
              <span className="text-yellow-600 font-bold">-50</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">📞</span>
                <div>
                  <p className="font-semibold text-gray-900">Sessão Individual Extra</p>
                  <p className="text-gray-600 text-sm">Resgatado há 10 dias</p>
                </div>
              </div>
              <span className="text-yellow-600 font-bold">-150</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

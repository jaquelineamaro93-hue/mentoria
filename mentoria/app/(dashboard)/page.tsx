'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart3, Calendar, BookOpen, PenTool, TrendingUp, Trophy, Zap } from 'lucide-react';
import Link from 'next/link';

export default function Dashboard() {
  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Bem-vindo à sua Jornada</h1>
        <p className="text-gray-600 mt-2">Desenvolva suas habilidades de carreira e alcance seus objetivos</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Próxima Sessão</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">15/08</p>
            </div>
            <Calendar className="text-blue-600 w-8 h-8" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Pontos Acumulados</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">210</p>
            </div>
            <Trophy className="text-yellow-600 w-8 h-8" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Exercícios Completos</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">1</p>
            </div>
            <BookOpen className="text-green-600 w-8 h-8" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Evolução Geral</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">+15%</p>
            </div>
            <TrendingUp className="text-purple-600 w-8 h-8" />
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Ações Rápidas</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href="/encontros">
            <Card className="p-6 hover:shadow-lg transition cursor-pointer">
              <Calendar className="text-blue-600 w-6 h-6 mb-3" />
              <h3 className="font-semibold text-gray-900">Meus Encontros</h3>
              <p className="text-gray-600 text-sm mt-1">Ver sessões presenciais e online</p>
            </Card>
          </Link>

          <Link href="/exercicios">
            <Card className="p-6 hover:shadow-lg transition cursor-pointer">
              <PenTool className="text-green-600 w-6 h-6 mb-3" />
              <h3 className="font-semibold text-gray-900">Exercícios</h3>
              <p className="text-gray-600 text-sm mt-1">Mapa de quem sou eu e testes</p>
            </Card>
          </Link>

          <Link href="/diario">
            <Card className="p-6 hover:shadow-lg transition cursor-pointer">
              <BookOpen className="text-purple-600 w-6 h-6 mb-3" />
              <h3 className="font-semibold text-gray-900">Diário de Bordo</h3>
              <p className="text-gray-600 text-sm mt-1">Registre seus insights e aprendizados</p>
            </Card>
          </Link>
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Atividade Recente</h2>
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-start space-x-4">
              <div className="bg-blue-100 rounded-full p-2 mt-1">
                <Zap className="text-blue-600 w-4 h-4" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">Novo Achievement Desbloqueado</p>
                <p className="text-gray-600 text-sm">Você completou seu primeiro exercício</p>
                <p className="text-gray-500 text-xs mt-1">Há 2 dias</p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

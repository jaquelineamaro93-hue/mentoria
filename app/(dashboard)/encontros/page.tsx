'use client';

import { Card } from '@/components/ui/card';
import { Calendar, Clock, MapPin, Link as LinkIcon, Video } from 'lucide-react';
import posthog from 'posthog-js';

export default function EncontrosPage() {
  // Mock data - será substituído por dados do banco
  const sessions = [
    {
      id: 1,
      title: 'Sessão Individual - Carreira & Estratégia',
      date: '15/08/2024',
      time: '14:00 - 15:00',
      type: 'presencial',
      location: 'Sala de Reunião 1, São Paulo - SP',
      mentor: 'Jaqueline Amaro',
    },
    {
      id: 2,
      title: 'Sessão em Grupo - Feedback de Desenvolvimento',
      date: '22/08/2024',
      time: '19:00 - 20:30',
      type: 'online',
      link: 'Meet: mentoria-carreira-agosto',
      mentor: 'Jaqueline Amaro',
    },
    {
      id: 3,
      title: 'Sessão Individual - Revisão de Projeto',
      date: '29/08/2024',
      time: '10:00 - 11:00',
      type: 'presencial',
      location: 'Sala de Reunião 1, São Paulo - SP',
      mentor: 'Jaqueline Amaro',
    },
  ];

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Meus Encontros</h1>
        <p className="text-gray-600 mt-2">Sessões presenciais e online de mentoria</p>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6">
          <p className="text-gray-600 text-sm">Próximo Encontro</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">15/08</p>
          <p className="text-gray-600 text-sm mt-1">14:00</p>
        </Card>
        <Card className="p-6">
          <p className="text-gray-600 text-sm">Total de Sessões</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">6</p>
          <p className="text-gray-600 text-sm mt-1">3 utilizadas</p>
        </Card>
        <Card className="p-6">
          <p className="text-gray-600 text-sm">Crédito Restante</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">3</p>
          <p className="text-gray-600 text-sm mt-1">Individuais</p>
        </Card>
      </div>

      {/* Timeline de Encontros */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Próximos Encontros</h2>
        <div className="space-y-4">
          {sessions.map((session) => (
            <Card key={session.id} className="p-6 hover:shadow-lg transition">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 text-lg">{session.title}</h3>
                  <p className="text-gray-600 text-sm mt-1">Com: {session.mentor}</p>

                  <div className="flex flex-wrap gap-4 mt-4">
                    <div className="flex items-center text-gray-600 text-sm">
                      <Calendar className="w-4 h-4 mr-2" />
                      {session.date}
                    </div>
                    <div className="flex items-center text-gray-600 text-sm">
                      <Clock className="w-4 h-4 mr-2" />
                      {session.time}
                    </div>

                    {session.type === 'presencial' && (
                      <div className="flex items-center text-gray-600 text-sm">
                        <MapPin className="w-4 h-4 mr-2" />
                        {session.location}
                      </div>
                    )}

                    {session.type === 'online' && (
                      <div className="flex items-center text-blue-600 text-sm">
                        <Video className="w-4 h-4 mr-2" />
                        {session.link}
                      </div>
                    )}
                  </div>

                  <p className="text-xs text-gray-500 mt-3">
                    {session.type === 'presencial' ? '🏢 Presencial' : '📹 Online'}
                  </p>
                </div>

                <button
                  onClick={() => posthog.capture('mentoring_session_confirmed', {
                    session_id: session.id,
                    session_type: session.type,
                  })}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
                >
                  Confirmar
                </button>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Info importante */}
      <Card className="p-6 bg-blue-50 border-blue-200">
        <h3 className="font-semibold text-blue-900">Dicas para melhor aproveitar</h3>
        <ul className="text-blue-900 text-sm mt-3 space-y-2">
          <li>• Prepare-se com antecedência trazendo contexto claro do que quer construir</li>
          <li>• Entregue feedback após cada sessão para que eu possa melhorar</li>
          <li>• Registre seus insights no diário de bordo para não perder nada</li>
        </ul>
      </Card>
    </div>
  );
}

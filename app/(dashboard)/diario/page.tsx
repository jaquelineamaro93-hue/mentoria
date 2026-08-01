'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Zap, Plus } from 'lucide-react';
import posthog from 'posthog-js';

export default function DiarioPage() {
  const [entries, setEntries] = useState<any[]>([
    {
      id: 1,
      date: '22/07/2024',
      title: 'Reflexões sobre Liderança',
      content: 'Hoje durante a sessão com a Jaqueline, percebi que minha dificuldade em delegar vem de uma crença de que preciso fazer tudo por mim mesmo. Essa crença vem da infância...',
      insights: [
        'Padrão de comportamento: Perfectismo',
        'Oportunidade: Desenvolver confiança no time',
        'Ação: Delegar uma tarefa por semana'
      ],
      tags: ['liderança', 'desenvolvimento'],
    }
  ]);
  const [isCreating, setIsCreating] = useState(false);
  const [newEntry, setNewEntry] = useState('');

  const handleCreateEntry = () => {
    if (newEntry.trim()) {
      // TODO: Enviar para API para análise de insights com IA
      setEntries([{
        id: entries.length + 1,
        date: new Date().toLocaleDateString('pt-BR'),
        title: 'Novo Insight',
        content: newEntry,
        insights: ['Processando insights...'],
        tags: ['novo'],
      }, ...entries]);
      setNewEntry('');
      setIsCreating(false);
      posthog.capture('journal_entry_created');
    }
  };

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Diário de Bordo</h1>
        <p className="text-gray-600 mt-2">Registre seus insights e aprendizados. IA analisa padrões automaticamente.</p>
      </div>

      {/* Botão criar entrada */}
      <button
        onClick={() => setIsCreating(!isCreating)}
        className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
      >
        <Plus className="w-5 h-5" />
        <span>Novo Registro</span>
      </button>

      {/* Form novo entry */}
      {isCreating && (
        <Card className="p-6 space-y-4">
          <h3 className="font-semibold text-gray-900">Novo Registro no Diário</h3>
          <textarea
            value={newEntry}
            onChange={(e) => setNewEntry(e.target.value)}
            placeholder="Descreva o que aprendeu hoje, seus insights, reflexões..."
            className="w-full h-40 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent resize-none"
          />
          <div className="flex space-x-3">
            <button
              onClick={handleCreateEntry}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
            >
              Salvar Registro
            </button>
            <button
              onClick={() => {
                setIsCreating(false);
                setNewEntry('');
              }}
              className="px-6 py-2 border border-gray-300 text-gray-900 rounded-lg hover:bg-gray-50 transition font-medium"
            >
              Cancelar
            </button>
          </div>
          <p className="text-sm text-gray-600">
            ✨ Nosso sistema IA analisará seu texto e extrairá insights automaticamente.
          </p>
        </Card>
      )}

      {/* Entradas */}
      <div className="space-y-4">
        {entries.map((entry) => (
          <Card key={entry.id} className="p-6 hover:shadow-lg transition">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-semibold text-gray-900 text-lg">{entry.title}</h3>
                <p className="text-gray-600 text-sm">📅 {entry.date}</p>
              </div>
              <div className="flex gap-2">
                {entry.tags.map((tag: string) => (
                  <span key={tag} className="px-3 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <p className="text-gray-600 mb-4">{entry.content}</p>

            {/* Insights */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-3">
                <Zap className="text-yellow-600 w-5 h-5" />
                <p className="font-semibold text-yellow-900">Insights Extraídos</p>
              </div>
              <ul className="space-y-2">
                {entry.insights.map((insight: string, idx: number) => (
                  <li key={idx} className="text-yellow-900 text-sm flex">
                    <span className="mr-2">→</span>
                    <span>{insight}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Card>
        ))}
      </div>

      {entries.length === 0 && !isCreating && (
        <Card className="p-12 text-center">
          <p className="text-gray-600">Ainda não há entradas. Comece a registrar seus aprendizados!</p>
        </Card>
      )}
    </div>
  );
}

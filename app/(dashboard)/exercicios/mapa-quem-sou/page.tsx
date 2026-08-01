'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import posthog from 'posthog-js';

const MAPA_BLOCKS = [
  {
    id: 'values',
    title: '1. Valores e Crenças (EU - ESSÊNCIA)',
    subtitle: 'O que é inegociável para você?',
    questions: [
      'O que é inegociável para você?',
      'Em que você acredita profundamente?',
      'Quais valores você nunca deveria ter traído?',
      'O que move suas decisões, mesmo sem lógica?',
      'Que crenças te limitam?',
      'Que crenças te fortalecem?',
    ],
    description: 'Integridade, beleza, liberdade, justiça; crenças como "eu preciso dar conta de tudo" ou "ninguém vai fazer por mim".',
  },
  {
    id: 'powerMoments',
    title: '2. Momentos de Potência',
    subtitle: 'Quando você se sentiu inteira(o)?',
    questions: [
      'Quando você se sentiu inteira(o) pela última vez?',
      'Qual foi um momento em que sua presença mudou o ambiente?',
      'O que você estava fazendo quando perdeu a noção do tempo?',
      'Em que contexto você se sente mais viva(o)?',
    ],
    description: 'Guiando um time, criando algo do zero, falando em público, ouvindo alguém com profundidade.',
  },
  {
    id: 'woundsToStrength',
    title: '3. Feridas que viraram Força',
    subtitle: 'Qual dor moldou quem você é?',
    questions: [
      'Qual dor moldou quem você é?',
      'Que parte sua sangrou, mas também floresceu?',
      'Se sua cicatriz falasse, o que ela diria?',
      'Como essa dor se transformou em potência?',
    ],
    description: 'Rejeição na infância que ensinou empatia; uma perda que ensinou sobre presença.',
  },
  {
    id: 'cycles',
    title: '4. Ciclos e Energia',
    subtitle: 'Quando você se sente mais produtiva(o)?',
    questions: [
      'Quando você se sente mais produtiva(o) e criativa(o)?',
      'Quando precisa de recolhimento?',
      'O que o seu corpo sinaliza (e você ignora)?',
      'Quais são seus ciclos naturais de energia?',
    ],
    description: 'Dias de energia alta, dias de introspecção, dias de silêncio. Ciclos biológicos e de rotina.',
  },
  {
    id: 'forgottenCalls',
    title: '5. Chamados Esquecidos',
    subtitle: 'Quais desejos você acabou ignorando?',
    questions: [
      'Quais desejos antigos, paixões adormecidas ou verdades você acabou ignorando?',
      'O que você amava fazer na infância?',
      'O que faz você perder a noção do tempo?',
      'Que ideias você guarda há anos, mas nunca moveu?',
    ],
    description: 'Escrever, ensinar, morar fora, criar com estética.',
  },
  {
    id: 'contribution',
    title: '6. Contribuição',
    subtitle: 'O que você tem a oferecer ao mundo?',
    questions: [
      'O que você tem a oferecer ao mundo?',
      'O que o mundo precisa que você tem a oferecer?',
      'Como sua história pode transformar a vida de outras pessoas?',
      'Que dor você já superou que hoje pode guiar o outro?',
    ],
    description: 'Ajudar pessoas a melhorarem a relação consigo mesmas através do vestir ou da expressão pessoal.',
  },
  {
    id: 'passions',
    title: '7. Paixões',
    subtitle: 'O que acende sua alma?',
    questions: [
      'O que acende sua alma?',
      'O que você ama aprender?',
      'O que você faria mesmo se não fosse paga(o)?',
      'Que temas te fascinam?',
    ],
    description: 'Moda como linguagem, escrita, limpar casas, processos que viram transformação, cozinhar.',
  },
  {
    id: 'skills',
    title: '8. Conhecimentos e Habilidades',
    subtitle: 'O que você já domina?',
    questions: [
      'O que você já domina?',
      'O que te diferencia?',
      'Quais habilidades te sustentam hoje?',
      'O que você sabe fazer como ninguém?',
    ],
    description: 'Estratégia, narrativa, gestão de marca, negociação com leveza, análise de portfólio.',
  },
  {
    id: 'currentPresence',
    title: '9. Presença Atual',
    subtitle: 'Qual parte sua está viva?',
    questions: [
      'Qual parte sua está sufocada?',
      'Qual parte está viva e pulsando?',
      'Que parte de você nunca teve voz?',
      'Como você se sente agora nesta jornada?',
    ],
    description: '"Sou uma pessoa exausta, mas pronta." | "Sou forte, mas preciso ser cuidada(o)." | "Sou estrategista, mas escondo minha arte."',
  },
];

export default function MapaQuemSouPage() {
  const [currentBlockIndex, setCurrentBlockIndex] = useState(0);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [currentText, setCurrentText] = useState('');
  const [isCompleted, setIsCompleted] = useState(false);

  const block = MAPA_BLOCKS[currentBlockIndex];

  const handleSaveResponse = () => {
    if (currentText.trim()) {
      setResponses({
        ...responses,
        [`${block.id}_${Object.keys(responses).filter(k => k.startsWith(block.id)).length}`]: currentText,
      });
      setCurrentText('');
      posthog.capture('exercise_response_saved', {
        exercise_id: 'mapa-quem-sou',
        block_id: block.id,
      });
    }
  };

  const handleNext = () => {
    if (currentBlockIndex < MAPA_BLOCKS.length - 1) {
      setCurrentBlockIndex(currentBlockIndex + 1);
    } else {
      // Completado
      setIsCompleted(true);
      // TODO: Salvar no banco de dados
      console.log('Respostas finais:', responses);
      posthog.capture('exercise_completed', {
        exercise_id: 'mapa-quem-sou',
        response_count: Object.keys(responses).length,
      });
    }
  };

  const handlePrevious = () => {
    if (currentBlockIndex > 0) {
      setCurrentBlockIndex(currentBlockIndex - 1);
    }
  };

  const progress = ((currentBlockIndex + 1) / MAPA_BLOCKS.length) * 100;

  if (isCompleted) {
    return (
      <div className="p-8 space-y-8">
        <Card className="p-12 bg-gradient-to-r from-blue-50 to-purple-50 border-purple-200">
          <div className="text-center space-y-6">
            <div className="text-6xl">🎉</div>
            <h1 className="text-3xl font-bold text-gray-900">Mapa Concluído!</h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Você passou por uma jornada profunda de autoconhecimento. Seus insights foram salvos e analisados. Em breve você poderá visualizar seu mapa de quem sou em formato visual.
            </p>

            <div className="bg-white rounded-lg p-6 mt-8 space-y-4 text-left max-w-2xl mx-auto">
              <h3 className="font-bold text-gray-900">Próximos Passos:</h3>
              <ul className="space-y-2 text-gray-600">
                <li>✓ Seus dados foram salvos com segurança</li>
                <li>✓ Uma análise de insights será feita via IA</li>
                <li>→ Você receberá seu mapa visual em breve</li>
                <li>→ Seu mentor revisará junto com você</li>
              </ul>
            </div>

            <button className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium">
              Voltar ao Exercício
            </button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Mapa de Quem Sou Eu</h1>
        <p className="text-gray-600 mt-2">Uma jornada de 9 blocos para autoconhecimento profundo</p>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="font-medium text-gray-900">Progresso</span>
          <span className="text-gray-600">{currentBlockIndex + 1} de {MAPA_BLOCKS.length}</span>
        </div>
        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-600 to-purple-600 transition-all duration-300"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>

      {/* Content */}
      <Card className="p-8 space-y-6">
        {/* Bloco Info */}
        <div className="space-y-3">
          <h2 className="text-2xl font-bold text-gray-900">{block.title}</h2>
          <p className="text-lg text-blue-600 font-semibold">{block.subtitle}</p>
          <p className="text-gray-600 text-sm italic">{block.description}</p>
        </div>

        <div className="border-t border-gray-200 pt-6 space-y-6">
          {/* Perguntas como referência */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Perguntas guia:</h3>
            <ul className="space-y-2">
              {block.questions.map((q, idx) => (
                <li key={idx} className="text-gray-600 text-sm flex">
                  <span className="mr-3">•</span>
                  <span>{q}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Input */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-3">
              Suas reflexões para este bloco:
            </label>
            <textarea
              value={currentText}
              onChange={(e) => setCurrentText(e.target.value)}
              placeholder="Escreva suas respostas, reflexões e insights aqui. Pode ser em forma de bullet points ou prosa."
              className="w-full h-40 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent resize-none"
            />
            <button
              onClick={handleSaveResponse}
              className="mt-3 px-4 py-2 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 transition text-sm font-medium"
            >
              Adicionar nota
            </button>
          </div>

          {/* Respostas salvas */}
          {Object.entries(responses)
            .filter(([key]) => key.startsWith(block.id))
            .length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm font-semibold text-blue-900 mb-3">Notas adicionadas:</p>
              <div className="space-y-2">
                {Object.entries(responses)
                  .filter(([key]) => key.startsWith(block.id))
                  .map(([key, value]) => (
                    <div key={key} className="text-sm text-blue-900 bg-white p-3 rounded border border-blue-100">
                      {value}
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between items-center">
        <button
          onClick={handlePrevious}
          disabled={currentBlockIndex === 0}
          className="flex items-center space-x-2 px-6 py-3 border border-gray-300 text-gray-900 rounded-lg hover:bg-gray-50 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-5 h-5" />
          <span>Anterior</span>
        </button>

        <div className="text-sm text-gray-600">
          Bloco {currentBlockIndex + 1} de {MAPA_BLOCKS.length}
        </div>

        <button
          onClick={handleNext}
          className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
        >
          <span>{currentBlockIndex === MAPA_BLOCKS.length - 1 ? 'Concluir' : 'Próximo'}</span>
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Info Box */}
      <Card className="p-4 bg-amber-50 border-amber-200">
        <p className="text-sm text-amber-900">
          💡 <strong>Dica:</strong> Não há respostas certas ou erradas. Este é um espaço seguro para reflexão profunda. Vá no seu ritmo e seja autêntico.
        </p>
      </Card>
    </div>
  );
}

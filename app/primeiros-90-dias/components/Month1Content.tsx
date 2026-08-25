'use client';

import { useState } from 'react';

interface Month1ContentProps {
  respostas: Record<string, any>;
  situacao: string;
  onChange: (path: string, value: any) => void;
}

const TRANSITION_ITEMS = [
  'Desapego do cargo anterior e identidade profissional prévia',
  'Aceitação de que não conheco ainda toda a realidade da nova organização',
  'Abertura para feedback direto e críticas construtivas',
  'Disposição para escutar sem defender posições imediatas',
  'Reconhecimento de que há muito a aprender nos primeiros 30 dias',
];

const KEY_QUESTIONS = [
  'Qual é a sua prioridade estratégica número um para os próximos 6 meses?',
  'Quais são as maiores frustrações ou desafios que você enfrenta atualmente?',
  'Qual é a imagem que você gostaria que a organização tivesse daqui a um ano?',
  'O que você já tentou resolver e não funcionou?',
  'Qual é o melhor conselho que você daria a alguém que chega nessa posição?',
];

export default function Month1Content({ respostas, onChange }: Month1ContentProps) {
  const transitionChecklist = respostas['transition_checklist'] || {};
  const interviewNotes = respostas['interview_notes'] || {};

  const toggleTransitionItem = (item: string) => {
    const checked = transitionChecklist[item] || false;
    onChange('transition_checklist', {
      ...transitionChecklist,
      [item]: !checked,
    });
  };

  const updateInterviewNote = (questionIndex: number, note: string) => {
    onChange('interview_notes', {
      ...interviewNotes,
      [`question_${questionIndex}`]: note,
    });
  };

  return (
    <div className="space-y-12">
      {/* Transition Checklist */}
      <section>
        <h3 className="text-2xl text-black font-medium mb-2">Checklist de Transição Mental</h3>
        <p className="text-gray-text text-sm mb-6 leading-relaxed">
          Estes itens representam desapegos mentais e aberturas essenciais para os primeiros 30
          dias. Reflita sobre cada um e marque conforme trabalhar.
        </p>

        <div className="space-y-3">
          {TRANSITION_ITEMS.map((item) => (
            <label
              key={item}
              className="flex items-start gap-4 p-4 rounded-lg border border-gray-faint hover:bg-mint-light hover:border-mint transition-colors cursor-pointer"
            >
              <input
                type="checkbox"
                checked={transitionChecklist[item] || false}
                onChange={() => toggleTransitionItem(item)}
                className="mt-1 accent-mint"
              />
              <span className="text-sm text-black leading-relaxed">{item}</span>
            </label>
          ))}
        </div>
      </section>

      {/* Interview Guide */}
      <section>
        <h3 className="text-2xl text-black font-medium mb-2">Roteiro de Entrevista 1-on-1</h3>
        <p className="text-gray-text text-sm mb-6 leading-relaxed">
          Utilize estas 5 perguntas estratégicas em conversas individuais com gestor, pares e
          liderados. Anote os pontos principais para compreender os contextos.
        </p>

        <div className="space-y-6">
          {KEY_QUESTIONS.map((question, idx) => (
            <div key={idx} className="p-6 rounded-lg border border-gray-faint bg-gray-light">
              <div className="flex gap-3 mb-4">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white font-medium shrink-0"
                  style={{ backgroundColor: '#3DD9C8' }}
                >
                  {idx + 1}
                </div>
                <h4 className="text-black font-medium leading-relaxed">{question}</h4>
              </div>
              <textarea
                value={interviewNotes[`question_${idx}`] || ''}
                onChange={(e) => updateInterviewNote(idx, e.target.value)}
                placeholder="Anote os pontos importantes que ouve..."
                className="w-full p-3 rounded border border-gray-faint bg-white text-sm text-black resize-none focus:outline-none focus:ring-2 focus:ring-mint"
                rows={3}
              />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

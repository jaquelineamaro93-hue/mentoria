'use client';

import { useMemo } from 'react';

interface DashboardAcompanhamentoProps {
  respostas: Record<string, any>;
  situacao: string | null;
}

const STARS_INSIGHTS = {
  startup: {
    titulo: 'Construção e Estruturação',
    diretriz:
      'Concentre 80% da energia em definir processos iniciais, estruturar o time e estabelecer as fundações. Maior risco: perder-se em demandas operacionais imediatas sem criar sistemas escaláveis.',
  },
  turnaround: {
    titulo: 'Reorganização Urgente',
    diretriz:
      'Priorize comunicação clara, decisões estruturantes rápidas e estabilização imediata. Maior risco: movimentos precipitados sem compreender a raiz dos problemas.',
  },
  realinhamento: {
    titulo: 'Ajuste de Rota',
    diretriz:
      'Equilibre continuidade operacional com mudanças estratégicas necessárias. Maior risco: resistência excessiva à mudança por preservar o status quo.',
  },
  sustentacao: {
    titulo: 'Manutenção e Escala',
    diretriz:
      'Otimize processos, desenvolva talentos e prepare o próximo ciclo de crescimento. Maior risco: acomodação e perda de inovação em ambiente estável.',
  },
};

export default function DashboardAcompanhamento({
  respostas,
  situacao,
}: DashboardAcompanhamentoProps) {
  const metrics = useMemo(() => {
    let progressPercent = 0;
    let totalItems = 0;
    let completedItems = 0;

    // Mês 1: Checklist de Transição (5 items) + Notas de entrevistas (5 preguntas)
    const transitionChecklist = respostas['transition_checklist'] || {};
    const interviewNotes = respostas['interview_notes'] || {};

    const month1Total = 10;
    let month1Completed = 0;
    Object.values(transitionChecklist).forEach((checked) => {
      if (checked) month1Completed++;
    });
    Object.values(interviewNotes).forEach((note) => {
      if (note && typeof note === 'string' && note.trim().length > 0) month1Completed++;
    });

    // Mês 2: Early Wins (2) + Contatos de Influência (5)
    const earlyWins = respostas['early_wins'] || {};
    const influenceMatrix = respostas['influence_matrix'] || {};
    const contacts = influenceMatrix['contacts'] || [];

    const month2Total = 7;
    let month2Completed = 0;
    if (earlyWins['win1'] && earlyWins['win1'].trim().length > 0) month2Completed++;
    if (earlyWins['win2'] && earlyWins['win2'].trim().length > 0) month2Completed++;
    contacts.forEach((contact) => {
      if (contact?.name && contact.name.trim().length > 0) month2Completed++;
    });

    // Mês 3: 5 Pilares de Arquitetura + Síntese
    const arquitetura = respostas['arquitetura_avaliacao'] || {};
    const sintese = respostas['sintese_mentoria'] || '';

    const month3Total = 6;
    let month3Completed = 0;
    Object.values(arquitetura).forEach((value) => {
      if (value && typeof value === 'string' && value.trim().length > 0) month3Completed++;
    });
    if (sintese && sintese.trim().length > 0) month3Completed++;

    // Totais gerais
    totalItems = month1Total + month2Total + month3Total;
    completedItems = month1Completed + month2Completed + month3Completed;
    progressPercent = Math.round((completedItems / totalItems) * 100);

    // Síntese automática
    const totalMeetings = Object.keys(interviewNotes).filter(
      (key) => interviewNotes[key] && interviewNotes[key].trim().length > 0
    ).length;
    const totalEarlyWins = [earlyWins['win1'], earlyWins['win2']].filter(
      (win) => win && win.trim().length > 0
    ).length;
    const totalContacts = contacts.filter((c) => c?.name && c.name.trim().length > 0).length;

    return {
      progressPercent,
      totalItems,
      completedItems,
      month1: { completed: month1Completed, total: month1Total },
      month2: { completed: month2Completed, total: month2Total },
      month3: { completed: month3Completed, total: month3Total },
      totalMeetings,
      totalEarlyWins,
      totalContacts,
    };
  }, [respostas]);

  const handleCopyToClipboard = () => {
    const stars = situacao ? STARS_INSIGHTS[situacao as keyof typeof STARS_INSIGHTS] : null;
    const resumo = `📋 PAUTA DE MENTORIA - PRIMEIROS 90 DIAS

Contexto: ${stars?.titulo || 'Não definido'}

Reuniões 1-on-1 Registradas: ${metrics.totalMeetings}
Vitórias Rápidas Planejadas: ${metrics.totalEarlyWins}
Contatos Estratégicos Mapeados: ${metrics.totalContacts}

Progresso Geral: ${metrics.progressPercent}% (${metrics.completedItems}/${metrics.totalItems} seções)

Tópicos para Discussão:
- Alinhamento de expectativas vs. realidade encontrada
- Priorização de Early Wins
- Mapeamento de aliados estratégicos
- Próximos passos para os 90 dias seguintes

${stars ? `Diretriz Tática: ${stars.diretriz}` : ''}`;

    navigator.clipboard.writeText(resumo);
    alert('Pauta copiada para a área de transferência!');
  };

  const starsInsight = situacao
    ? STARS_INSIGHTS[situacao as keyof typeof STARS_INSIGHTS]
    : null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
      {/* Card 1: Termômetro do Onboarding */}
      <div className="p-6 rounded-lg border border-gray-faint bg-gray-light">
        <h3 className="text-lg font-medium text-black mb-1">Termômetro do Onboarding</h3>
        <p className="text-sm text-gray-text mb-4">Progresso nos 90 dias</p>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex justify-between items-end mb-2">
            <span className="text-sm font-medium text-black">{metrics.progressPercent}%</span>
            <span className="text-xs text-gray-text">
              {metrics.completedItems}/{metrics.totalItems}
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-gray-faint overflow-hidden">
            <div
              className="h-full transition-all duration-300"
              style={{
                width: `${metrics.progressPercent}%`,
                backgroundColor: '#3DD9C8',
              }}
            />
          </div>
        </div>

        {/* Phase Badges */}
        <div className="space-y-2">
          {[
            { phase: 'Mês 1', data: metrics.month1, color: '#FFB366' },
            { phase: 'Mês 2', data: metrics.month2, color: '#FF7A8A' },
            { phase: 'Mês 3', data: metrics.month3, color: '#3DD9C8' },
          ].map(({ phase, data, color }) => (
            <div key={phase} className="flex items-center justify-between text-xs">
              <span className="text-gray-text">{phase}</span>
              <div className="flex items-center gap-2">
                <div className="w-12 h-1 rounded-full bg-gray-faint overflow-hidden">
                  <div
                    className="h-full transition-all"
                    style={{
                      width: `${Math.round((data.completed / data.total) * 100)}%`,
                      backgroundColor: color,
                    }}
                  />
                </div>
                <span className="text-gray-text font-medium">
                  {data.completed}/{data.total}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Card 2: Insights STARS */}
      <div className="p-6 rounded-lg border border-mint-border bg-mint-light">
        <h3 className="text-lg font-medium text-black mb-1">Contexto Estratégico</h3>
        <p className="text-sm text-gray-text mb-4">Diretriz de foco</p>

        {starsInsight ? (
          <div>
            <div className="mb-3 p-2 rounded bg-white border border-mint-border">
              <p className="text-sm font-medium text-black">{starsInsight.titulo}</p>
            </div>
            <p className="text-xs text-black leading-relaxed">{starsInsight.diretriz}</p>
          </div>
        ) : (
          <p className="text-sm text-gray-text italic">Selecione um contexto STARS para receber orientações personalizadas.</p>
        )}
      </div>

      {/* Card 3: Síntese para Mentoria */}
      <div className="p-6 rounded-lg border border-gray-faint bg-gray-light">
        <h3 className="text-lg font-medium text-black mb-1">Resumo de Progresso</h3>
        <p className="text-sm text-gray-text mb-4">Compilado para a sessão</p>

        <div className="space-y-3 mb-4">
          <div>
            <span className="text-xs text-gray-text">Reuniões 1-on-1</span>
            <p className="text-2xl font-medium text-black">{metrics.totalMeetings}</p>
          </div>
          <div>
            <span className="text-xs text-gray-text">Vitórias Rápidas</span>
            <p className="text-2xl font-medium text-black">{metrics.totalEarlyWins}</p>
          </div>
          <div>
            <span className="text-xs text-gray-text">Contatos Mapeados</span>
            <p className="text-2xl font-medium text-black">{metrics.totalContacts}</p>
          </div>
        </div>

        <button
          onClick={handleCopyToClipboard}
          className="w-full py-2 px-3 rounded text-sm font-medium text-white border transition-opacity"
          style={{
            backgroundColor: '#3DD9C8',
            borderColor: '#3DD9C8',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.85')}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
        >
          Copiar Pauta para Mentoria
        </button>
      </div>
    </div>
  );
}

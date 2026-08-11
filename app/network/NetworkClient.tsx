'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Users, Upload, MessageCircle, Target, Network, Copy, CheckCircle2 } from 'lucide-react';
import { Panel, Eyebrow } from '@/components/Panel';
import Sidebar from '@/components/Sidebar';
import { createClient } from '@/lib/supabase/client';
import type { Profile } from '@/lib/types';

interface Contact {
  nome: string;
  empresa: string;
  cargo: string;
  circulo: 'raiz' | 'ponte' | 'presenca' | 'futuro' | 'recomeço';
  justificativa: string;
  acao: string;
  linkedinUrl?: string;
  email?: string;
  telefone?: string;
}

const CIRCULOS = [
  {
    id: 'raiz',
    label: 'Círculo da Raiz',
    descricao: 'Pessoas que me conhecem profundamente e confiam em mim',
    cor: 'bg-red-50 border-red-200',
    bgPanel: 'bg-red-50 border-red-200',
    textColor: 'text-red-700',
    icon: '🌱',
  },
  {
    id: 'ponte',
    label: 'Círculo da Ponte',
    descricao: 'Pessoas que podem me apresentar para outras oportunidades',
    cor: 'bg-blue-50 border-blue-200',
    bgPanel: 'bg-blue-50 border-blue-200',
    textColor: 'text-blue-700',
    icon: '🌉',
  },
  {
    id: 'presenca',
    label: 'Círculo da Presença',
    descricao: 'Pessoas que me seguem mas com quem não conversei profundamente',
    cor: 'bg-yellow-50 border-yellow-200',
    bgPanel: 'bg-yellow-50 border-yellow-200',
    textColor: 'text-yellow-700',
    icon: '👁️',
  },
  {
    id: 'futuro',
    label: 'Círculo do Futuro',
    descricao: 'Pessoas que admiro mas ainda não tenho relação',
    cor: 'bg-purple-50 border-purple-200',
    bgPanel: 'bg-purple-50 border-purple-200',
    textColor: 'text-purple-700',
    icon: '⭐',
  },
  {
    id: 'recomeço',
    label: 'Círculo do Recomeço',
    descricao: 'Pessoas que me conheceram em fases travadas - hora de mostrar quem sou',
    cor: 'bg-green-50 border-green-200',
    bgPanel: 'bg-green-50 border-green-200',
    textColor: 'text-green-700',
    icon: '🔄',
  },
];

export default function NetworkClient({ userId, profile }: { userId: string; profile: Profile | null }) {
  const router = useRouter();
  const supabase = createClient();
  const [aba, setAba] = useState<'circulo' | 'importar' | 'analise'>('circulo');
  const [contatos, setContatos] = useState<Contact[]>([]);
  const [filtroCirculo, setFiltroCirculo] = useState<string | null>(null);
  const [copiado, setCopiado] = useState<string | null>(null);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  const handleImportarCSV = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const csv = event.target?.result as string;
          console.log('CSV importado:', csv);
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const handleCopiarMensagem = (mensagem: string) => {
    navigator.clipboard.writeText(mensagem);
    setCopiado(mensagem);
    setTimeout(() => setCopiado(null), 2000);
  };

  const contatosPorCirculo = (circulo: string) => {
    return contatos.filter((c) => c.circulo === circulo);
  };

  return (
    <div className="flex flex-col md:flex-row w-full">
      <Sidebar profile={profile} onSignOut={handleSignOut} />

      <main className="flex-1 px-6 py-10 md:px-12 max-w-5xl mx-auto w-full">
        <Eyebrow>
          <Network size={14} />
          Círculos de Influência
        </Eyebrow>
        <h1 className="font-display text-3xl text-brown-deep mb-1">Sua Rede Estratégica</h1>
        <p className="text-sm text-ink-faint max-w-xl mb-8">
          Mapeie seus contatos em círculos de influência e receba um plano de ação personalizado para 72 horas.
        </p>

        <div className="flex gap-4 mb-8 border-b border-line">
          <button
            onClick={() => setAba('circulo')}
            className={`pb-3 px-4 font-medium transition ${
              aba === 'circulo'
                ? 'border-b-2 border-brown text-brown-deep'
                : 'text-ink-soft hover:text-ink'
            }`}
          >
            <Users size={18} className="inline mr-2" />
            Meus Círculos
          </button>
          <button
            onClick={() => setAba('importar')}
            className={`pb-3 px-4 font-medium transition ${
              aba === 'importar'
                ? 'border-b-2 border-brown text-brown-deep'
                : 'text-ink-soft hover:text-ink'
            }`}
          >
            <Upload size={18} className="inline mr-2" />
            Importar LinkedIn
          </button>
          <button
            onClick={() => setAba('analise')}
            className={`pb-3 px-4 font-medium transition ${
              aba === 'analise'
                ? 'border-b-2 border-brown text-brown-deep'
                : 'text-ink-soft hover:text-ink'
            }`}
          >
            <Target size={18} className="inline mr-2" />
            Plano de Ação
          </button>
        </div>

        {aba === 'circulo' && (
          <div className="space-y-6">
            {CIRCULOS.map((circulo) => {
              const count = contatosPorCirculo(circulo.id);
              return (
                <Panel key={circulo.id} className={`border-2 ${circulo.cor}`}>
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-display text-brown-deep flex items-center gap-2 mb-1">
                          <span className="text-2xl">{circulo.icon}</span>
                          {circulo.label}
                        </h3>
                        <p className="text-sm text-ink-soft">{circulo.descricao}</p>
                      </div>
                      <div className="bg-brown-deep text-paper px-4 py-2 rounded-full font-bold text-sm shrink-0">
                        {count.length}
                      </div>
                    </div>

                    {count.length === 0 ? (
                      <div className="text-center py-8 text-ink-faint">
                        <p className="text-sm">Nenhum contato neste círculo ainda</p>
                        <button
                          onClick={() => setAba('importar')}
                          className="text-brown-deep hover:text-brown transition underline mt-2 text-sm font-medium"
                        >
                          Importar seus contatos do LinkedIn
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {count.map((contato, idx) => (
                          <div
                            key={idx}
                            className="bg-white p-3 rounded border border-line hover:shadow-sm hover:border-brown/30 transition"
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <p className="font-medium text-brown-deep">{contato.nome}</p>
                                <p className="text-xs text-ink-soft">
                                  {contato.cargo} • {contato.empresa}
                                </p>
                              </div>
                              <button className="text-brown-deep hover:text-brown-deep/80 shrink-0">
                                <MessageCircle size={18} />
                              </button>
                            </div>
                            <p className="text-xs text-ink-soft mt-2 italic">{contato.justificativa}</p>
                            {contato.acao && (
                              <div className="bg-yellow-50 p-2 rounded mt-2 text-xs text-brown-deep">
                                <strong>Ação:</strong> {contato.acao}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </Panel>
              );
            })}
          </div>
        )}

        {aba === 'importar' && (
          <Panel className="p-12 text-center">
            <Upload size={48} className="mx-auto text-brown-deep mb-4" />
            <h3 className="font-display text-2xl text-brown-deep mb-2">Importe seus contatos do LinkedIn</h3>
            <p className="text-ink-soft mb-8 max-w-md mx-auto">
              Exporte suas conexões do LinkedIn e suba aqui para categorizar automaticamente em Círculos de Influência.
            </p>

            <button
              onClick={handleImportarCSV}
              className="bg-brown-deep text-paper px-8 py-3 rounded-lg font-medium hover:bg-brown transition mb-8 inline-flex items-center gap-2"
            >
              <Upload size={18} />
              Selecionar arquivo CSV
            </button>

            <div className="bg-sky-tint border border-sky p-6 rounded-lg text-left text-sm text-sky-deep space-y-3 max-w-md mx-auto">
              <p className="font-medium mb-4">Como exportar do LinkedIn:</p>
              <ol className="space-y-2 list-decimal list-inside text-sm">
                <li>Faça login no LinkedIn</li>
                <li>Clique na foto de perfil → Configurações e privacidade</li>
                <li>Vá em Privacidade de dados</li>
                <li>Clique em "Obter uma cópia dos seus dados"</li>
                <li>Selecione "Conexões" e solicite o arquivo</li>
                <li>Você receberá um CSV por email em ~10 minutos</li>
              </ol>
            </div>
          </Panel>
        )}

        {aba === 'analise' && (
          <div className="space-y-6">
            <Panel className="bg-sky-tint border border-sky p-6">
              <h3 className="font-display text-xl text-sky-deep mb-6">Seu Plano de Ação de 72 Horas</h3>

              {CIRCULOS.map((circulo) => {
                const contato = contatosPorCirculo(circulo.id)[0];
                if (!contato) return null;

                const mensagens: Record<string, string> = {
                  raiz: `Oi ${contato.nome}! Queria te atualizar sobre um novo capítulo da minha carreira. Você foi fundamental nessa jornada e gostaria de conversar com você sobre o que estou criando agora.`,
                  ponte: `${contato.nome}, tudo bem? Gostaria de marcar um café/call rápido (30min) para conversar sobre [sua nova direção]. Você conhece pessoas/oportunidades nessa área?`,
                  presenca: `Oi ${contato.nome}! Vi seu post sobre [tema] e achei incrível. Sou ${contato.nome.split(' ')[0]} e trabalho com desenvolvimento de carreira e preparação para entrevistas. Gostaria de trocar ideias!`,
                  futuro: `${contato.nome}, admiro muito seu trabalho em [área]. Seu case inspirou minha trajetória. Gostaria de conversar como você chegou aonde está agora.`,
                  recomeço: `${contato.nome}! Muito tempo, né? Queria te contar que evoluí bastante profissionalmente e estaria bem interessado em reconectar. Você tem 15min para uma call?`,
                };

                return (
                  <div key={circulo.id} className={`border-2 rounded-lg p-4 ${circulo.bgPanel}`}>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-2xl">{circulo.icon}</span>
                      <h4 className="font-medium text-brown-deep">{circulo.label}</h4>
                    </div>
                    <p className="text-sm text-ink-soft mb-3">
                      <strong>Contato:</strong> {contato.nome} ({contato.empresa})
                    </p>
                    <p className="bg-white p-3 rounded text-sm text-ink border-l-4 border-brown-deep mb-4">
                      "{mensagens[circulo.id] || 'Mensagem personalizada'}"
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleCopiarMensagem(mensagens[circulo.id] || '')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded text-sm font-medium transition ${
                          copiado === (mensagens[circulo.id] || '')
                            ? 'bg-green-100 text-green-700 border border-green-300'
                            : 'bg-brown-deep text-paper hover:bg-brown'
                        }`}
                      >
                        {copiado === (mensagens[circulo.id] || '') ? (
                          <>
                            <CheckCircle2 size={16} />
                            Copiado!
                          </>
                        ) : (
                          <>
                            <Copy size={16} />
                            Copiar
                          </>
                        )}
                      </button>
                      <button className="flex-1 border border-brown-deep text-brown-deep py-2 px-3 rounded text-sm font-medium hover:bg-cream transition">
                        Enviar no LinkedIn
                      </button>
                    </div>
                  </div>
                );
              })}
            </Panel>

            <Panel className="bg-cream p-4">
              <p className="text-sm text-ink">
                <strong>💡 Dica:</strong> Não precisa enviar para todos de uma vez. Comece pelos 5 do Círculo da Raiz, depois ponte, e assim por diante. Consistência &gt; Velocidade.
              </p>
            </Panel>
          </div>
        )}
      </main>
    </div>
  );
}

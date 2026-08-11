'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Users, Upload, MessageCircle, Target, Network, Copy, CheckCircle2, Plus, X } from 'lucide-react';
import { Panel, Eyebrow } from '@/components/Panel';
import Sidebar from '@/components/Sidebar';
import { createClient } from '@/lib/supabase/client';
import type { Profile } from '@/lib/types';

interface Contact {
  nome: string;
  relacao: string;
  potencial: string;
  circulo: 'raiz' | 'ponte' | 'presenca' | 'futuro' | 'recomeço';
  acao: string;
  linkedinUrl?: string;
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
  const [copiado, setCopiado] = useState<string | null>(null);
  const [mostraFormulario, setMostraFormulario] = useState(false);
  const [circuloSelecionado, setCirculoSelecionado] = useState<'raiz' | 'ponte' | 'presenca' | 'futuro' | 'recomeço'>('raiz');
  const [novoContato, setNovoContato] = useState<Contact>({
    nome: '',
    relacao: '',
    potencial: '',
    circulo: 'raiz',
    acao: '',
  });

  const abrirFormularioParaCirculo = (circuloId: string) => {
    setCirculoSelecionado(circuloId as Contact['circulo']);
    setNovoContato({
      nome: '',
      relacao: '',
      potencial: '',
      circulo: circuloId as Contact['circulo'],
      acao: '',
    });
    setMostraFormulario(true);
  };

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

  const handleAdicionarContatoManual = () => {
    if (!novoContato.nome.trim()) {
      alert('O nome é obrigatório');
      return;
    }

    setContatos([...contatos, novoContato]);

    setNovoContato({
      nome: '',
      relacao: '',
      potencial: '',
      circulo: circuloSelecionado,
      acao: '',
    });
    setMostraFormulario(false);
    setAba('circulo');
  };

  const contatosPorCirculo = (circulo: string) => {
    return contatos.filter((c) => c.circulo === circulo);
  };

  return (
    <div className="flex flex-row w-full h-screen">
      <Sidebar profile={profile} onSignOut={handleSignOut} />

      <main className="flex-1 overflow-y-auto px-6 py-10 md:px-12 w-full">
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

                    <div className="space-y-3">
                      {count.length > 0 && (
                        <div className="space-y-2">
                          {count.map((contato, idx) => (
                            <div
                              key={idx}
                              className="bg-white p-3 rounded border border-line hover:shadow-sm hover:border-brown/30 transition"
                            >
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <p className="font-medium text-brown-deep">{contato.nome}</p>
                                  {contato.relacao && (
                                    <p className="text-xs text-ink-soft">{contato.relacao}</p>
                                  )}
                                </div>
                                <button className="text-brown-deep hover:text-brown-deep/80 shrink-0">
                                  <MessageCircle size={18} />
                                </button>
                              </div>
                              {contato.potencial && (
                                <p className="text-xs text-ink-soft mt-2 italic">{contato.potencial}</p>
                              )}
                              {contato.acao && (
                                <div className="bg-yellow-50 p-2 rounded mt-2 text-xs text-brown-deep">
                                  <strong>Ação:</strong> {contato.acao}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      <button
                        onClick={() => abrirFormularioParaCirculo(circulo.id)}
                        className={`w-full py-2.5 px-4 rounded-lg font-medium transition flex items-center justify-center gap-2 text-sm ${
                          count.length === 0
                            ? 'bg-brown-deep text-paper hover:bg-brown'
                            : 'border-2 border-dashed border-brown-deep text-brown-deep hover:bg-brown-deep/5'
                        }`}
                      >
                        <Plus size={16} />
                        {count.length === 0 ? 'Adicionar Primeiro Contato' : 'Adicionar Contato'}
                      </button>
                    </div>
                  </div>
                </Panel>
              );
            })}
          </div>
        )}

        {aba === 'importar' && (
          <div className="space-y-6">
            <Panel className="p-8 border-2 border-sky max-w-2xl mx-auto">
              <h3 className="font-display text-2xl text-brown-deep mb-2 flex items-center gap-2">
                <Upload size={24} />
                Importar do LinkedIn
              </h3>
              <p className="text-sm text-ink-soft mb-6">
                Exporte suas conexões do LinkedIn em bulk e categorize automaticamente em Círculos de Influência.
              </p>

              <button
                onClick={handleImportarCSV}
                className="w-full bg-brown-deep text-paper px-6 py-3 rounded-lg font-medium hover:bg-brown transition mb-8 inline-flex items-center justify-center gap-2"
              >
                <Upload size={18} />
                Selecionar arquivo CSV
              </button>

              <div className="bg-sky-tint border border-sky p-4 rounded-lg text-left text-sm text-sky-deep space-y-2">
                <p className="font-medium mb-3">📋 Como exportar do LinkedIn:</p>
                <ol className="space-y-1.5 list-decimal list-inside">
                  <li>Faça login no LinkedIn</li>
                  <li>Clique na foto do perfil → Configurações e privacidade</li>
                  <li>Vá em "Privacidade de dados"</li>
                  <li>Clique em "Obter cópia dos seus dados"</li>
                  <li>Selecione "Conexões" e solicite download</li>
                  <li>Você receberá um CSV por email</li>
                  <li>Importe aqui e categorize nos círculos</li>
                </ol>
              </div>

              {contatos.length > 0 && (
                <div className="bg-green-50 border border-green-200 p-4 rounded-lg mt-6">
                  <p className="text-sm text-green-700">
                    <strong>✅ Contatos adicionados:</strong> {contatos.length}
                  </p>
                </div>
              )}
            </Panel>

            <Panel className="p-6 bg-brown-deep/5 border-2 border-dashed border-brown-deep text-center">
              <p className="text-brown-deep font-medium mb-2">💡 Prefere adicionar manualmente?</p>
              <p className="text-sm text-ink-soft mb-4">
                Acesse "Meus Círculos" e clique em "Adicionar Contato" em cada círculo.
              </p>
              <button
                onClick={() => setAba('circulo')}
                className="inline-flex items-center gap-2 text-brown-deep hover:text-brown font-medium transition"
              >
                Ir para Meus Círculos
                <span>→</span>
              </button>
            </Panel>
          </div>
        )}

        {mostraFormulario && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <Panel className="max-w-2xl w-full border border-line">
              <div className="bg-paper border-b border-line p-6 flex items-start justify-between">
                <div>
                  <h2 className="font-display text-2xl text-brown-deep">Adicionar Contato</h2>
                  <p className="text-sm text-ink-soft mt-1">
                    {CIRCULOS.find((c) => c.id === novoContato.circulo)?.icon}{' '}
                    {CIRCULOS.find((c) => c.id === novoContato.circulo)?.label}
                  </p>
                </div>
                <button
                  onClick={() => setMostraFormulario(false)}
                  className="text-ink-faint hover:text-ink transition"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-brown-deep mb-2">Nome *</label>
                  <input
                    type="text"
                    value={novoContato.nome}
                    onChange={(e) => setNovoContato({ ...novoContato, nome: e.target.value })}
                    className="w-full px-3 py-2 border border-line rounded-lg focus:ring-2 focus:ring-brown-deep focus:border-transparent"
                    placeholder="Nome completo"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-brown-deep mb-2">
                    Relação — onde vocês trabalharam juntos
                  </label>
                  <input
                    type="text"
                    value={novoContato.relacao}
                    onChange={(e) => setNovoContato({ ...novoContato, relacao: e.target.value })}
                    className="w-full px-3 py-2 border border-line rounded-lg focus:ring-2 focus:ring-brown-deep focus:border-transparent"
                    placeholder="Ex: Itaú, time de Dados, 2021–2023"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-brown-deep mb-2">Círculo de Influência *</label>
                  <select
                    value={novoContato.circulo}
                    onChange={(e) => setNovoContato({ ...novoContato, circulo: e.target.value as any })}
                    className="w-full px-3 py-2 border border-line rounded-lg focus:ring-2 focus:ring-brown-deep focus:border-transparent"
                  >
                    {CIRCULOS.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-brown-deep mb-2">
                    Potencial de influência / insight
                  </label>
                  <textarea
                    value={novoContato.potencial}
                    onChange={(e) => setNovoContato({ ...novoContato, potencial: e.target.value })}
                    className="w-full px-3 py-2 border border-line rounded-lg focus:ring-2 focus:ring-brown-deep focus:border-transparent"
                    placeholder="Como essa pessoa pode te abrir portas? O que ela sabe sobre você?"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-brown-deep mb-2">Próxima ação</label>
                  <input
                    type="text"
                    value={novoContato.acao}
                    onChange={(e) => setNovoContato({ ...novoContato, acao: e.target.value })}
                    className="w-full px-3 py-2 border border-line rounded-lg focus:ring-2 focus:ring-brown-deep focus:border-transparent"
                    placeholder="Ex: Marcar um café, enviar mensagem..."
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={handleAdicionarContatoManual}
                    className="flex-1 bg-brown-deep text-paper px-4 py-2 rounded-lg hover:bg-brown transition-colors font-medium"
                  >
                    Adicionar Contato
                  </button>
                  <button
                    onClick={() => setMostraFormulario(false)}
                    className="flex-1 border border-line text-ink px-4 py-2 rounded-lg hover:bg-cream transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </Panel>
          </div>
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
                      <strong>Contato:</strong> {contato.nome}
                      {contato.relacao ? ` (${contato.relacao})` : ''}
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

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Users, Upload, Target, Network, Copy, CheckCircle2, Plus, X, Trash2 } from 'lucide-react';
import { Panel, Eyebrow } from '@/components/Panel';
import StandardLayout from '@/components/StandardLayout';
import { createClient } from '@/lib/supabase/client';
import type { Profile } from '@/lib/types';

interface Contact {
  id?: string;
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
    cor: 'bg-white border-gray-faint',
    bgPanel: 'bg-white border-gray-faint',
    textColor: 'text-black',
  },
  {
    id: 'ponte',
    label: 'Círculo da Ponte',
    descricao: 'Pessoas que podem me apresentar para outras oportunidades',
    cor: 'bg-white border-gray-faint',
    bgPanel: 'bg-white border-gray-faint',
    textColor: 'text-black',
  },
  {
    id: 'presenca',
    label: 'Círculo da Presença',
    descricao: 'Pessoas que me seguem mas com quem não conversei profundamente',
    cor: 'bg-white border-gray-faint',
    bgPanel: 'bg-white border-gray-faint',
    textColor: 'text-black',
  },
  {
    id: 'futuro',
    label: 'Círculo do Futuro',
    descricao: 'Pessoas que admiro mas ainda não tenho relação',
    cor: 'bg-white border-gray-faint',
    bgPanel: 'bg-white border-gray-faint',
    textColor: 'text-black',
  },
  {
    id: 'recomeço',
    label: 'Círculo do Recomeço',
    descricao: 'Pessoas que me conheceram em fases travadas - hora de mostrar quem sou',
    cor: 'bg-white border-gray-faint',
    bgPanel: 'bg-white border-gray-faint',
    textColor: 'text-black',
  },
];

export default function NetworkClient({ userId, profile }: { userId: string; profile: Profile | null }) {
  const router = useRouter();
  const supabase = createClient();
  const [aba, setAba] = useState<'circulo' | 'importar' | 'analise'>('circulo');
  const [contatos, setContatos] = useState<Contact[]>([]);
  const [salvando, setSalvando] = useState(false);
  const [carregando, setCarregando] = useState(true);
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

  useEffect(() => {
    async function carregarContatos() {
      const { data, error } = await supabase
        .from('contatos_rede')
        .select('id, nome, relacao, potencial, circulo, acao')
        .order('created_at', { ascending: true });

      if (!error && data) {
        setContatos(data as Contact[]);
      }
      setCarregando(false);
    }
    carregarContatos();
  }, []);

  const handleAdicionarContatoManual = async () => {
    if (!novoContato.nome.trim()) {
      alert('O nome é obrigatório');
      return;
    }

    setSalvando(true);
    const { data, error } = await supabase
      .from('contatos_rede')
      .insert({
        user_id: userId,
        nome: novoContato.nome.trim(),
        relacao: novoContato.relacao,
        potencial: novoContato.potencial,
        circulo: novoContato.circulo,
        acao: novoContato.acao,
      })
      .select()
      .single();
    setSalvando(false);

    if (error) {
      alert(`Não consegui salvar o contato: ${error.message}`);
      return;
    }

    setContatos([...contatos, { ...novoContato, id: data.id }]);

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

  const handleRemoverContato = async (id?: string) => {
    if (!id) return;
    if (!confirm('Remover este contato?')) return;

    const { error } = await supabase.from('contatos_rede').delete().eq('id', id);
    if (error) {
      alert(`Não consegui remover: ${error.message}`);
      return;
    }
    setContatos(contatos.filter((c) => c.id !== id));
  };

  const contatosPorCirculo = (circulo: string) => {
    return contatos.filter((c) => c.circulo === circulo);
  };

  return (
    <div className="flex flex-row w-full h-screen">

      <main className="flex-1 overflow-y-auto px-6 py-10 md:px-12 w-full">
        <Eyebrow>
          <Network size={14} />
          Círculos de Influência
        </Eyebrow>
        <h1 className="font-display text-3xl text-black mb-1">Sua Rede Estratégica</h1>
        <p className="text-sm text-gray-text max-w-xl mb-8">
          Mapeie seus contatos em círculos de influência e receba um plano de ação personalizado para 72 horas.
        </p>

        <div className="flex gap-4 mb-8 border-b border-gray-faint">
          <button
            onClick={() => setAba('circulo')}
            className={`pb-3 px-4 font-medium transition ${
              aba === 'circulo'
                ? 'border-b-2 border-brown text-black'
                : 'text-gray-text hover:text-black'
            }`}
          >
            <Users size={18} className="inline mr-2" />
            Meus Círculos
          </button>
          <button
            onClick={() => setAba('importar')}
            className={`pb-3 px-4 font-medium transition ${
              aba === 'importar'
                ? 'border-b-2 border-brown text-black'
                : 'text-gray-text hover:text-black'
            }`}
          >
            <Upload size={18} className="inline mr-2" />
            Importar LinkedIn
          </button>
          <button
            onClick={() => setAba('analise')}
            className={`pb-3 px-4 font-medium transition ${
              aba === 'analise'
                ? 'border-b-2 border-brown text-black'
                : 'text-gray-text hover:text-black'
            }`}
          >
            <Target size={18} className="inline mr-2" />
            Plano de Ação
          </button>
        </div>

        {aba === 'circulo' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
            {CIRCULOS.map((circulo) => {
              const count = contatosPorCirculo(circulo.id);
              return (
                <Panel key={circulo.id} className="border border-gray-faint bg-white shadow-sm">
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="min-w-0">
                        <h3 className="text-base font-display text-black flex items-center gap-2 mb-1">
                          {circulo.label}
                          <span className="bg-mint-light text-black border border-mint px-2 py-0.5 rounded-full text-xs font-medium tabular-nums">
                            {count.length}
                          </span>
                        </h3>
                        <p className="text-xs text-gray-text">{circulo.descricao}</p>
                      </div>
                      <button
                        onClick={() => abrirFormularioParaCirculo(circulo.id)}
                        className="flex items-center gap-1 text-xs font-medium text-black border border-gray-faint rounded-lg px-2.5 py-1.5 hover:bg-white transition shrink-0"
                      >
                        <Plus size={14} />
                        Adicionar
                      </button>
                    </div>

                    <div className="space-y-3">
                      {count.length > 0 && (
                        <div className="space-y-2">
                          {count.map((contato, idx) => (
                            <div
                              key={idx}
                              className="bg-white p-3 rounded border border-gray-faint hover:shadow-sm hover:border-brown/30 transition"
                            >
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <p className="font-medium text-black">{contato.nome}</p>
                                  {contato.relacao && (
                                    <p className="text-xs text-gray-text">{contato.relacao}</p>
                                  )}
                                </div>
                                <button
                                  onClick={() => handleRemoverContato(contato.id)}
                                  title="Remover contato"
                                  className="text-gray-text hover:text-black shrink-0"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                              {contato.potencial && (
                                <p className="text-xs text-gray-text mt-2 italic">{contato.potencial}</p>
                              )}
                              {contato.acao && (
                                <div className="bg-mint-light p-2 rounded mt-2 text-xs text-black">
                                  <strong>Ação:</strong> {contato.acao}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {count.length === 0 && !carregando && (
                        <p className="text-xs text-gray-text italic py-2">
                          Nenhum contato mapeado neste círculo.
                        </p>
                      )}
                    </div>
                  </div>
                </Panel>
              );
            })}
          </div>
        )}

        {aba === 'importar' && (
          <div className="space-y-6">
            <Panel className="p-8 border-2 border-mint max-w-2xl mx-auto">
              <h3 className="font-display text-2xl text-black mb-2 flex items-center gap-2">
                <Upload size={24} />
                Importar do LinkedIn
              </h3>
              <p className="text-sm text-gray-text mb-6">
                Exporte suas conexões do LinkedIn em bulk e categorize automaticamente em Círculos de Influência.
              </p>

              <button
                onClick={handleImportarCSV}
                className="w-full bg-brown-deep text-white px-6 py-3 rounded-lg font-medium hover:bg-brown transition mb-8 inline-flex items-center justify-center gap-2"
              >
                <Upload size={18} />
                Selecionar arquivo CSV
              </button>

              <div className="bg-mint-light border border-mint p-4 rounded-lg text-left text-sm text-mint space-y-2">
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
                <div className="bg-mint-light border border-mint p-4 rounded-lg mt-6">
                  <p className="text-sm text-mint">
                    <strong>✅ Contatos adicionados:</strong> {contatos.length}
                  </p>
                </div>
              )}
            </Panel>

            <Panel className="p-6 bg-brown-deep/5 border-2 border-dashed border-brown-deep text-center">
              <p className="text-black font-medium mb-2">💡 Prefere adicionar manualmente?</p>
              <p className="text-sm text-gray-text mb-4">
                Acesse "Meus Círculos" e clique em "Adicionar Contato" em cada círculo.
              </p>
              <button
                onClick={() => setAba('circulo')}
                className="inline-flex items-center gap-2 text-black hover:text-orange font-medium transition"
              >
                Ir para Meus Círculos
                <span>→</span>
              </button>
            </Panel>
          </div>
        )}

        {mostraFormulario && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <Panel className="max-w-2xl w-full border border-gray-faint">
              <div className="bg-white border-b border-gray-faint p-6 flex items-start justify-between">
                <div>
                  <h2 className="font-display text-2xl text-black">Adicionar Contato</h2>
                  <p className="text-sm text-gray-text mt-1">
                    {CIRCULOS.find((c) => c.id === novoContato.circulo)?.label}
                  </p>
                </div>
                <button
                  onClick={() => setMostraFormulario(false)}
                  className="text-gray-text hover:text-black transition"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-black mb-2">Nome *</label>
                  <input
                    type="text"
                    value={novoContato.nome}
                    onChange={(e) => setNovoContato({ ...novoContato, nome: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-faint rounded-lg focus:ring-2 focus:ring-brown-deep focus:border-transparent"
                    placeholder="Nome completo"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    Relação — onde vocês trabalharam juntos
                  </label>
                  <input
                    type="text"
                    value={novoContato.relacao}
                    onChange={(e) => setNovoContato({ ...novoContato, relacao: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-faint rounded-lg focus:ring-2 focus:ring-brown-deep focus:border-transparent"
                    placeholder="Ex: Itaú, time de Dados, 2021–2023"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-black mb-2">Círculo de Influência *</label>
                  <select
                    value={novoContato.circulo}
                    onChange={(e) => setNovoContato({ ...novoContato, circulo: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-faint rounded-lg focus:ring-2 focus:ring-brown-deep focus:border-transparent"
                  >
                    {CIRCULOS.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    Potencial de influência / insight
                  </label>
                  <textarea
                    value={novoContato.potencial}
                    onChange={(e) => setNovoContato({ ...novoContato, potencial: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-faint rounded-lg focus:ring-2 focus:ring-brown-deep focus:border-transparent"
                    placeholder="Como essa pessoa pode te abrir portas? O que ela sabe sobre você?"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-black mb-2">Próxima ação</label>
                  <input
                    type="text"
                    value={novoContato.acao}
                    onChange={(e) => setNovoContato({ ...novoContato, acao: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-faint rounded-lg focus:ring-2 focus:ring-brown-deep focus:border-transparent"
                    placeholder="Ex: Marcar um café, enviar mensagem..."
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={handleAdicionarContatoManual}
                    disabled={salvando}
                    className="flex-1 bg-brown-deep text-white px-4 py-2 rounded-lg hover:bg-brown transition-colors font-medium disabled:opacity-50"
                  >
                    {salvando ? 'Salvando...' : 'Adicionar Contato'}
                  </button>
                  <button
                    onClick={() => setMostraFormulario(false)}
                    className="flex-1 border border-gray-faint text-black px-4 py-2 rounded-lg hover:bg-white transition-colors"
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
            <Panel className="bg-mint-light border border-mint p-6">
              <h3 className="font-display text-xl text-mint mb-6">Seu Plano de Ação de 72 Horas</h3>

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
                      <h4 className="font-medium text-black">{circulo.label}</h4>
                    </div>
                    <p className="text-sm text-gray-text mb-3">
                      <strong>Contato:</strong> {contato.nome}
                      {contato.relacao ? ` (${contato.relacao})` : ''}
                    </p>
                    <p className="bg-white p-3 rounded text-sm text-black border-l-4 border-brown-deep mb-4">
                      "{mensagens[circulo.id] || 'Mensagem personalizada'}"
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleCopiarMensagem(mensagens[circulo.id] || '')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded text-sm font-medium transition ${
                          copiado === (mensagens[circulo.id] || '')
                            ? 'bg-green-100 text-green-700 border border-green-300'
                            : 'bg-brown-deep text-white hover:bg-brown'
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
                      <button className="flex-1 border border-brown-deep text-black py-2 px-3 rounded text-sm font-medium hover:bg-white transition">
                        Enviar no LinkedIn
                      </button>
                    </div>
                  </div>
                );
              })}
            </Panel>

            <Panel className="bg-white p-4">
              <p className="text-sm text-black">
                <strong>💡 Dica:</strong> Não precisa enviar para todos de uma vez. Comece pelos 5 do Círculo da Raiz, depois ponte, e assim por diante. Consistência &gt; Velocidade.
              </p>
            </Panel>
          </div>
        )}
      </main>
    </div>
  );
}

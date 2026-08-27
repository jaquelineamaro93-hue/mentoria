'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { posthog } from '@/lib/posthog';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import type { Profile } from '@/lib/types';


interface Enquete {
  id: string;
  titulo: string;
  descricao: string | null;
  data_inicio: string;
  data_fim: string;
  tipo: 'online' | 'presencial';
  ativo: boolean;
  permitir_multiplas: boolean;
}

interface EnqueteOpcao {
  id: string;
  enquete_id: string;
  texto: string;
  ordem: number;
}

interface VotoEnquete {
  id: string;
  enquete_id: string;
  user_id: string;
  opcao_id: string;
  nome_mentorado: string;
  created_at: string;
}

export default function VotarEncontroClient({
  profile,
}: {
  profile: Profile | null;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [enquetes, setEnquetes] = useState<Enquete[]>([]);
  const [opcoes, setOpcoes] = useState<EnqueteOpcao[]>([]);
  const [votosEnquete, setVotosEnquete] = useState<VotoEnquete[]>([]);
  const [selecoesEnquete, setSelecoesEnquete] = useState<Record<string, string | string[]>>({});
  const [enqueteAtiva, setEnqueteAtiva] = useState<string | null>(null);
  const ehPresencial = profile?.tipo_pacote === 'presencial';
  const [abaEnquete, setAbaEnquete] = useState<'online' | 'presencial'>(
    ehPresencial ? 'presencial' : 'online'
  );

  const enquetesDaAba = enquetes.filter((e) => e.tipo === abaEnquete);

  useEffect(() => {
    carregarEnquetes(abaEnquete);
  }, [abaEnquete]);

  async function carregarEnquetes(tipo: 'online' | 'presencial') {
    const { data: enquetesData } = await supabase
      .from('enquetes')
      .select('*')
      .eq('ativo', true)
      .eq('tipo', tipo)
      .order('data_inicio', { ascending: false });

    if (enquetesData) {
      setEnquetes(enquetesData as Enquete[]);

      if (enquetesData.length > 0) {
        setEnqueteAtiva(enquetesData[0].id);

        const { data: opcoesData } = await supabase
          .from('enquete_opcoes')
          .select('*')
          .in('enquete_id', enquetesData.map((e) => e.id))
          .order('ordem', { ascending: true });

        if (opcoesData) {
          setOpcoes(opcoesData as EnqueteOpcao[]);
        }

        const { data: votosData } = await supabase
          .from('votos_enquete')
          .select('*')
          .in('enquete_id', enquetesData.map((e) => e.id));

        if (votosData) {
          setVotosEnquete(votosData as VotoEnquete[]);
        }
      }
    }
  }

  async function handleSignOut() {
    posthog.capture('logout_realizado');
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  async function enviarVotoEnquete() {
    if (!enqueteAtiva || !selecoesEnquete[enqueteAtiva]) return;

    const enquete = enquetes.find((e) => e.id === enqueteAtiva);
    if (!enquete) return;

    setEnviando(true);
    try {
      const opcaoIds = Array.isArray(selecoesEnquete[enqueteAtiva])
        ? (selecoesEnquete[enqueteAtiva] as string[])
        : [selecoesEnquete[enqueteAtiva] as string];

      for (const opcaoId of opcaoIds) {
        const { error } = await supabase.from('votos_enquete').insert({
          enquete_id: enqueteAtiva,
          user_id: profile?.id,
          opcao_id: opcaoId,
          nome_mentorado: profile?.nome || 'Mentorado',
        });

        if (error) {
          alert(`Não consegui registrar seu voto: ${error.message}`);
          setEnviando(false);
          return;
        }
      }

      posthog.capture('voto_enquete_enviado', {
        enquete_id: enqueteAtiva,
        opcoes: opcaoIds,
      });
      setEnviado(true);
      await carregarEnquetes(abaEnquete);
    } catch (e) {
      console.error(e);
    }
    setEnviando(false);
  }

  if (enviado) {
    return (
    <>
      <div className="text-center py-12">
            <CheckCircle2 size={48} className="text-green-600 mb-4" />
            <h1 className="font-display text-2xl text-black mb-2">Seu voto foi registrado!</h1>
            <p className="text-sm text-gray-text">
              Obrigado por participar desta enquete!
            </p>
          </div>
        </>
  );
  }

  const contagemVotos = datasDaAba.map((data) => ({
    ...data,
    count: votosDaAba.filter((v) => v.data_escolhida === data.id).length,
  }));

  return (
    <>
      <p className="text-xs uppercase tracking-[0.2em] text-mint mb-2 bg-mint/10 px-3 py-1.5 rounded-md inline-flex items-center gap-2 border border-mint/20">Participação</p>
        <h1 className="font-display text-3xl text-black mb-1">Enquetes e Votações</h1>
        <p className="text-sm text-gray-text mb-8">
          Participar das enquetes {abaEnquete === 'presencial' ? 'presenciais' : 'online'} que importam para nossa comunidade.
        </p>


        {aba === 'enquetes' && (
          <>
            <div className="flex gap-4 mb-8 border-b border-gray-faint">
              <button
                onClick={() => setAbaEnquete('online')}
                className={`pb-3 px-4 font-medium transition ${
                  abaEnquete === 'online'
                    ? 'border-b-2 border-brown text-black'
                    : 'text-gray-text hover:text-black'
                }`}
              >
                Enquetes Online
              </button>
              <button
                onClick={() => setAbaEnquete('presencial')}
                className={`pb-3 px-4 font-medium transition ${
                  abaEnquete === 'presencial'
                    ? 'border-b-2 border-brown text-black'
                    : 'text-gray-text hover:text-black'
                }`}
              >
                Enquetes Presenciais
              </button>
            </div>

            {enquetesDaAba.length === 0 ? (
              <div className="bg-mint-light border border-mint rounded-2xl p-6 mb-8 flex gap-3">
                <AlertCircle size={18} className="text-mint flex-shrink-0 mt-0.5" />
                <div className="text-sm text-mint">
                  <p className="font-medium mb-1">Nenhuma enquete ativa</p>
                  <p>
                    Não há enquetes ativas no momento. Volte em breve para participar de novas
                    votações!
                  </p>
                </div>
              </div>
            ) : (
              <>
                {enqueteAtiva && enquetesDaAba.length > 0 && (
                  <div className="space-y-6">
                    {enquetesDaAba.map((enquete) => {
                      if (enquete.id !== enqueteAtiva) return null;

                      const opcoesEnquete = opcoes.filter((o) => o.enquete_id === enquete.id);
                      const votosEnqueteAtual = votosEnquete.filter(
                        (v) => v.enquete_id === enquete.id
                      );
                      const jaSeuVotoEnquete = votosEnqueteAtual.some(
                        (v) => v.user_id === profile?.id
                      );

                      return (
                        <div key={enquete.id}>
                          <h2 className="font-display text-lg text-black mb-2">{enquete.titulo}</h2>
                          {enquete.descricao && (
                            <p className="text-sm text-gray-text mb-4">{enquete.descricao}</p>
                          )}

                          {jaSeuVotoEnquete && (
                            <div className="bg-mint-light border border-mint rounded-2xl p-4 mb-4">
                              <p className="text-sm text-mint">Você já votou nesta enquete</p>
                            </div>
                          )}

                          <div className="space-y-2 mb-6">
                            {enquete.permitir_multiplas ? (
                              opcoesEnquete.map((opcao) => (
                                <label
                                  key={opcao.id}
                                  className="flex items-center gap-3 p-4 border border-gray-faint rounded-lg hover:border-brown-deep cursor-pointer transition-colors"
                                >
                                  <input
                                    type="checkbox"
                                    value={opcao.id}
                                    checked={
                                      Array.isArray(selecoesEnquete[enquete.id])
                                        ? (
                                            selecoesEnquete[enquete.id] as string[]
                                          ).includes(opcao.id)
                                        : false
                                    }
                                    onChange={(e) => {
                                      const selections = Array.isArray(
                                        selecoesEnquete[enquete.id]
                                      )
                                        ? (selecoesEnquete[enquete.id] as string[])
                                        : [];
                                      if (e.target.checked) {
                                        setSelecoesEnquete((prev) => ({
                                          ...prev,
                                          [enquete.id]: [...selections, opcao.id],
                                        }));
                                      } else {
                                        setSelecoesEnquete((prev) => ({
                                          ...prev,
                                          [enquete.id]: selections.filter((id) => id !== opcao.id),
                                        }));
                                      }
                                    }}
                                    disabled={jaSeuVotoEnquete}
                                    className="w-4 h-4 text-black cursor-pointer"
                                  />
                                  <span className="text-sm text-black font-medium">
                                    {opcao.texto}
                                  </span>
                                  <span className="ml-auto text-xs text-gray-text">
                                    {votosEnqueteAtual.filter((v) => v.opcao_id === opcao.id)
                                      .length}{' '}
                                    voto
                                    {votosEnqueteAtual.filter((v) => v.opcao_id === opcao.id)
                                      .length !== 1
                                      ? 's'
                                      : ''}
                                  </span>
                                </label>
                              ))
                            ) : (
                              opcoesEnquete.map((opcao) => (
                                <label
                                  key={opcao.id}
                                  className="flex items-center gap-3 p-4 border border-gray-faint rounded-lg hover:border-brown-deep cursor-pointer transition-colors"
                                >
                                  <input
                                    type="radio"
                                    name={`enquete-${enquete.id}`}
                                    value={opcao.id}
                                    checked={selecoesEnquete[enquete.id] === opcao.id}
                                    onChange={(e) => {
                                      setSelecoesEnquete((prev) => ({
                                        ...prev,
                                        [enquete.id]: e.target.value,
                                      }));
                                    }}
                                    disabled={jaSeuVotoEnquete}
                                    className="w-4 h-4 text-black cursor-pointer"
                                  />
                                  <span className="text-sm text-black font-medium">
                                    {opcao.texto}
                                  </span>
                                  <span className="ml-auto text-xs text-gray-text">
                                    {votosEnqueteAtual.filter((v) => v.opcao_id === opcao.id)
                                      .length}{' '}
                                    voto
                                    {votosEnqueteAtual.filter((v) => v.opcao_id === opcao.id)
                                      .length !== 1
                                      ? 's'
                                      : ''}
                                  </span>
                                </label>
                              ))
                            )}
                          </div>

                          {!jaSeuVotoEnquete && (
                            <button
                              onClick={enviarVotoEnquete}
                              disabled={!selecoesEnquete[enquete.id] || enviando}
                              className="w-full bg-brown-deep text-white py-3 rounded-lg font-medium hover:bg-brown transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {enviando ? 'Registrando...' : 'Confirmar meu voto'}
                            </button>
                          )}

                          {votosEnqueteAtual.length > 0 && (
                            <>
                              <h3 className="font-display text-sm text-black mt-6 mb-3">
                                Quem votou
                              </h3>
                              <div className="bg-white border border-gray-faint rounded-xl p-4 max-h-64 overflow-y-auto">
                                <div className="space-y-2">
                                  {votosEnqueteAtual.map((v) => (
                                    <div
                                      key={v.id}
                                      className="flex items-center justify-between text-sm py-2 border-b border-gray-faint last:border-b-0"
                                    >
                                      <span className="text-black font-medium">
                                        {v.nome_mentorado}
                                      </span>
                                      <span className="text-xs text-gray-text">
                                        {opcoesEnquete.find((o) => o.id === v.opcao_id)?.texto}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </>
  );
}

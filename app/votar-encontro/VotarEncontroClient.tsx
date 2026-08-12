'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { posthog } from '@/lib/posthog';
import Sidebar from '@/components/Sidebar';
import { AlertCircle, CheckCircle2, Users, TrendingUp } from 'lucide-react';
import type { Profile } from '@/lib/types';

const DATAS_ENCONTROS = [
  { id: '22-08', label: 'Sábado, 22 de agosto', data: '2026-08-22' },
  { id: '29-08', label: 'Sábado, 29 de agosto', data: '2026-08-29' },
  { id: '05-09', label: 'Sábado, 5 de setembro', data: '2026-09-05' },
];

const DATAS_ONLINE: { id: string; label: string; data: string }[] = [];

const HORARIO = '11:30 às 17h';
const LOCAL = 'Pinheiros, São Paulo';

interface VotoEncontro {
  id: string;
  user_id: string;
  tipo: 'online' | 'presencial';
  data_escolhida: string;
  nome_mentorado: string;
  created_at: string;
}

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
  const [voto, setVoto] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [votos, setVotos] = useState<VotoEncontro[]>([]);
  const [jaSeuVoto, setJaSeuVoto] = useState(false);
  const [aba, setAba] = useState<'encontros' | 'enquetes'>('encontros');
  const [enquetes, setEnquetes] = useState<Enquete[]>([]);
  const [opcoes, setOpcoes] = useState<EnqueteOpcao[]>([]);
  const [votosEnquete, setVotosEnquete] = useState<VotoEnquete[]>([]);
  const [selecoesEnquete, setSelecoesEnquete] = useState<Record<string, string | string[]>>({});
  const [enqueteAtiva, setEnqueteAtiva] = useState<string | null>(null);
  const ehPresencial = profile?.tipo_pacote === 'presencial';
  const [abaDados, setAbaDados] = useState<'online' | 'presencial'>(
    ehPresencial ? 'presencial' : 'online'
  );
  const [abaEnquete, setAbaEnquete] = useState<'online' | 'presencial'>(
    ehPresencial ? 'presencial' : 'online'
  );

  const datasDaAba = abaDados === 'presencial' ? DATAS_ENCONTROS : DATAS_ONLINE;
  const votosDaAba = votos.filter((v) => v.tipo === abaDados);
  const enquetesDaAba = enquetes.filter((e) => e.tipo === abaEnquete);

  useEffect(() => {
    carregarVotos();
  }, [profile]);

  useEffect(() => {
    carregarEnquetes(abaEnquete);
  }, [abaEnquete]);

  async function carregarVotos() {
    if (!profile?.id) return;

    const { data } = await supabase
      .from('votos_encontro')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) {
      setVotos(data as VotoEncontro[]);
    }
  }

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

  useEffect(() => {
    const meuVoto = votos.find((v) => v.user_id === profile?.id && v.tipo === abaDados);
    setJaSeuVoto(Boolean(meuVoto));
    setVoto(meuVoto?.data_escolhida ?? null);
    setEnviado(false);
  }, [abaDados, votos, profile?.id]);

  async function handleSignOut() {
    posthog.capture('logout_realizado');
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  async function enviarVoto() {
    if (!voto || jaSeuVoto) return;

    setEnviando(true);
    try {
      const { error } = await supabase.from('votos_encontro').insert({
        user_id: profile?.id,
        tipo: abaDados,
        data_escolhida: voto,
        nome_mentorado: profile?.nome || 'Mentorado',
      });

      if (error) {
        alert(`Não consegui registrar seu voto: ${error.message}`);
      } else {
        posthog.capture('voto_encontro_enviado', { data: voto, tipo: abaDados });
        setEnviado(true);
        await carregarVotos();
      }
    } catch (e) {
      console.error(e);
    }
    setEnviando(false);
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

  if (enviado && (jaSeuVoto || aba === 'enquetes')) {
    return (
      <div className="flex flex-row w-full h-screen">
        <Sidebar profile={profile} onSignOut={handleSignOut} />
        <main className="flex-1 overflow-y-auto px-6 py-8 md:px-12 md:py-12 w-full">
          <div className="text-center py-12">
            <CheckCircle2 size={48} className="text-green-600 mx-auto mb-4" />
            <h1 className="font-display text-2xl text-brown-deep mb-2">Seu voto foi registrado!</h1>
            {aba === 'encontros' && (
              <>
                <p className="text-sm text-ink-faint mb-8">
                  Você escolheu {datasDaAba.find((d) => d.id === voto)?.label}.
                </p>
                <p className="text-sm text-ink-faint">
                  Acompanhe aqui quem mais já votou e qual data está vencendo. 💪
                </p>
              </>
            )}
            {aba === 'enquetes' && (
              <p className="text-sm text-ink-faint">
                Obrigado por participar desta enquete!
              </p>
            )}
          </div>
        </main>
      </div>
    );
  }

  const contagemVotos = datasDaAba.map((data) => ({
    ...data,
    count: votosDaAba.filter((v) => v.data_escolhida === data.id).length,
  }));

  return (
    <div className="flex flex-row w-full h-screen">
      <Sidebar profile={profile} onSignOut={handleSignOut} />

      <main className="flex-1 overflow-y-auto px-6 py-8 md:px-12 md:py-12 w-full">
        <p className="text-xs uppercase tracking-[0.2em] text-sky-deep mb-2">Participação</p>
        <h1 className="font-display text-3xl text-brown-deep mb-1">
          {aba === 'encontros' ? 'Qual é o melhor dia?' : 'Enquetes e Votações'}
        </h1>
        <p className="text-sm text-ink-faint max-w-xl mb-8">
          {aba === 'encontros'
            ? abaDados === 'presencial'
              ? `Vote na data que funciona melhor para você. Encontro em ${LOCAL}, das ${HORARIO}.`
              : 'Vote na data que funciona melhor para você no próximo encontro online.'
            : `Participar das enquetes ${abaEnquete === 'presencial' ? 'presenciais' : 'online'} que importam para nossa comunidade.`}
        </p>

        <div className="flex gap-4 mb-8 border-b border-line">
          <button
            onClick={() => setAba('encontros')}
            className={`pb-3 px-4 font-medium transition ${
              aba === 'encontros'
                ? 'border-b-2 border-brown text-brown-deep'
                : 'text-ink-soft hover:text-ink'
            }`}
          >
            Encontros
          </button>
          <button
            onClick={() => setAba('enquetes')}
            className={`pb-3 px-4 font-medium transition ${
              aba === 'enquetes'
                ? 'border-b-2 border-brown text-brown-deep'
                : 'text-ink-soft hover:text-ink'
            }`}
          >
            Enquetes
          </button>
        </div>

        {aba === 'encontros' && (
          <div className="flex gap-4 mb-8 border-b border-line">
            <button
              onClick={() => setAbaDados('online')}
              className={`pb-3 px-4 font-medium transition ${
                abaDados === 'online'
                  ? 'border-b-2 border-brown text-brown-deep'
                  : 'text-ink-soft hover:text-ink'
              }`}
            >
              Encontros Online
            </button>
            <button
              onClick={() => setAbaDados('presencial')}
              className={`pb-3 px-4 font-medium transition ${
                abaDados === 'presencial'
                  ? 'border-b-2 border-brown text-brown-deep'
                  : 'text-ink-soft hover:text-ink'
              }`}
            >
              Encontros Presenciais
            </button>
          </div>
        )}

        {aba === 'encontros' && (
          <>
            {abaDados === 'online' && DATAS_ONLINE.length === 0 && (
              <div className="bg-sky-tint border border-sky rounded-2xl p-6 mb-8 flex gap-3">
                <AlertCircle size={18} className="text-sky-deep flex-shrink-0 mt-0.5" />
                <div className="text-sm text-sky-deep">
                  <p className="font-medium mb-1">Votação ainda não aberta</p>
                  <p>
                    As datas dos próximos encontros online ainda não foram definidas. Assim que
                    abrirem, elas aparecem aqui e você recebe um aviso por e-mail.
                  </p>
                </div>
              </div>
            )}

            {abaDados === 'presencial' && !ehPresencial && (
              <div className="bg-sky-tint border border-sky rounded-2xl p-6 mb-8 flex gap-3">
                <AlertCircle size={18} className="text-sky-deep flex-shrink-0 mt-0.5" />
                <div className="text-sm text-sky-deep">
                  <p className="font-medium mb-1">Votação exclusiva do Plano Presencial</p>
                  <p>
                    Esta votação é exclusiva para membros do Plano Presencial SOMA. Caso deseje fazer
                    um upgrade de plano, entre em contato com a equipe.
                  </p>
                </div>
              </div>
            )}

            {((abaDados === 'presencial' && ehPresencial) || abaDados === 'online') &&
              datasDaAba.length > 0 && (
              <>
        {jaSeuVoto && (
          <div className="bg-sky-tint border border-sky rounded-2xl p-5 mb-8">
            <p className="text-sm text-sky-deep">
              Você já votou em {datasDaAba.find((d) => d.id === voto)?.label}
            </p>
          </div>
        )}

        <h2 className="font-display text-lg text-brown-deep mb-4">Escolha seu dia</h2>
        <div className="space-y-3 mb-8">
          {datasDaAba.map((data) => {
            const count = contagemVotos.find((c) => c.id === data.id)?.count || 0;
            return (
              <label
                key={data.id}
                className="flex items-center gap-3 p-4 border border-line rounded-lg hover:border-brown-deep cursor-pointer transition-colors"
              >
                <input
                  type="radio"
                  name="data"
                  value={data.id}
                  checked={voto === data.id}
                  onChange={(e) => setVoto(e.target.value)}
                  disabled={jaSeuVoto}
                  className="w-4 h-4 text-brown-deep cursor-pointer"
                />
                <div className="flex-1">
                  <p className="text-sm font-medium text-brown-deep">{data.label}</p>
                  {abaDados === 'presencial' && (
                    <p className="text-xs text-ink-faint">{HORARIO}</p>
                  )}
                </div>
                <div className="flex items-center gap-1 bg-sky-deep/10 px-2.5 py-1 rounded-full">
                  <Users size={13} className="text-sky-deep" />
                  <span className="text-xs font-medium text-sky-deep">{count}</span>
                </div>
              </label>
            );
          })}
        </div>

        {!jaSeuVoto && (
          <button
            onClick={enviarVoto}
            disabled={!voto || enviando}
            className="w-full bg-brown-deep text-white py-3 rounded-lg font-medium hover:bg-brown transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {enviando ? 'Registrando...' : 'Confirmar meu voto'}
          </button>
        )}

        {votosDaAba.length > 0 && (
          <>
            <h3 className="font-display text-sm text-brown-deep mt-8 mb-4">Quem já votou</h3>
            <div className="bg-white border border-line rounded-xl p-4 max-h-64 overflow-y-auto">
              <div className="space-y-2">
                {votosDaAba.map((v) => (
                  <div
                    key={v.id}
                    className="flex items-center justify-between text-sm py-2 border-b border-line last:border-b-0"
                  >
                    <span className="text-brown-deep font-medium">{v.nome_mentorado}</span>
                    <span className="text-xs text-ink-faint">
                      {datasDaAba.find((d) => d.id === v.data_escolhida)?.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
              </>
              )}
          </>
        )}

        {aba === 'enquetes' && (
          <>
            <div className="flex gap-4 mb-8 border-b border-line">
              <button
                onClick={() => setAbaEnquete('online')}
                className={`pb-3 px-4 font-medium transition ${
                  abaEnquete === 'online'
                    ? 'border-b-2 border-brown text-brown-deep'
                    : 'text-ink-soft hover:text-ink'
                }`}
              >
                Enquetes Online
              </button>
              <button
                onClick={() => setAbaEnquete('presencial')}
                className={`pb-3 px-4 font-medium transition ${
                  abaEnquete === 'presencial'
                    ? 'border-b-2 border-brown text-brown-deep'
                    : 'text-ink-soft hover:text-ink'
                }`}
              >
                Enquetes Presenciais
              </button>
            </div>

            {enquetesDaAba.length === 0 ? (
              <div className="bg-sky-tint border border-sky rounded-2xl p-6 mb-8 flex gap-3">
                <AlertCircle size={18} className="text-sky-deep flex-shrink-0 mt-0.5" />
                <div className="text-sm text-sky-deep">
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
                          <h2 className="font-display text-lg text-brown-deep mb-2">{enquete.titulo}</h2>
                          {enquete.descricao && (
                            <p className="text-sm text-ink-faint mb-4">{enquete.descricao}</p>
                          )}

                          {jaSeuVotoEnquete && (
                            <div className="bg-sky-tint border border-sky rounded-2xl p-4 mb-4">
                              <p className="text-sm text-sky-deep">Você já votou nesta enquete</p>
                            </div>
                          )}

                          <div className="space-y-2 mb-6">
                            {enquete.permitir_multiplas ? (
                              opcoesEnquete.map((opcao) => (
                                <label
                                  key={opcao.id}
                                  className="flex items-center gap-3 p-4 border border-line rounded-lg hover:border-brown-deep cursor-pointer transition-colors"
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
                                    className="w-4 h-4 text-brown-deep cursor-pointer"
                                  />
                                  <span className="text-sm text-brown-deep font-medium">
                                    {opcao.texto}
                                  </span>
                                  <span className="ml-auto text-xs text-ink-faint">
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
                                  className="flex items-center gap-3 p-4 border border-line rounded-lg hover:border-brown-deep cursor-pointer transition-colors"
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
                                    className="w-4 h-4 text-brown-deep cursor-pointer"
                                  />
                                  <span className="text-sm text-brown-deep font-medium">
                                    {opcao.texto}
                                  </span>
                                  <span className="ml-auto text-xs text-ink-faint">
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
                              <h3 className="font-display text-sm text-brown-deep mt-6 mb-3">
                                Quem votou
                              </h3>
                              <div className="bg-white border border-line rounded-xl p-4 max-h-64 overflow-y-auto">
                                <div className="space-y-2">
                                  {votosEnqueteAtual.map((v) => (
                                    <div
                                      key={v.id}
                                      className="flex items-center justify-between text-sm py-2 border-b border-line last:border-b-0"
                                    >
                                      <span className="text-brown-deep font-medium">
                                        {v.nome_mentorado}
                                      </span>
                                      <span className="text-xs text-ink-faint">
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
      </main>
    </div>
  );
}

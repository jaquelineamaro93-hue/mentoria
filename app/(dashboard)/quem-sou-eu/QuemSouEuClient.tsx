'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ArrowLeft, ArrowRight, Compass, Sparkles, Loader2, Check } from 'lucide-react';
import { Panel, Eyebrow } from '@/components/Panel';
import { createClient } from '@/lib/supabase/client';
import { posthog, limparIdentidade } from '@/lib/posthog';
import { BLOCOS_QUEM_SOU_EU } from '@/lib/prompts';
import type {
  BussolaPosicionamento,
  MapaEssencia,
  Profile,
  QuemSouEuResposta,
} from '@/lib/types';

interface Props {
  profile: Profile | null;
  userId: string;
  respostasIniciais: QuemSouEuResposta[];
  mapaInicial: MapaEssencia | null;
  bussolaInicial: BussolaPosicionamento | null;
}

export default function QuemSouEuClient({
  profile,
  userId,
  respostasIniciais,
  mapaInicial,
  bussolaInicial,
}: Props) {
  const router = useRouter();
  const supabase = createClient();

  const respostasMap: Record<string, string> = {};
  respostasIniciais.forEach((r) => {
    respostasMap[r.bloco] = r.resposta;
  });

  const [respostas, setRespostas] = useState<Record<string, string>>(respostasMap);
  const primeiroNaoRespondido = BLOCOS_QUEM_SOU_EU.findIndex(
    (b) => !respostasMap[b.codigo]?.trim()
  );
  const [passo, setPasso] = useState(
    primeiroNaoRespondido === -1 ? BLOCOS_QUEM_SOU_EU.length - 1 : primeiroNaoRespondido
  );
  const [blocosSalvos, setBlocosSalvos] = useState<Set<string>>(
    new Set(respostasIniciais.map((r) => r.bloco))
  );
  const [salvando, setSalvando] = useState(false);
  const [gerandoMapa, setGerandoMapa] = useState(false);
  const [gerandoBussola, setGerandoBussola] = useState(false);
  const [mapa, setMapa] = useState<MapaEssencia | null>(mapaInicial);
  const [bussola, setBussola] = useState<BussolaPosicionamento | null>(bussolaInicial);
  const [erro, setErro] = useState<string | null>(null);

  const bloco = BLOCOS_QUEM_SOU_EU[passo];
  const totalBlocos = BLOCOS_QUEM_SOU_EU.length;
  const concluidos = blocosSalvos.size;
  const todosRespondidos = concluidos >= totalBlocos;

  async function handleSignOut() {
    posthog.capture('logout_realizado');
    await supabase.auth.signOut();
    limparIdentidade();
    router.push('/login');
    router.refresh();
  }

  async function salvarBlocoAtual(): Promise<boolean> {
    const texto = respostas[bloco.codigo]?.trim();
    if (!texto) return false;

    setSalvando(true);
    setErro(null);
    const { error } = await supabase.from('quem_sou_eu_respostas').upsert(
      {
        user_id: userId,
        bloco: bloco.codigo,
        resposta: texto,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,bloco' }
    );

    setSalvando(false);

    if (error) {
      setErro('Não consegui salvar esse bloco. Confira sua internet e tente de novo.');
      return false;
    }

    setBlocosSalvos((prev) => new Set(prev).add(bloco.codigo));
    posthog.capture('quem_sou_eu_bloco_salvo', { bloco: bloco.codigo });
    return true;
  }

  async function irParaBloco(indice: number) {
    if (indice === passo) return;
    await salvarBlocoAtual();
    setPasso(indice);
  }

  async function irParaProximo() {
    const salvou = await salvarBlocoAtual();
    if (!salvou) return;
    if (passo < totalBlocos - 1) {
      setPasso(passo + 1);
    }
  }

  async function gerarMapa() {
    setGerandoMapa(true);
    setErro(null);
    try {
      const res = await fetch('/api/gerar-mapa-essencia', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMapa(data.mapa);
      posthog.capture('mapa_essencia_gerado');
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível gerar o mapa agora.');
    }
    setGerandoMapa(false);
  }

  async function gerarBussola() {
    setGerandoBussola(true);
    setErro(null);
    try {
      const res = await fetch('/api/gerar-bussola', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setBussola(data.bussola);
      posthog.capture('bussola_gerada');
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível gerar a bússola agora.');
    }
    setGerandoBussola(false);
  }

  return (
    <>
      <div className="flex flex-col lg:flex-row">
        <div className="hidden lg:block w-[240px] shrink-0 border-r border-gray-faint p-8">
          <p className="text-[11px] uppercase tracking-wide text-gray-text mb-4">
            {concluidos} de {totalBlocos} blocos
          </p>
          <div className="flex flex-col gap-1">
            {BLOCOS_QUEM_SOU_EU.map((b, i) => {
              const respondido = blocosSalvos.has(b.codigo);
              const ativo = i === passo;
              return (
                <button
                  key={b.codigo}
                  onClick={() => irParaBloco(i)}
                  className={`flex items-center gap-2.5 text-left px-3 py-2 rounded-lg text-[13px] transition-colors ${
                    ativo
                      ? 'bg-mint-light text-black'
                      : 'text-gray-text hover:bg-white'
                  }`}
                >
                  <span
                    className={`w-4 h-4 rounded-full border flex items-center justify-center text-[9px] shrink-0 ${
                      respondido
                        ? 'bg-brown border-brown text-white'
                        : 'border-gray-faint text-gray-text'
                    }`}
                  >
                    {respondido ? <Check size={10} /> : i + 1}
                  </span>
                  {b.titulo}
                </button>
              );
            })}
          </div>
        </div>

        <main className="flex-1 px-0 py-0 xl:">
          <p className="text-xs uppercase tracking-[0.2em] text-mint mb-2 bg-mint/10 px-3 py-1.5 rounded-md inline-flex items-center gap-2 border border-mint/20">
            Mapa Quem Sou Eu · bloco {passo + 1} de {totalBlocos}
          </p>
          <h1 className="font-display text-3xl text-black mb-1">{bloco.titulo}</h1>
          {bloco.subtitulo && (
            <p className="text-sm text-gray-text mb-6">{bloco.subtitulo}</p>
          )}

          {erro && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-4 py-2.5 mb-6">
              {erro}
            </p>
          )}

          <Panel className="p-6 mb-8">
            <p className="text-sm text-black leading-relaxed mb-4">{bloco.pergunta}</p>
            <p className="text-xs text-gray-text italic mb-5">Exemplo: {bloco.exemplo}</p>

            <textarea
              value={respostas[bloco.codigo] ?? ''}
              onChange={(e) =>
                setRespostas((prev) => ({ ...prev, [bloco.codigo]: e.target.value }))
              }
              rows={7}
              placeholder="Escreva com calma, sem se preocupar em organizar. Deixe fluir."
              className="w-full bg-white border border-gray-faint rounded-lg px-4 py-3 text-sm text-black focus:border-mint-deep resize-none"
            />

            <div className="flex items-center justify-between mt-5">
              <button
                onClick={() => setPasso(Math.max(0, passo - 1))}
                disabled={passo === 0}
                className="flex items-center gap-1.5 text-sm text-gray-text hover:text-orange disabled:opacity-40 transition-colors"
              >
                <ArrowLeft size={15} /> Voltar
              </button>

              {passo < totalBlocos - 1 ? (
                <button
                  onClick={irParaProximo}
                  disabled={salvando || !respostas[bloco.codigo]?.trim()}
                  className="flex items-center gap-2 bg-brown hover:bg-brown-deep disabled:opacity-50 text-white text-sm font-medium px-5 py-2.5 rounded-full transition-colors"
                >
                  {salvando ? <Loader2 size={15} className="animate-spin" /> : null}
                  Continuar <ArrowRight size={15} />
                </button>
              ) : (
                <button
                  onClick={salvarBlocoAtual}
                  disabled={salvando || !respostas[bloco.codigo]?.trim()}
                  className="flex items-center gap-2 bg-brown hover:bg-brown-deep disabled:opacity-50 text-white text-sm font-medium px-5 py-2.5 rounded-full transition-colors"
                >
                  {salvando ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
                  Salvar último bloco
                </button>
              )}
            </div>
          </Panel>

          {todosRespondidos && (
            <section className="mb-10">
              <Eyebrow>
                <Compass size={13} /> Síntese
              </Eyebrow>

              {erro && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-4 py-2.5 mb-4">
                  {erro}
                </p>
              )}

              {!mapa ? (
                <Panel className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <p className="text-black mb-1">Você respondeu os 9 blocos</p>
                    <p className="text-sm text-gray-text">
                      Gere agora o seu Mapa de Essência, uma síntese visual de tudo que você
                      trouxe.
                    </p>
                  </div>
                  <button
                    onClick={gerarMapa}
                    disabled={gerandoMapa}
                    className="shrink-0 flex items-center gap-2 bg-brown hover:bg-brown-deep disabled:opacity-60 text-white text-sm font-medium px-5 py-2.5 rounded-full transition-colors"
                  >
                    {gerandoMapa ? (
                      <Loader2 size={15} className="animate-spin" />
                    ) : (
                      <Sparkles size={15} />
                    )}
                    {gerandoMapa ? 'Gerando...' : 'Gerar Mapa de Essência'}
                  </button>
                </Panel>
              ) : (
                <>
                  <Panel className="p-6 mb-3 prose prose-sm  prose-headings:font-display prose-headings:text-black prose-p:text-black prose-li:text-black">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{mapa.conteudo_markdown}</ReactMarkdown>
                  </Panel>
                  <button
                    onClick={gerarMapa}
                    disabled={gerandoMapa}
                    className="flex items-center gap-1.5 text-xs text-gray-text hover:text-orange transition-colors mb-4"
                  >
                    {gerandoMapa ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <Sparkles size={12} />
                    )}
                    Gerar novamente
                  </button>
                </>
              )}

              {mapa && !bussola && (
                <Panel className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <p className="text-black mb-1">Mapa pronto</p>
                    <p className="text-sm text-gray-text">
                      Agora gere sua Bússola de Posicionamento, a tradução do seu mapa em
                      direção estratégica de carreira.
                    </p>
                  </div>
                  <button
                    onClick={gerarBussola}
                    disabled={gerandoBussola}
                    className="shrink-0 flex items-center gap-2 bg-mint-deep hover:bg-brown-deep disabled:opacity-60 text-white text-sm font-medium px-5 py-2.5 rounded-full transition-colors"
                  >
                    {gerandoBussola ? (
                      <Loader2 size={15} className="animate-spin" />
                    ) : (
                      <Compass size={15} />
                    )}
                    {gerandoBussola ? 'Gerando...' : 'Gerar Bússola de Posicionamento'}
                  </button>
                </Panel>
              )}

              {bussola && (
                <>
                  <div className="grid sm:grid-cols-2 gap-3 mt-4">
                    <BussolaCard titulo="Norte · Essência" texto={bussola.norte} />
                    <BussolaCard titulo="Sul · Propósito" texto={bussola.sul} />
                    <BussolaCard titulo="Leste · Energia" texto={bussola.leste} />
                    <BussolaCard titulo="Oeste · Mensagem" texto={bussola.oeste} />
                    <BussolaCard
                      titulo="Centro · Presença"
                      texto={bussola.centro}
                      className="sm:col-span-2"
                    />
                  </div>
                  <button
                    onClick={gerarBussola}
                    disabled={gerandoBussola}
                    className="flex items-center gap-1.5 text-xs text-gray-text hover:text-orange transition-colors mt-3"
                  >
                    {gerandoBussola ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <Compass size={12} />
                    )}
                    Gerar novamente
                  </button>
                </>
              )}
            </section>
          )}
        </main>
      </div>
    </>
  );
}

function BussolaCard({
  titulo,
  texto,
  className = '',
}: {
  titulo: string;
  texto: string | null;
  className?: string;
}) {
  return (
    <Panel className={`p-5 ${className}`}>
      <p className="text-[11px] uppercase tracking-wide text-mint mb-2">{titulo}</p>
      <p className="text-sm text-black leading-relaxed">{texto}</p>
    </Panel>
  );
}

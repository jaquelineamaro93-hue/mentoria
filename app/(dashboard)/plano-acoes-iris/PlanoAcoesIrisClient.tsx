'use client';
import LocalizedText from '@/components/LocalizedText';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Check, CheckCircle2, Circle, ClipboardList, Plus, Sparkles, Trash2 } from 'lucide-react';
import type { RascunhoPlanoIris } from '@/lib/iris-mentoria-voz';

type Tema = 'transicao' | 'recolocacao' | 'crescimento' | 'monetizacao' | 'entrevistas' | 'outro';
type EtapaSalva = RascunhoPlanoIris['etapas'][number] & { concluida: boolean };
type PlanoSalvo = Omit<RascunhoPlanoIris,'etapas'> & {
  id: string; tema: Tema; etapas: EtapaSalva[]; created_at: string; updated_at: string;
};

const TEMAS: Array<{id:Tema; nome:string; explicacao:string}> = [
  {id:'transicao',nome:'Transição de carreira',explicacao:'Testar novos caminhos sem ignorar sua experiência'},
  {id:'recolocacao',nome:'Recolocação',explicacao:'Organizar o posicionamento e avançar nas oportunidades'},
  {id:'crescimento',nome:'Crescimento interno',explicacao:'Ganhar clareza, influência e evidências de entrega'},
  {id:'monetizacao',nome:'Renda com habilidades',explicacao:'Explorar oportunidades de renda com testes realistas'},
  {id:'entrevistas',nome:'Entrevistas',explicacao:'Treinar respostas e comunicar melhor seus resultados'},
  {id:'outro',nome:'Outro objetivo',explicacao:'Trabalhar o que mais importa no seu momento'},
];

async function requisitar<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, { credentials:'same-origin',cache:'no-store',...options });
  const data = await res.json() as T & {erro?:string};
  if (!res.ok) throw new Error(data.erro || 'Não consegui concluir sua solicitação.');
  return data;
}

export default function PlanoAcoesIrisClient() {
  const [nome, setNome] = useState('');
  const [planos, setPlanos] = useState<PlanoSalvo[]>([]);
  const [planoId, setPlanoId] = useState<string | null>(null);
  const [tema, setTema] = useState<Tema>('transicao');
  const [objetivo, setObjetivo] = useState('');
  const [rascunho, setRascunho] = useState<RascunhoPlanoIris | null>(null);
  const [criando, setCriando] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [gerando, setGerando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [alterando, setAlterando] = useState<number | null>(null);
  const [apagando, setApagando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [mensagem, setMensagem] = useState('');

  const carregar = useCallback(async (selecionarPrimeiro = false) => {
    const data = await requisitar<{planos:PlanoSalvo[];nome:string;objetivo_inicial?:string}>('/api/copiloto/plano-acoes');
    setPlanos(data.planos || []);
    setNome(data.nome || '');
    setPlanoId(atual => selecionarPrimeiro || !atual
      ? (data.planos[0]?.id || null)
      : data.planos.some(p=>p.id===atual) ? atual : (data.planos[0]?.id || null));
    setObjetivo(atual => atual || data.objetivo_inicial || '');
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await requisitar<{planos:PlanoSalvo[];nome:string;objetivo_inicial?:string}>('/api/copiloto/plano-acoes');
        if (!mounted) return;
        setPlanos(data.planos || []);
        setNome(data.nome || '');
        setPlanoId(data.planos[0]?.id || null);
        setObjetivo(data.objetivo_inicial || '');
        setCriando(!(data.planos?.length));
      } catch(e) {
        if (mounted) setErro(e instanceof Error?e.message:'Não foi possível abrir seus planos.');
      } finally {
        if (mounted) setCarregando(false);
      }
    })();
    return () => { mounted=false; };
  }, []);

  const ativo = useMemo(() => planos.find(p => p.id===planoId) || null, [planos,planoId]);
  const concluidas = ativo?.etapas.filter(e=>e.concluida).length || 0;
  const percentual = ativo ? Math.round(concluidas/Math.max(1,ativo.etapas.length)*100) : 0;

  function novoPlano() {
    setCriando(true);
    setRascunho(null);
    setErro(null);
    setMensagem('');
  }

  async function gerarPlano() {
    if (objetivo.trim().length < 5) {
      setErro('Escreva em uma frase o resultado que você quer alcançar.');
      return;
    }
    setGerando(true); setErro(null); setMensagem(''); setRascunho(null);
    try {
      const data = await requisitar<{rascunho:RascunhoPlanoIris}>('/api/copiloto/plano-acoes',{
        method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({acao:'gerar',tema,objetivo:objetivo.trim()}),
      });
      setRascunho(data.rascunho);
      setMensagem('Seu rascunho está pronto. Ajuste os passos antes de salvar.');
    } catch(e) {
      setErro(e instanceof Error?e.message:'Não consegui gerar o plano.');
    } finally { setGerando(false); }
  }

  async function salvarPlano() {
    if (!rascunho) return;
    setSalvando(true); setErro(null); setMensagem('');
    try {
      const data = await requisitar<{sucesso:boolean;id:string}>('/api/copiloto/plano-acoes',{
        method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({acao:'salvar',confirmar:true,tema,rascunho}),
      });
      await carregar();
      setPlanoId(data.id);
      setCriando(false);
      setRascunho(null);
      setMensagem('Seu Plano de Ações da Íris foi salvo. Agora você pode acompanhar cada passo.');
    } catch(e) {
      setErro(e instanceof Error?e.message:'Não consegui salvar o plano.');
    } finally { setSalvando(false); }
  }

  async function alternarEtapa(indice:number,concluida:boolean) {
    if (!ativo || alterando!==null) return;
    setAlterando(indice); setErro(null);
    try {
      const data = await requisitar<{etapas:EtapaSalva[]}>('/api/copiloto/plano-acoes',{
        method:'PATCH',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({id:ativo.id,indice,concluida:!concluida}),
      });
      setPlanos(anteriores => anteriores.map(p => p.id===ativo.id ? {...p,etapas:data.etapas} : p));
    } catch(e) {
      setErro(e instanceof Error?e.message:'Não consegui atualizar esta etapa.');
    } finally { setAlterando(null); }
  }

  async function excluirPlano() {
    if (!ativo || !window.confirm('Excluir definitivamente este Plano de Ações da Íris?')) return;
    setApagando(true); setErro(null);setMensagem('');
    try {
      await requisitar<{sucesso:boolean}>('/api/copiloto/plano-acoes',{
        method:'DELETE',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({id:ativo.id,confirmar:true}),
      });
      await carregar(true);
      setMensagem('Plano excluído.');
    } catch(e) {
      setErro(e instanceof Error?e.message:'Não consegui excluir o plano.');
    } finally { setApagando(false); }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-7 pb-14">
      <header className="rounded-[26px] border border-[#d8e5dd] bg-[#f4f8f4] p-5 sm:p-8">
        <Link href="/dashboard" className="mb-5 inline-flex min-h-10 items-center gap-2 text-xs font-semibold text-[#426759] hover:underline">
          <ArrowLeft size={15} aria-hidden="true" /><LocalizedText text={"Voltar ao meu painel"} /></Link>
        <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.17em] text-[#0D8071]">
          <Sparkles size={15} aria-hidden="true" /><LocalizedText text={"Uma frente só sua"} /></p>
        <h1 className="mt-3 font-display text-3xl leading-tight text-[#1c3029] sm:text-4xl"><LocalizedText text={"Plano de Ação Íris"} /></h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-[#485d53] sm:text-base">
          {nome ? nome+', ' : ''}vamos transformar suas conversas em movimentos reais
          <span className="block"><LocalizedText text={"Sem atropelar seu ritmo e sem mexer no PDI ou nas outras etapas da mentoria."} /></span>
        </p>
        <div className="mt-5 flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-[#bdded1] bg-white px-3 py-1.5 text-xs font-semibold text-[#21594b]"><LocalizedText text={"Plano independente do PDI"} /></span>
          <span className="rounded-full border border-[#e0d6cc] bg-white px-3 py-1.5 text-xs font-semibold text-[#72574b]"><LocalizedText text={"Só salva com sua confirmação"} /></span>
        </div>
      </header>

      {carregando ? <p role="status" className="text-sm text-[#55675f]"><LocalizedText text={"Carregando seus planos..."} /></p> : null}
      {erro ? <p role="alert" className="rounded-xl border border-[#e8c4b9] bg-[#fff4f0] px-4 py-3 text-sm text-[#934c38]">{erro}</p> : null}
      {mensagem ? <p role="status" className="rounded-xl border border-[#b6dccc] bg-[#eff9f3] px-4 py-3 text-sm text-[#25644f]">{mensagem}</p> : null}

      {!carregando && (
        <div className="grid items-start gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
          <nav aria-label="Meus planos de ações da Íris" className="rounded-2xl border border-[#e2e7e2] bg-white p-3">
            <button type="button" onClick={novoPlano} className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#0D8071] px-3 py-2 text-sm font-semibold text-white hover:bg-[#09685d]">
              <Plus size={17} aria-hidden="true" /><LocalizedText text={"Criar um plano"} /></button>
            <p className="mb-2 mt-5 px-2 text-[11px] font-bold uppercase tracking-[0.15em] text-[#87968c]"><LocalizedText text={"Meus planos salvos"} /></p>
            {planos.length===0 ? (
              <p className="px-2 py-3 text-xs leading-5 text-[#75837a]"><LocalizedText text={"Você ainda não salvou nenhum plano. Pode começar com um rascunho."} /></p>
            ) : planos.map(p => (
              <button type="button" key={p.id} onClick={() => {setPlanoId(p.id);setCriando(false);setRascunho(null);setErro(null);setMensagem('');}}
                aria-current={!criando && p.id===planoId ? 'page' : undefined}
                className={'mb-1 flex min-h-11 w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs transition '+(!criando&&p.id===planoId?'bg-[#ebf7f1] font-bold text-[#21594b]':'text-[#536158] hover:bg-[#f5f7f5]')}>
                <ClipboardList size={16} aria-hidden="true" className="shrink-0" />
                <span className="min-w-0 flex-1 truncate">{p.titulo}</span>
              </button>
            ))}
          </nav>

          <main className="min-w-0">
            {criando ? (
              <div className="space-y-6 rounded-2xl border border-[#e0e7e0] bg-white p-5 sm:p-7">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.17em] text-[#0D8071]"><LocalizedText text={"Comece com o que é importante"} /></p>
                  <h2 className="mt-2 font-display text-2xl text-[#24392e]"><LocalizedText text={"O que vamos construir agora?"} /></h2>
                  <p className="mt-2 text-sm leading-6 text-[#687a6f]"><LocalizedText text={"A Íris aproveita o que você já registrou na SOMA. Não precisa repetir toda a sua trajetória."} /></p>
                </div>

                <div role="group" aria-label="Tema do plano" className="grid gap-2 sm:grid-cols-2">
                  {TEMAS.map(t => (
                    <button key={t.id} type="button" onClick={() => {setTema(t.id);setRascunho(null);}} aria-pressed={tema===t.id}
                      className={'rounded-xl border p-3 text-left transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0D8071] '+(tema===t.id?'border-[#0D8071] bg-[#f0faf5]':'border-[#e0e7e0] bg-white hover:border-[#9acabb]')}>
                      <strong className="block text-sm text-[#263b30]">{t.nome}</strong>
                      <span className="mt-1 block text-xs leading-5 text-[#78857c]">{t.explicacao}</span>
                    </button>
                  ))}
                </div>
                <div>
                  <label htmlFor="iris-objetivo" className="mb-2 block text-sm font-semibold text-[#334a3e]"><LocalizedText text={"Seu objetivo em uma frase"} /></label>
                  <textarea id="iris-objetivo" rows={3} maxLength={600} value={objetivo}
                    onChange={e => {setObjetivo(e.target.value);setRascunho(null);}}
                    placeholder="Ex.: quero migrar de operações para análise de dados sem começar do zero"
                    className="w-full resize-y rounded-xl border border-[#d7e4da] bg-white px-4 py-3 text-sm leading-6 text-[#27352d] focus:border-[#0D8071] focus:outline-none" />
                  <p className="mt-2 text-xs leading-5 text-[#768779]"><LocalizedText text={"Pode ser uma hipótese. A Íris organiza um primeiro caminho e você decide o que faz sentido."} /></p>
                </div>
                <button type="button" disabled={gerando || objetivo.trim().length<5} onClick={() => void gerarPlano()}
                  className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#0D8071] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#0a655b] disabled:opacity-50">
                  <Sparkles size={17} aria-hidden="true" /> {gerando?'Organizando seu plano...':'Criar rascunho com a Íris'}
                </button>

                {rascunho && (
                  <section aria-labelledby="rascunho-iris-title" className="space-y-5 border-t border-[#e2e8e0] pt-6">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#0D8071]"><LocalizedText text={"Revisão antes de salvar"} /></p>
                      <h3 id="rascunho-iris-title" className="mt-2 font-display text-2xl text-[#24392e]">{rascunho.titulo}</h3>
                      <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-[#526358]">{rascunho.diagnostico}</p>
                      <p className="mt-3 text-sm font-semibold text-[#2d5443]">Foco: {rascunho.foco}</p>
                    </div>
                    <div className="space-y-3">
                      {rascunho.etapas.map((etapa,i) => (
                        <div key={i} className="rounded-xl border border-[#e0e9e1] bg-[#fcfdfb] p-4">
                          <div className="flex items-start gap-3">
                            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#e3f4ec] text-xs font-bold text-[#16735f]">{i+1}</span>
                            <div className="min-w-0 flex-1 space-y-2">
                              <input aria-label={'Título da etapa '+(i+1)} maxLength={130} value={etapa.titulo}
                                onChange={e=>setRascunho(prev => prev ? {...prev,etapas:prev.etapas.map((it,j)=>j===i?{...it,titulo:e.target.value}:it)} : null)}
                                className="w-full rounded-md border border-transparent bg-transparent p-1 text-sm font-bold text-[#263a31] focus:border-[#6ba994] focus:outline-none" />
                              <textarea aria-label={'Como executar etapa '+(i+1)} rows={2} maxLength={700} value={etapa.descricao}
                                onChange={e=>setRascunho(prev => prev ? {...prev,etapas:prev.etapas.map((it,j)=>j===i?{...it,descricao:e.target.value}:it)} : null)}
                                className="w-full resize-y rounded-md border border-transparent bg-transparent p-1 text-sm leading-6 text-[#52675b] focus:border-[#6ba994] focus:outline-none" />
                              <p className="text-xs font-medium text-[#33705e]">Como saberei que avancei? {etapa.evidencia}</p>
                              <p className="text-xs text-[#8a7768]">{etapa.horizonte}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="rounded-xl border border-[#c4ddd1] bg-[#f3faf5] p-4 text-sm leading-6 text-[#426450]"><LocalizedText text={"Este rascunho ainda não foi salvo. Ao confirmar, ele ficará na sua conta para acompanhar o progresso. O PDI e as outras ferramentas da SOMA não são alterados."} /></div>
                    <div className="flex flex-wrap gap-3">
                      <button type="button" disabled={salvando} onClick={() => void salvarPlano()}
                        className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#0D8071] px-5 py-3 text-sm font-semibold text-white disabled:opacity-50">
                        <Check size={17} aria-hidden="true" /> {salvando?'Salvando...':'Confirmar e salvar meu plano'}
                      </button>
                      <button type="button" disabled={salvando || gerando} onClick={()=>setRascunho(null)}
                        className="min-h-11 rounded-xl border border-[#dce2db] px-4 py-3 text-sm text-[#526658]"><LocalizedText text={"Descartar rascunho"} /></button>
                    </div>
                  </section>
                )}
              </div>
            ) : ativo ? (
              <div className="space-y-6 rounded-2xl border border-[#e1e8df] bg-white p-5 sm:p-7">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="max-w-2xl">
                    <p className="text-xs font-bold uppercase tracking-[0.17em] text-[#0D8071]"><LocalizedText text={"Seu plano em movimento"} /></p>
                    <h2 className="mt-2 font-display text-2xl leading-tight text-[#24392e] sm:text-3xl">{ativo.titulo}</h2>
                    <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-[#5b6b60]">{ativo.diagnostico}</p>
                  </div>
                  <button type="button" onClick={() => void excluirPlano()} disabled={apagando}
                    className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-[#ebd9d2] px-3 text-xs font-medium text-[#a65d4e] hover:bg-[#fff4f0] disabled:opacity-50">
                    <Trash2 size={15} aria-hidden="true" /><LocalizedText text={"Excluir plano"} /></button>
                </div>
                <div className="rounded-xl bg-[#f2f7f2] p-4">
                  <p className="text-xs font-semibold text-[#567366]"><LocalizedText text={"Objetivo"} /></p>
                  <p className="mt-1 text-sm font-medium leading-6 text-[#2c4638]">{ativo.objetivo}</p>
                  <p className="mt-2 text-xs text-[#678070]">Foco: {ativo.foco}</p>
                </div>
                <div>
                  <div className="flex items-end justify-between gap-3">
                    <p className="text-sm font-semibold text-[#2c4437]"><LocalizedText text={"Seu avanço"} /></p>
                    <p className="text-sm font-bold text-[#0D8071]">{concluidas} de {ativo.etapas.length} etapas</p>
                  </div>
                  <div role="progressbar" aria-label="Progresso do Plano de Ações da Íris" aria-valuenow={percentual} aria-valuemin={0} aria-valuemax={100}
                    className="mt-2 h-2.5 overflow-hidden rounded-full bg-[#dcebe1]">
                    <div className="h-full rounded-full bg-[#0D8071] transition-[width]" style={{width:percentual+'%'}} />
                  </div>
                </div>
                <div className="space-y-3">
                  {ativo.etapas.map((etapa,i)=>(
                    <div key={i} className={'rounded-2xl border p-4 '+(etapa.concluida?'border-[#c1e5d1] bg-[#f5fbf6]':'border-[#e2e7e0] bg-white')}>
                      <div className="flex items-start gap-3">
                        <button type="button" disabled={alterando!==null} aria-label={'Marcar etapa '+(i+1)+(etapa.concluida?' como pendente':' como concluída')}
                          aria-pressed={etapa.concluida} onClick={()=>void alternarEtapa(i,etapa.concluida)}
                          className="grid h-11 w-11 shrink-0 place-items-center rounded-xl hover:bg-[#e4f2e9] focus-visible:outline-2 focus-visible:outline-[#0D8071] disabled:opacity-50">
                          {etapa.concluida?<CheckCircle2 size={23} className="text-[#0D8071]" aria-hidden="true"/>:<Circle size={23} className="text-[#7a9685]" aria-hidden="true"/>}
                        </button>
                        <div className="min-w-0 flex-1">
                          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#7e9386]">Etapa {i+1} · {etapa.horizonte}</p>
                          <h3 className={'mt-1 text-base font-semibold '+(etapa.concluida?'text-[#608171]':'text-[#253d2f]')}>{etapa.titulo}</h3>
                          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[#5e6f63]">{etapa.descricao}</p>
                          <p className="mt-3 rounded-lg bg-[#f1f6f1] p-3 text-xs leading-5 text-[#476555]"><strong><LocalizedText text={"Como medir o avanço:"} /></strong> {etapa.evidencia}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-xs leading-5 text-[#7b8a7b]"><LocalizedText text={"Este acompanhamento é pessoal e independente do PDI. Você decide quando marcar cada passo como concluído."} /></p>
              </div>
            ) : (
              <div className="rounded-2xl border border-[#e1e8df] bg-white p-6 text-center">
                <h2 className="font-display text-2xl text-[#253d30]"><LocalizedText text={"Seu próximo capítulo pode começar aqui"} /></h2>
                <button type="button" onClick={novoPlano} className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#0D8071] px-5 text-sm font-semibold text-white"><LocalizedText text={"Criar meu primeiro plano"} /><ArrowRight size={16} aria-hidden="true"/>
                </button>
              </div>
            )}
          </main>
        </div>
      )}
    </div>
  );
}

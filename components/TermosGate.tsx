'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { createClient } from '@/lib/supabase/client';
import { posthog } from '@/lib/posthog';
import type { TermoVersao } from '@/lib/types';

export default function TermosGate() {
  const supabase = useMemo(() => createClient(), []);
  const pathname = usePathname();
  const router = useRouter();
  const adiados = useRef(new Set<string>());
  const chaveExibida = useRef<string | null>(null);
  const [termo, setTermo] = useState<TermoVersao | null>(null);
  const [precisaAceitar, setPrecisaAceitar] = useState(false);
  const [marcado, setMarcado] = useState(false);
  const [podeAdiar, setPodeAdiar] = useState(false);
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [nomeMentoranda, setNomeMentoranda] = useState('');
  const [emailMentoranda, setEmailMentoranda] = useState('');

  useEffect(() => {
    let cancelado = false;

    // O termo é parte da área logada, nunca da página pública. A página
    // /termos já possui seu próprio botão de aceite e não precisa de modal.
    // Meu Plano também deve permitir consultar as condições da pausa sem
    // um bloqueio visual. O acesso à pausa exige o aceite na própria ação.
    const rotaSemModal = ['/ajuda', '/novidades', '/faq', '/termos', '/meu-plano', '/perfil', '/renovar'].some(
      (rota) => pathname === rota || pathname.startsWith(rota + '/')
    );
    setPrecisaAceitar(false);
    setTermo(null);
    setMarcado(false);
    if (rotaSemModal) return;

    async function checar() {
      // Não exige aceite de termos em nome de terceiros durante inspeção.
      // O token do retorno é validado no servidor.
      try {
        const resposta=await fetch('/api/inspecao/status',{cache:'no-store'});
        if(resposta.ok && (await resposta.json()).ativo)return;
      }catch {/* validação regular permanece em caso de falha da consulta */}
      const {data:{user},error:erroAuth}=await supabase.auth.getUser();
      if(cancelado || erroAuth || !user)return;

      const {data:perfil,error:erroPerfil}=await supabase.from('profiles')
        .select('nome,email,is_admin,status_assinatura,data_fim_acesso,trial_status,trial_ends_at')
        .eq('id',user.id).maybeSingle();

      // Exibir os termos aos usuários logados elegíveis, inclusive trial ativo e contas de teste/admin.
      if(cancelado || erroPerfil || !perfil)return;
      const pagoAtivo=perfil.status_assinatura==='ativo' && (!perfil.data_fim_acesso || perfil.data_fim_acesso>=new Date().toLocaleDateString('en-CA',{timeZone:'America/Sao_Paulo'}));
      const trialAtivo=perfil.trial_status==='active' && !!perfil.trial_ends_at && new Date(perfil.trial_ends_at).getTime()>Date.now();
      if(!perfil.is_admin && !pagoAtivo && !trialAtivo)return;

      const {data:pausa,error:erroPausa}=await supabase.from('mentoria_pausas')
        .select('id').eq('user_id',user.id).eq('status','ativa')
        .limit(1).maybeSingle();
      if(cancelado || erroPausa || pausa)return;

      const {data:careerContract,error:careerError}=await supabase.rpc('soma_has_career_contract');
      if(cancelado||careerError||careerContract)return;
      const {data:ultimoTermo,error:erroTermo}=await supabase.from('termos_versoes')
        .select('*').eq('ativo',true)
        .order('publicado_em',{ascending:false}).limit(1)
        .single<TermoVersao>();
      if(cancelado || erroTermo || !ultimoTermo)return;
      const chave=user.id+':'+ultimoTermo.id;
      if(adiados.current.has(chave))return;

      const {data:aceite,error:erroAceite}=await supabase.from('termos_aceites')
        .select('id').eq('user_id',user.id).eq('termo_id',ultimoTermo.id)
        .maybeSingle();
      if(cancelado || erroAceite || aceite)return;

      const {data:anteriores,error:erroAnteriores}=await supabase
        .from('termos_aceites').select('id').eq('user_id',user.id)
        .limit(1);
      if(cancelado || erroAnteriores)return;

      chaveExibida.current=chave;
      setNomeMentoranda(perfil.nome??'');
      setEmailMentoranda(perfil.email??user.email??'');
      setPodeAdiar(!!anteriores?.length);
      setTermo(ultimoTermo);
      setPrecisaAceitar(true);
    }

    void checar();
    return () => { cancelado=true; };
  }, [pathname,supabase]);

  async function aceitar() {
    if (!termo) return;
    setEnviando(true);
    setErro('');
    try {
      const {data:{user}}=await supabase.auth.getUser();
      if(!user)throw new Error('É necessário entrar na SOMA para aceitar o termo.');
      const {error}=await supabase.from('termos_aceites').insert({
        user_id:user.id,termo_id:termo.id,
      });
      if(error && error.code!=='23505')throw new Error('Não foi possível registrar o aceite. Tente novamente.');
      posthog.capture('termo_aceito',{versao:termo.versao});
      setPrecisaAceitar(false);
      router.refresh();
    }catch(e){setErro(e instanceof Error?e.message:'Falha ao salvar o aceite.');}
    finally{setEnviando(false);}
  }

  if (!precisaAceitar || !termo) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-8">
      <div className="w-full max-w-lg bg-white rounded-2xl border border-gray-faint max-h-[85vh] flex flex-col">
        <div className="p-6 border-b border-gray-faint">
          <p className="font-display text-2xl text-black">{termo.titulo}</p>
        </div>
        <div className="p-6 overflow-y-auto">
          <div className="mb-5 pb-5 border-b border-gray-faint grid grid-cols-2 gap-3">
            <div>
              <p className="text-[10px] uppercase tracking-wide text-gray-text mb-0.5">
                Programa
              </p>
              <p className="text-sm text-ink">SOMA Mentoria</p>
              <p className="text-xs text-gray-text">Programa de Desenvolvimento de Carreira</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wide text-gray-text mb-0.5">
                Mentoranda
              </p>
              <p className="text-sm text-ink">{nomeMentoranda || 'Carregando...'}</p>
              <p className="text-xs text-gray-text">{emailMentoranda}</p>
            </div>
          </div>
          <div className="prose prose-sm max-w-none prose-headings:font-display prose-headings:text-black prose-p:text-black prose-p:leading-relaxed prose-p:my-4 prose-strong:text-black prose-li:text-black prose-li:my-1">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{termo.conteudo_markdown}</ReactMarkdown>
          </div>
        </div>
        <div className="p-6 border-t border-gray-faint">
          <label className="flex items-start gap-2.5 mb-4 cursor-pointer">
            <input
              type="checkbox"
              checked={marcado}
              onChange={(e) => setMarcado(e.target.checked)}
              className="mt-0.5"
            />
            <span className="text-sm text-ink">
              Li e concordo com os termos acima.
            </span>
          </label>
          {erro && <p role="alert" className="mb-3 text-sm text-red-700">{erro}</p>}
          <button
            onClick={aceitar}
            disabled={!marcado || enviando}
            className="w-full bg-brown hover:bg-brown-deep disabled:opacity-50 text-white text-sm font-medium px-5 py-3 rounded-full transition-colors"
          >
            {enviando ? 'Salvando...' : 'Aceitar e continuar'}
          </button>
          {podeAdiar && (
            <button type="button" onClick={()=>{if(chaveExibida.current)adiados.current.add(chaveExibida.current);setPrecisaAceitar(false);}} disabled={enviando}
              className="mt-3 w-full rounded-full border border-gray-faint px-5 py-2.5 text-sm text-gray-text">
              Agora não. Continuar sob os termos anteriores
            </button>
          )}
          {podeAdiar && <p className="mt-2 text-xs text-gray-text">Sua participação atual não depende de aceitar a nova modalidade de pausa. Para utilizá-la, você poderá aceitar os termos atualizados em Meu Plano.</p>}
        </div>
      </div>
    </div>
  );
}

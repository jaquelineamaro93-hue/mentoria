'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { CheckCircle2 } from 'lucide-react';
import { Panel, Eyebrow } from '@/components/Panel';
import { createClient } from '@/lib/supabase/client';
import { posthog, limparIdentidade } from '@/lib/posthog';
import type { Profile, TermoVersao } from '@/lib/types';

interface Props {
  profile: Profile | null;
  termo: TermoVersao | null;
  aceitoEm: string | null;
}

export default function TermosClient({ profile, termo, aceitoEm }: Props) {
  const router = useRouter();
  const supabase = createClient();
  const [aceito,setAceito]=useState(aceitoEm);
  const [confirmou,setConfirmou]=useState(false);
  const [salvando,setSalvando]=useState(false);
  const [erro,setErro]=useState('');
  async function aceitarNovaVersao() {
    if(!profile?.id||!termo||!confirmou||aceito)return;
    setSalvando(true);setErro('');
    try{
      const {data:{user}}=await supabase.auth.getUser();
      if(!user||user.id!==profile.id)throw new Error('Entre na sua conta para aceitar os termos.');
      const {error}=await supabase.from('termos_aceites').insert({user_id:user.id,termo_id:termo.id});
      if(error && error.code!=='23505')throw new Error('Não foi possível salvar o aceite.');
      setAceito(new Date().toISOString());
      posthog.capture('termo_aceito',{versao:termo.versao,origem:'pagina_termos'});
      router.refresh();
    }catch(e){setErro(e instanceof Error?e.message:'Falha ao registrar o aceite');}
    finally{setSalvando(false);}
  }


  async function handleSignOut() {
    posthog.capture('logout_realizado');
    await supabase.auth.signOut();
    limparIdentidade();
    router.push('/login');
    router.refresh();
  }

  return (
    <>
      <div className="flex flex-col md:flex-row w-full">

      <main className="flex-1 px-6 py-10 md:px-12 w-full">
        <p className="text-xs uppercase tracking-[0.2em] text-mint mb-2 bg-mint/10 px-3 py-1.5 rounded-md inline-flex items-center gap-2 border border-mint/20">
          Consulta
        </p>
        <h1 className="font-display text-3xl text-black mb-1">
          {termo?.titulo ?? 'Termo de Aceite'}
        </h1>

        {aceito && (
          <p className="flex items-center gap-1.5 text-sm text-mint mb-6">
            <CheckCircle2 size={15} />
            Aceito em {new Date(aceito).toLocaleDateString('pt-BR')} às{' '}
            {new Date(aceito).toLocaleTimeString('pt-BR', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        )}

        {termo ? (
          <>
          <Panel className="p-6">
            <div className="mb-5 pb-5 border-b border-gray-faint grid sm:grid-cols-2 gap-3">
              <div>
                <p className="text-[10px] uppercase tracking-wide text-gray-text mb-0.5">
                  Programa
                </p>
                <p className="text-sm text-black">SOMA Mentoria</p>
                <p className="text-xs text-gray-text">Programa de Desenvolvimento de Carreira</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wide text-gray-text mb-0.5">
                  Mentoranda
                </p>
                <p className="text-sm text-black">{profile?.nome ?? 'Não identificado'}</p>
                <p className="text-xs text-gray-text">{profile?.email}</p>
              </div>
            </div>
            <div className="prose prose-sm  prose-headings:font-display prose-headings:text-black prose-p:text-black prose-p:leading-relaxed prose-p:my-4 prose-strong:text-black prose-li:text-black prose-li:my-1">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{termo.conteudo_markdown}</ReactMarkdown>
            </div>
          </Panel>
          {!aceito && (
            <div className="mt-5 rounded-xl border border-[#DCE8DF] bg-[#F7FAF7] p-5">
              <p className="font-medium text-black">Aceitar a versão {termo.versao}</p>
              <p className="mt-1 text-sm text-gray-text">Leia as condições antes de registrar seu novo aceite. Caso tenha um termo anterior, ele permanece registrado.</p>
              <label className="mt-4 flex items-start gap-2 text-sm text-black">
                <input type="checkbox" className="mt-1" checked={confirmou} onChange={e=>setConfirmou(e.target.checked)}/>
                <span>Li integralmente a nova versão e concordo com suas condições.</span>
              </label>
              <button type="button" disabled={!confirmou||salvando} onClick={()=>void aceitarNovaVersao()}
                className="mt-4 rounded-full bg-brown-deep px-5 py-2.5 text-sm text-white disabled:opacity-50">
                {salvando?'Registrando...':'Aceitar os termos atualizados'}
              </button>
              {erro&&<p role="alert" className="mt-3 text-sm text-red-700">{erro}</p>}
            </div>
          )}
          </>
        ) : (
          <p className="text-sm text-gray-text">Nenhum termo publicado ainda.</p>
        )}
      </main>
    </div>
    </>
  );
}

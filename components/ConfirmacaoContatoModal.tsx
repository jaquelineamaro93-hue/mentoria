'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { Profile } from '@/lib/types';

const opcoes = [
  { value: 'feminino', label: 'Feminino' },
  { value: 'masculino', label: 'Masculino' },
  { value: 'nao_binario', label: 'Não binário' },
  { value: 'outro', label: 'Outra identidade' },
  { value: 'prefiro_nao_informar', label: 'Prefiro não informar' },
];

export default function ConfirmacaoContatoModal({ profile }: { profile: Profile | null }) {
  const router = useRouter();
  const pathname = usePathname();
  const [whatsapp, setWhatsapp] = useState(profile?.whatsapp_numero || '');
  const [genero, setGenero] = useState(profile?.genero || '');
  const [aceita, setAceita] = useState(Boolean(profile?.whatsapp_consentimento_em));
  const [emailConfirmado, setEmailConfirmado] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const [concluido, setConcluido] = useState(false);
  const [email, setEmail] = useState(profile?.email || '');
  const [emailAlterado, setEmailAlterado] = useState(false);

  useEffect(() => {
    setWhatsapp(profile?.whatsapp_numero || '');
    setGenero(profile?.genero || '');
    setAceita(Boolean(profile?.whatsapp_consentimento_em));
    setEmail(profile?.email || '');
    setEmailConfirmado(false);
    setConcluido(false);
    setEmailAlterado(false);
  }, [profile?.id]);

  if (!profile || profile.is_admin || concluido || profile.dados_contato_confirmados_em ||
      pathname.startsWith('/admin') ||
      !(profile.trial_status === 'active' || profile.trial_status === 'converted' ||
        profile.status_assinatura === 'ativo' || profile.status_assinatura === 'trial')) return null;

  async function salvar() {
    if (!profile) return;
    setErro('');
    const numeros = whatsapp.replace(/\D/g, '');
    const normalizado = numeros.startsWith('55') && numeros.length >= 12 ? numeros : '55' + numeros;
    if (!/^55[1-9][0-9]{9,10}$/.test(normalizado)) { setErro('Informe um WhatsApp válido com DDD.'); return; }
    if (!genero) { setErro('Escolha como se identifica ou selecione Prefiro não informar.'); return; }
    if (!emailConfirmado) { setErro('Confirme se o e-mail está correto.'); return; }
    setSalvando(true);
    try {
      const supabase = createClient();
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user || auth.user.id !== profile.id) throw new Error('Sua sessão expirou. Entre novamente.');
      const emailAtual = auth.user.email?.trim().toLowerCase() || '';
      const novoEmail = email.trim().toLowerCase();
      if (!novoEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(novoEmail)) throw new Error('Informe um e-mail válido.');
      if (novoEmail !== emailAtual) {
        const { error } = await supabase.auth.updateUser({ email: novoEmail });
        if (error) throw error;
        setEmailAlterado(true);
        setErro('Enviamos uma confirmação para o novo e-mail. Confirme o endereço, entre novamente e conclua esta etapa.');
        return;
      }
      const { error } = await supabase.from('profiles').update({
        whatsapp_numero: normalizado,
        genero,
        whatsapp_consentimento_em: aceita ? (profile.whatsapp_consentimento_em && profile.whatsapp_numero === normalizado ? profile.whatsapp_consentimento_em : new Date().toISOString()) : null,
        dados_contato_confirmados_em: new Date().toISOString(),
      }).eq('id', profile.id);
      if (error) throw error;
      setConcluido(true);
      router.refresh();
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível salvar. Tente novamente.');
    } finally { setSalvando(false); }
  }

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/65 px-4 py-6" role="presentation">
      <section role="dialog" aria-modal="true" aria-labelledby="confirmacao-contato-titulo" className="w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-3xl bg-white p-6 sm:p-8 shadow-2xl">
        <p className="text-xs font-semibold uppercase tracking-widest text-brown-deep">SOMA Mentoria · Primeiro passo</p>
        <h2 id="confirmacao-contato-titulo" className="mt-3 font-display text-2xl text-black">{profile.onboarding_concluido ? 'Vamos confirmar seus dados?' : 'Antes de começar, vamos nos conhecer?'}</h2>
        <p className="mt-2 text-sm text-gray-text">Essas informações ajudam a personalizar sua jornada e manter seu contato atualizado.</p>
        <div className="mt-6 space-y-4">
          <div>
            <label htmlFor="contato-email" className="block text-sm font-medium text-black mb-1">Seu e-mail</label>
            <input id="contato-email" type="email" autoComplete="email" value={email} onChange={e=>{setEmail(e.target.value);setEmailConfirmado(false);}} className="w-full rounded-xl border border-gray-faint px-4 py-3 text-sm" />
            <label className="mt-2 flex items-start gap-2 text-xs text-gray-text"><input type="checkbox" className="mt-0.5" checked={emailConfirmado} onChange={e=>setEmailConfirmado(e.target.checked)}/><span>Confirmo que este é meu e-mail de contato.</span></label>
          </div>
          <div>
            <label htmlFor="contato-whats" className="block text-sm font-medium text-black mb-1">Seu WhatsApp com DDD</label>
            <input id="contato-whats" type="tel" autoComplete="tel" inputMode="tel" placeholder="(11) 99999-9999" value={whatsapp} onChange={e=>setWhatsapp(e.target.value)} className="w-full rounded-xl border border-gray-faint px-4 py-3 text-sm" />
            <p className="mt-1 text-xs text-gray-text">O número será cadastrado, mas ainda não será considerado verificado por mensagem.</p>
          </div>
          <div>
            <label htmlFor="contato-genero" className="block text-sm font-medium text-black mb-1">Como você se identifica?</label>
            <select id="contato-genero" value={genero} onChange={e=>setGenero(e.target.value)} className="w-full rounded-xl border border-gray-faint bg-white px-4 py-3 text-sm">
              <option value="">Selecione uma opção</option>
              {opcoes.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <p className="mt-1 text-xs text-gray-text">Você pode escolher não informar. Não usamos essa resposta para limitar oportunidades.</p>
          </div>
          <label className="flex items-start gap-3 rounded-xl bg-[#f7f5f2] p-3 text-sm text-black">
            <input type="checkbox" checked={aceita} onChange={e=>setAceita(e.target.checked)} className="mt-1" />
            <span>Quero receber mensagens individuais de acompanhamento da SOMA pelo WhatsApp. Posso cancelar essa autorização no meu perfil a qualquer momento.</span>
          </label>
        </div>
        {erro && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{erro}</p>}
        <button type="button" disabled={salvando || emailAlterado} onClick={salvar} className="mt-6 w-full rounded-xl bg-brown-deep px-5 py-3 font-semibold text-white disabled:opacity-50">{salvando ? 'Salvando...' : 'Confirmar e continuar'}</button>
        <p className="mt-3 text-center text-xs text-gray-text">O consentimento para mensagens é opcional. Seus dados podem ser atualizados depois.</p>
      </section>
    </div>
  );
}

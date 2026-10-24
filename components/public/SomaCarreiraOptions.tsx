'use client';
import { useState } from 'react';
import { UsersRound, UserRound, MapPin, Sparkles, PackageCheck, MessageCircle } from 'lucide-react';
import { MODALIDADES_MENTORIA, KIT_ONBOARDING_CENTAVOS, formatarReais, type ModalidadeMentoria } from '@/lib/soma-saas-pricing';
export default function SomaCarreiraOptions() {
 const [mentoria,setMentoria]=useState<ModalidadeMentoria>('nenhuma');
 const [kitOnboarding,setKitOnboarding]=useState(false);
 const mensagem=['Olá, equipe SOMA. Tenho interesse na SOMA Carreira.',
  'Modalidade: '+(mentoria==='nenhuma'?'Quero orientação':MODALIDADES_MENTORIA[mentoria].nome),
  'Kit Onboarding: '+(kitOnboarding?'Sim, se não estiver incluído no plano.':'Não adicionar kit avulso.'),
 ].join('\n');
 const linkContato='https://wa.me/5511959561795?text='+encodeURIComponent(mensagem);
 return (
      <section id="soma-carreira-extras" aria-label="Personalize sua mentoria"
        className="rounded-2xl border border-[#d5e4d9] bg-[#f6faf7] p-5 sm:p-6">
        <h3 className="text-lg font-semibold text-[#183F37]">Personalize sua mentoria</h3>
        <fieldset className="mt-5">
          <legend className="sr-only">Qual acompanhamento de carreira você prefere?</legend>
          <div className="grid gap-3 sm:grid-cols-2">
            {([
              { tipo: 'grupo', icon: UsersRound },
              { tipo: 'online-1-1', icon: UserRound },
              { tipo: 'presencial', icon: MapPin },
              { tipo: 'carreira-completa', icon: Sparkles },
            ] as const).map(item => {
              const modalidade = MODALIDADES_MENTORIA[item.tipo];
              const Icon = item.icon;
              return (
                <label key={item.tipo} className={'flex cursor-pointer items-start gap-3 rounded-xl border-2 p-4 transition-colors ' +
                  (mentoria === item.tipo ? 'border-[#0D8071] bg-[#f2faf5]' : 'border-[#e2e9e3] hover:border-[#9dc8b4]')}>
                  <input type="radio" name="soma-mentoria-modalidade" checked={mentoria === item.tipo}
                    onChange={() => setMentoria(item.tipo)} className="mt-1 h-4 w-4 shrink-0 accent-[#0D8071]" />
                  <span className="flex-1">
                    <strong className="flex items-center gap-2 text-sm text-[#244739]"><Icon size={17} aria-hidden="true" />{modalidade.nome}</strong>
                    <span className="mt-1 block text-xs leading-5 text-[#607769]">{modalidade.descricao}</span>
                    <span className="mt-2 block text-xs font-semibold text-[#0D8071]">Condições e agenda sob consulta</span>
                  </span>
                </label>
              );
            })}
          </div>
          {mentoria !== 'nenhuma' && (
            <button type="button" onClick={() => setMentoria('nenhuma')}
              className="mt-3 rounded-lg px-2 py-2 text-xs font-semibold text-[#537264] underline underline-offset-4">
              Não quero adicionar mentoria agora
            </button>
          )}
        </fieldset>
          <fieldset className="mt-6 space-y-3 border-t border-[#d2e1d6] pt-5">
            <legend className="text-sm font-semibold text-[#24473b]">Kit de boas-vindas</legend>
            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-[#d4e4d9] bg-white p-4">
              <input type="checkbox" checked={kitOnboarding} onChange={e => setKitOnboarding(e.target.checked)}
                className="mt-1 h-5 w-5 shrink-0 accent-[#0D8071]" />
              <span className="flex-1 text-sm leading-6 text-[#334c40]">
                <strong className="flex items-center gap-2 text-[#173a2d]"><PackageCheck size={18} aria-hidden="true" /> Kit Onboarding</strong>
                Kit de boas-vindas da sua mentoria SOMA Carreira.
                <span className="mt-1 block font-semibold text-[#0D8071]">+ {formatarReais(KIT_ONBOARDING_CENTAVOS)}, pagamento único</span>
                <span className="mt-1 block text-xs text-[#61766a]">Se o seu contrato de mentoria já inclui um kit, ele não deve ser cobrado novamente.</span>
              </span>
            </label>
          </fieldset>
        <p className="mt-3 text-xs leading-5 text-[#61766a]">O Kit Onboarding faz parte da experiência SOMA Carreira. Se já estiver incluído no seu plano, não será cobrado novamente.</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <a href={linkContato} target="_blank" rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#0D8071] px-4 text-sm font-semibold text-white hover:bg-[#096e60]">
            <MessageCircle size={16} aria-hidden="true" /> Solicitar orientação comercial
          </a>
        </div>
      </section>

 );
}

'use client';

import { useState } from 'react';
import { calcularAdicionalCarreira } from '@/lib/soma-carreira-pricing';
import { CheckCircle2, PackageCheck, MessageCircle } from 'lucide-react';
import { KIT_ONBOARDING_CENTAVOS, formatarReais } from '@/lib/soma-saas-pricing';

export default function SomaCarreiraOptions() {
  const [duracao, setDuracao] = useState<6 | 12>(12);
  const [encontros, setEncontros] = useState(1);
  const [kitOnboarding, setKitOnboarding] = useState(false);
  const extras = encontros - 1;
  const adicional = calcularAdicionalCarreira(duracao, encontros);
  const totalAdicionais = adicional === null ? null : adicional + (kitOnboarding ? KIT_ONBOARDING_CENTAVOS : 0);
  const mensagem = [
    'Olá, equipe SOMA. Quero personalizar os adicionais da minha SOMA Carreira.',
    `Duração: ${duracao} meses.`,
    `Encontros individuais: ${encontros} por mês, sendo 1 incluído e ${extras} adicional(is) por mês.`,
    adicional === null ? 'Quero orçamento para essa quantidade de encontros.' : 'Adicional total do pacote de encontros: ' + formatarReais(adicional) + '.',
    totalAdicionais === null ? '' : 'Total dos adicionais selecionados: ' + formatarReais(totalAdicionais) + '.',
    'Kit Onboarding: ' + (kitOnboarding ? 'Adicionar, caso ainda não esteja incluído no meu contrato.' : 'Não adicionar.'),
  ].join('\n');
  const linkContato = 'https://wa.me/5511959561795?text=' + encodeURIComponent(mensagem);

  return (
    <section id="soma-carreira-extras" aria-label="Adicionais da SOMA Carreira"
      className="rounded-2xl border border-[#d5e4d9] bg-[#f6faf7] p-5 sm:p-6">
      <h3 className="text-lg font-semibold text-[#183F37]">Sua SOMA Carreira já é completa</h3>
      <p className="mt-2 text-sm leading-6 text-[#546c60]">Portal, ferramentas, encontros coletivos, Íris Copiloto e acompanhamento no WhatsApp já fazem parte do plano.</p>
      <p className="mt-3 flex items-start gap-2 text-sm font-semibold text-[#174e3d]"><CheckCircle2 size={18} className="mt-0.5 shrink-0" aria-hidden="true" />1 encontro individual 1:1 por mês incluído.</p>

      <fieldset className="mt-6 space-y-4 border-t border-[#d2e1d6] pt-5">
        <legend className="text-base font-semibold text-[#24473b]">Quer mais encontros individuais?</legend>
        <p className="text-sm leading-6 text-[#546c60]">Escolha o total de encontros por mês. O adicional varia conforme a quantidade e a duração do plano.</p>
        <label className="block text-sm font-medium text-[#24473b]">Duração do plano
          <select value={duracao} onChange={e => setDuracao(Number(e.target.value) as 6 | 12)} className="mt-2 min-h-11 w-full rounded-xl border border-[#aecfc0] bg-white px-3 py-2">
            <option value={6}>6 meses</option><option value={12}>12 meses</option>
          </select>
        </label>
        <label className="block text-sm font-medium text-[#24473b]">Total de encontros 1:1 por mês
          <input type="number" min={1} step={1} value={encontros} onChange={e => {
            const value = Number(e.target.value);
            setEncontros(Number.isSafeInteger(value) && value >= 1 ? value : 1);
          }} className="mt-2 min-h-11 w-full rounded-xl border border-[#aecfc0] bg-white px-3 py-2" />
        </label>
        <p aria-live="polite" className="rounded-xl border border-[#d4e4d9] bg-white p-4 text-sm leading-6 text-[#334c40]">
          {extras === 0 ? '1 encontro por mês, já incluído no plano. Sem adicional de encontros.' : `${encontros} encontros por mês: 1 incluído + ${extras} extra${extras > 1 ? 's' : ''}. Pacote para ${duracao} meses.`}
        </p>
        <p aria-live="polite" className="text-sm font-semibold text-[#0D8071]">{adicional === null ? 'Para 4 ou mais encontros por mês, consulte um pacote personalizado.' : adicional === 0 ? 'Encontro mensal incluído no plano.' : `+ ${formatarReais(adicional)} pelo pacote completo de ${duracao} meses.`}</p>
      </fieldset>

      <fieldset className="mt-6 border-t border-[#d2e1d6] pt-5">
        <legend className="text-sm font-semibold text-[#24473b]">Kit Onboarding opcional</legend>
        <label className="mt-3 flex cursor-pointer items-start gap-3 rounded-xl border border-[#d4e4d9] bg-white p-4">
          <input type="checkbox" checked={kitOnboarding} onChange={e => setKitOnboarding(e.target.checked)} className="mt-1 h-5 w-5 shrink-0 accent-[#0D8071]" />
          <span className="flex-1 text-sm leading-6 text-[#334c40]">
            <strong className="flex items-center gap-2 text-[#173a2d]"><PackageCheck size={18} aria-hidden="true" />Kit Onboarding</strong>
            Kit de boas-vindas da sua mentoria SOMA Carreira.
            <span className="mt-1 block font-semibold text-[#0D8071]">+ {formatarReais(KIT_ONBOARDING_CENTAVOS)}, pagamento único</span>
            <span className="mt-1 block text-xs text-[#61766a]">Contratos que já incluem o kit mantêm esse benefício, sem nova cobrança.</span>
          </span>
        </label>
      </fieldset>
      {(extras > 0 || kitOnboarding) && totalAdicionais !== null && <div className="mt-5 rounded-xl border border-[#bfd9c9] bg-white p-4" aria-live="polite"><p className="text-sm text-[#546c60]">Total dos adicionais</p><p className="mt-1 text-2xl font-semibold text-[#173a2d]">{formatarReais(totalAdicionais)}</p><p className="mt-1 text-xs leading-5 text-[#61766a]">Adicional ao preço da mentoria. O pacote de encontros cobre {duracao} meses. O kit, se selecionado, é cobrado uma única vez.</p></div>}
      {(extras > 0 || kitOnboarding) && <a href={linkContato} target="_blank" rel="noopener noreferrer" className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#0D8071] px-4 py-3 text-sm font-semibold text-white hover:bg-[#096e60]">
        <MessageCircle size={16} aria-hidden="true" />Consultar meus adicionais
      </a>}
    </section>
  );
}

'use client';
import LocalizedText from '@/components/LocalizedText';

import { useState } from 'react';
import { calcularAdicionalCarreira } from '@/lib/soma-carreira-pricing';
import { CheckCircle2, PackageCheck, MessageCircle } from 'lucide-react';
import { KIT_ONBOARDING_CENTAVOS, formatarReais } from '@/lib/soma-saas-pricing';

export default function SomaCarreiraOptions() {
  const [duracao, setDuracao] = useState<6 | 12>(12);
  const [encontrosInput, setEncontros] = useState('1');
  const encontros = Number(encontrosInput);
  const encontrosValidos = encontrosInput.trim() !== '' && Number.isSafeInteger(encontros) && encontros >= 1;
  const [kitOnboarding, setKitOnboarding] = useState(false);
  const extras = encontrosValidos ? encontros - 1 : 0;
  const adicional = encontrosValidos ? calcularAdicionalCarreira(duracao, encontros) : null;
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
      className="rounded-2xl border border-[#375348] bg-[#13261f] p-5 sm:p-6">
      <h3 className="text-lg font-semibold text-[#EEF3F1]"><LocalizedText text={"Sua SOMA Carreira já é completa"} /></h3>
      <p className="mt-2 text-sm leading-6 text-[#EEF3F1]"><LocalizedText text={"Portal, ferramentas, encontros coletivos, Íris Copiloto e acompanhamento no WhatsApp já fazem parte do plano."} /></p>
      <p className="mt-3 flex items-start gap-2 text-sm font-semibold text-[#EEF3F1]"><CheckCircle2 size={18} className="mt-0.5 shrink-0" aria-hidden="true" /><LocalizedText text={"1 encontro individual 1:1 por mês incluído."} /></p>

      <fieldset className="mt-6 space-y-4 border-t border-[#375348] pt-5">
        <legend className="text-base font-semibold text-[#EEF3F1]"><LocalizedText text={"Quer mais encontros individuais?"} /></legend>
        <p className="text-sm leading-6 text-[#EEF3F1]"><LocalizedText text={"Escolha o total de encontros por mês. O adicional varia conforme a quantidade e a duração do plano."} /></p>
        <label className="block text-sm font-medium text-[#EEF3F1]"><LocalizedText text={"Duração do plano"} /><select value={duracao} onChange={e => setDuracao(Number(e.target.value) as 6 | 12)} className="mt-2 min-h-11 w-full rounded-xl border border-[#375348] bg-[#1B312B] px-3 py-2">
            <option value={6}>6 meses</option><option value={12}><LocalizedText text={"12 meses"} /></option>
          </select>
        </label>
        <label className="block text-sm font-medium text-[#EEF3F1]"><LocalizedText text={"Total de encontros 1:1 por mês"} /><input type="number" min={1} step={1} value={encontrosInput} inputMode="numeric" onChange={e => setEncontros(e.target.value)} onBlur={() => {
            if (!encontrosValidos) setEncontros('1');
          }} className="mt-2 min-h-11 w-full rounded-xl border border-[#375348] bg-[#1B312B] px-3 py-2" />
        </label>
        <p aria-live="polite" className="rounded-xl border border-[#375348] bg-[#1B312B] p-4 text-sm leading-6 text-[#EEF3F1]">
          {!encontrosValidos ? 'Digite a quantidade de encontros por mês.' : extras === 0 ? '1 encontro por mês, já incluído no plano. Sem adicional de encontros.' : `${encontros} encontros por mês: 1 incluído + ${extras} extra${extras > 1 ? 's' : ''}. Pacote para ${duracao} meses.`}
        </p>
        <p aria-live="polite" className="text-sm font-semibold text-[#EEF3F1]">{!encontrosValidos ? '' : adicional === null ? 'Para 4 ou mais encontros por mês, consulte um pacote personalizado.' : adicional === 0 ? 'Encontro mensal incluído no plano.' : `+ ${formatarReais(adicional)} pelo pacote completo de ${duracao} meses.`}</p>
      </fieldset>

      <fieldset className="mt-6 border-t border-[#375348] pt-5">
        <legend className="text-sm font-semibold text-[#EEF3F1]"><LocalizedText text={"Kit Onboarding opcional"} /></legend>
        <label className="mt-3 flex cursor-pointer items-start gap-3 rounded-xl border border-[#375348] bg-[#1B312B] p-4">
          <input type="checkbox" checked={kitOnboarding} onChange={e => setKitOnboarding(e.target.checked)} className="mt-1 h-5 w-5 shrink-0 accent-[#0D8071]" />
          <span className="flex-1 text-sm leading-6 text-[#EEF3F1]">
            <strong className="flex items-center gap-2 text-[#EEF3F1]"><PackageCheck size={18} aria-hidden="true" /><LocalizedText text={"Kit Onboarding"} /></strong><LocalizedText text={"Kit de boas-vindas da sua mentoria SOMA Carreira."} /><span className="mt-1 block font-semibold text-[#EEF3F1]">+ {formatarReais(KIT_ONBOARDING_CENTAVOS)}, pagamento único</span>
            <span className="mt-1 block text-xs text-[#EEF3F1]"><LocalizedText text={"Se seu plano já inclui o kit, você não precisa adicioná-lo."} /></span>
          </span>
        </label>
      </fieldset>
      {encontrosValidos && (extras > 0 || kitOnboarding) && totalAdicionais !== null && <div className="mt-5 rounded-xl border border-[#375348] bg-[#1B312B] p-4" aria-live="polite"><p className="text-sm text-[#EEF3F1]"><LocalizedText text={"Total dos adicionais"} /></p><p className="mt-1 text-2xl font-semibold text-[#EEF3F1]">{formatarReais(totalAdicionais)}</p><p className="mt-1 text-xs leading-5 text-[#EEF3F1]">Adicional ao preço da mentoria. O pacote de encontros cobre {duracao} meses. O kit, se selecionado, é cobrado uma única vez.</p></div>}
      {encontrosValidos && (extras > 0 || kitOnboarding) && <a href={linkContato} target="_blank" rel="noopener noreferrer" className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#8FD3BE] px-4 py-3 text-sm font-semibold text-[#10221c] hover:bg-[#9AD2B8]">
        <MessageCircle size={16} aria-hidden="true" /><LocalizedText text={"Consultar meus adicionais"} /></a>}
    </section>
  );
}

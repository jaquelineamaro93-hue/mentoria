'use client';

import { useMemo, useState } from 'react';
import { ArrowUpRight, CheckCircle2, Layers3, Sparkles, Workflow } from 'lucide-react';
import {
  BASE_SAAS_CENTAVOS, CATALOGO_SAAS,
  formatarReais, ADICIONAL_IA_CENTAVOS, DOIS_AGENTES_CENTAVOS,
  calcularPrecoSaas,
  type PlanoSaas,
} from '@/lib/soma-saas-pricing';

type Modulo = { slug: string; title: string; description: string | null };
const TIPOS: PlanoSaas[] = ['avulso', 'essencial', 'pro'];

const ICONES = { avulso: Layers3, essencial: Workflow, pro: Sparkles };

export default function SomaSaasShowcase({ modulos }: { modulos: Modulo[] }) {
  const [plano, setPlano] = useState<PlanoSaas>('essencial');
  const [modulo, setModulo] = useState('');
  const [iris, setIris] = useState(false);
  const [whatsapp, setWhatsapp] = useState(false);

  const calculo = useMemo(
    () => calcularPrecoSaas(plano, { iris, whatsapp }),
    [plano, iris, whatsapp]
  );
  const selecionado = modulos.find(m => m.slug === modulo) || modulos[0];
  const linkPlataforma = '/plataforma?' + new URLSearchParams({ plano, modulo: selecionado?.slug || '', iris: iris ? '1' : '0', whatsapp: whatsapp ? '1' : '0' }).toString();


  return (
    <section id="soma-saas" className="min-w-0" aria-labelledby="soma-saas-titulo">
      <div className="mb-6 max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6B451B]">Ferramentas de carreira · SaaS</p>
        <h2 id="soma-saas-titulo" className="mt-2 font-display text-3xl text-[#3D291B]">
          SOMA Plataforma
        </h2>
        <p className="mt-3 text-sm leading-7 text-[#3D291B]">
          Você escolhe as ferramentas que precisa. Íris Copiloto e agente no WhatsApp são opcionais e cobrados à parte,
          porque utilizam recursos adicionais de inteligência artificial.
        </p>
      </div>

      <div className="grid gap-3 xl:grid-cols-2" aria-label="Escolha um plano de base">
        {TIPOS.map(codigo => {
          const oferta = CATALOGO_SAAS[codigo];
          const Icone = ICONES[codigo];
          const marcado = plano === codigo;
          return (
            <button
              key={codigo} type="button" aria-pressed={marcado} onClick={() => setPlano(codigo)}
              className={'flex min-w-0 flex-col rounded-2xl border-2 bg-white p-4 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0D8071] sm:p-4 ' +
                (marcado ? 'border-[#9B741D] bg-[#FFF8E3]' : 'border-[#DCCB9B] hover:border-[#AF8530]')}
            >
              <span className="mb-2 inline-flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#F8E7AC] text-[#6B451B]">
                  <Icone size={21} aria-hidden="true" />
                </span>
                <span className="font-semibold text-[#3D291B]">{oferta.nome}</span>
                {marcado && <span className="ml-auto rounded-full bg-[#F1D784] px-2 py-1 text-[11px] font-semibold text-[#3D291B]">Selecionado</span>}
              </span>
              <span className="text-sm leading-6 text-[#3D291B]">{oferta.descricao}</span>
              <strong className="mt-3 text-2xl tracking-tight text-[#3D291B]">{formatarReais(BASE_SAAS_CENTAVOS[codigo])}</strong>
              <span className="mt-1 text-xs text-[#3D291B]">por mês, sem agentes de IA</span>
              <span className="mt-3 flex-1 space-y-1">
                {oferta.itens.map(item => (
                  <span key={item} className="flex items-start gap-2 py-1 text-sm text-[#3D291B]">
                    <CheckCircle2 size={17} className="mt-0.5 shrink-0 text-[#6B451B]" aria-hidden="true" />
                    <span>{item}</span>
                  </span>
                ))}
              </span>
              <span className="mt-3 text-xs font-semibold text-[#3D291B]">{marcado ? 'Plano base escolhido' : 'Selecionar este plano'}</span>
            </button>
          );
        })}
      </div>

      <div id="soma-saas-configurador" className="mt-6 grid scroll-mt-24 gap-5 rounded-2xl border border-[#DCCB9B] bg-[#FFF8E3] p-5 sm:p-7">
        <div>
          <h3 className="text-lg font-semibold text-[#3D291B]">Monte seu plano</h3>
          <p className="mt-1 text-sm leading-6 text-[#3D291B]">
            Marque somente os recursos que pretende usar. O total mensal aparece ao lado.
          </p>
          {plano === 'avulso' && (
            <div className="mt-5">
              <label htmlFor="soma-saas-modulo" className="mb-2 block text-sm font-semibold text-[#3D291B]">Qual ferramenta deseja?</label>
              <select id="soma-saas-modulo" value={selecionado?.slug || ''} onChange={e => setModulo(e.target.value)}
                className="min-h-11 w-full rounded-xl border border-[#DCCB9B] bg-white px-3 py-2 text-sm text-[#3D291B] focus-visible:outline-2 focus-visible:outline-[#0D8071]">
                {modulos.length ? modulos.map(m => <option key={m.slug} value={m.slug}>{m.title}</option>)
                  : <option value="">Escolher com a equipe</option>}
              </select>
            </div>
          )}
          <fieldset className="mt-5 space-y-3">
            <legend className="mb-3 text-sm font-semibold text-[#3D291B]">Recursos opcionais de IA</legend>
            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-[#DCCB9B] bg-white p-4">
              <input type="checkbox" checked={iris} onChange={e => setIris(e.target.checked)}
                className="mt-1 h-5 w-5 shrink-0 accent-[#0D8071]" />
              <span className="flex-1 text-sm leading-6 text-[#3D291B]">
                <strong className="block text-[#3D291B]">Íris Copiloto na plataforma</strong>
                Orientação conversacional e apoio de carreira pelo portal.
                <span className="mt-1 block font-semibold text-[#3D291B]">+ {formatarReais(ADICIONAL_IA_CENTAVOS)}/mês, se contratado sozinho</span>
              </span>
            </label>
            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-[#DCCB9B] bg-white p-4">
              <input type="checkbox" checked={whatsapp} onChange={e => setWhatsapp(e.target.checked)}
                className="mt-1 h-5 w-5 shrink-0 accent-[#0D8071]" />
              <span className="flex-1 text-sm leading-6 text-[#3D291B]">
                <strong className="block text-[#3D291B]">Agente de carreira no WhatsApp</strong>
                Acompanhamento automatizado, mediante autorização e limites de uso.
                <span className="mt-1 block font-semibold text-[#3D291B]">+ {formatarReais(ADICIONAL_IA_CENTAVOS)}/mês, se contratado sozinho</span>
              </span>
            </label>
            <p className="text-xs leading-5 text-[#3D291B]">
              Se escolher os dois agentes, o adicional combinado é de {formatarReais(DOIS_AGENTES_CENTAVOS)}/mês, em vez de R$ 300,00.
              Valores de uso, franquia e disponibilidade são confirmados antes da contratação.
            </p>
          </fieldset>
        </div>
        <aside className="h-fit rounded-2xl border border-[#DCCB9B] bg-white p-5" aria-label="Resumo de preços">
          <h4 className="text-base font-semibold text-[#3D291B]">Resumo da sua escolha</h4>
          <dl className="mt-4 space-y-3 text-sm text-[#3D291B]">
            <div className="flex items-start justify-between gap-3"><dt>{CATALOGO_SAAS[plano].nome}</dt><dd className="shrink-0 font-semibold">{formatarReais(calculo.base)}</dd></div>
            {plano === 'avulso' && <div className="text-xs text-[#3D291B]">{selecionado?.title || 'Módulo a definir'}</div>}
            {(iris || whatsapp) && (
              <div className="flex items-start justify-between gap-3">
                <dt>{iris && whatsapp ? 'Íris + agente WhatsApp' : iris ? 'Íris Copiloto' : 'Agente WhatsApp'}</dt>
                <dd className="shrink-0 font-semibold">{formatarReais(calculo.adicionais)}</dd>
              </div>
            )}


          </dl>
          <div className="mt-5 border-t border-[#DCCB9B] pt-4" aria-live="polite" aria-atomic="true">
            <p className="text-xs text-[#3D291B]">Total mensal simulado</p>
            <p className="mt-1 text-3xl font-bold tracking-tight text-[#3D291B]">{formatarReais(calculo.total)}<span className="ml-1 text-sm font-normal">/mês</span></p>
          </div>
          <a href={linkPlataforma} onClick={() => { document.cookie = `soma_saas_intent=${encodeURIComponent(linkPlataforma)}; Path=/; Max-Age=3600; SameSite=Lax; Secure`; }}
            className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#E6BE53] px-4 py-3 text-center text-sm font-semibold text-[#3D291B] hover:bg-[#D5A83D] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0D8071]">
            Começar meus 7 dias grátis <ArrowUpRight size={15} aria-hidden="true" />
          </a>
          <p className="mt-3 text-xs leading-5 text-[#3D291B]">
            Teste as ferramentas escolhidas por 7 dias, sem cartão. Depois, assine pelo Mercado Pago.
          </p>
        </aside>
      </div>

      {modulos.length > 0 && (
        <details className="mt-5 rounded-2xl border border-[#DCCB9B] bg-[#FFF8E3] p-5">
          <summary className="cursor-pointer font-semibold text-[#3D291B]">Ver todas as ferramentas disponíveis</summary>
          <p className="mt-1 text-sm text-[#63796d]">Também é possível começar por um único módulo, sem contratar Íris ou WhatsApp.</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {modulos.map(m => (
              <div key={m.slug} className="rounded-lg border border-[#DCCB9B] bg-white px-4 py-3">
                <p className="text-sm font-medium text-[#1d4538]">{m.title}</p>
                {m.description && <p className="mt-1 text-xs leading-5 text-[#3D291B]">{m.description}</p>}
              </div>
            ))}
          </div>
        </details>
      )}
    </section>
  );
}

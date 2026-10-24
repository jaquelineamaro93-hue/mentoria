'use client';

import { useMemo, useState } from 'react';
import { ArrowUpRight, CheckCircle2, Layers3, MessageCircle, Sparkles, Workflow } from 'lucide-react';
import {
  BASE_SAAS_CENTAVOS, CATALOGO_SAAS, calcularPrecoSaas,
  formatarReais, ADICIONAL_IA_CENTAVOS, DOIS_AGENTES_CENTAVOS,
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
  const mensagem = [
    'Olá, equipe SOMA. Quero solicitar uma contratação da SOMA Plataforma.',
    'Plano: ' + CATALOGO_SAAS[plano].nome,
    ...(plano === 'avulso' ? ['Módulo: ' + (selecionado?.title || 'A definir')] : []),
    'Íris Copiloto: ' + (iris ? 'sim' : 'não'),
    'Agente no WhatsApp: ' + (whatsapp ? 'sim' : 'não'),
    'Valor simulado: ' + formatarReais(calculo.total) + ' por mês',
    'Entendo que esta é uma simulação e que a contratação depende de confirmação de acesso e condições.',
  ].join('\n');
  // Canal comercial já utilizado no portal SOMA. Nenhum dado pessoal é incluído
  // no link; a pessoa escolhe se quer enviar a mensagem no WhatsApp.
  const linkContato = 'https://wa.me/5511959561795?text=' + encodeURIComponent(mensagem);

  return (
    <section id="soma-saas" className="mt-12 border-t border-gray-faint pt-11 sm:mt-16 sm:pt-14" aria-labelledby="soma-saas-titulo">
      <div className="mb-6 max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-mint-deep">SOMA Plataforma · SaaS</p>
        <h2 id="soma-saas-titulo" className="mt-2 font-display text-3xl text-[#183F37] sm:text-4xl">
          Ferramentas de carreira. Com ou sem IA.
        </h2>
        <p className="mt-3 text-sm leading-7 text-[#4a645c]">
          Você escolhe as ferramentas que precisa. Íris Copiloto e agente no WhatsApp são opcionais e cobrados à parte,
          porque utilizam recursos adicionais de inteligência artificial.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3" aria-label="Escolha um plano de base">
        {TIPOS.map(codigo => {
          const oferta = CATALOGO_SAAS[codigo];
          const Icone = ICONES[codigo];
          const marcado = plano === codigo;
          return (
            <button
              key={codigo} type="button" aria-pressed={marcado} onClick={() => setPlano(codigo)}
              className={'flex min-w-0 flex-col rounded-2xl border-2 bg-white p-5 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0D8071] sm:p-6 ' +
                (marcado ? 'border-[#0D8071] bg-[#f5fbf8]' : 'border-[#e2e9e5] hover:border-[#91c8b7]')}
            >
              <span className="mb-4 inline-flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#e6f4ef] text-mint-deep">
                  <Icone size={21} aria-hidden="true" />
                </span>
                <span className="font-semibold text-[#183F37]">{oferta.nome}</span>
                {marcado && <span className="ml-auto rounded-full bg-[#d8f2e7] px-2 py-1 text-[11px] font-semibold text-[#17684e]">Selecionado</span>}
              </span>
              <span className="text-sm leading-6 text-[#4a645c]">{oferta.descricao}</span>
              <strong className="mt-5 text-3xl tracking-tight text-[#15362f]">{formatarReais(BASE_SAAS_CENTAVOS[codigo])}</strong>
              <span className="mt-1 text-xs text-[#60796f]">por mês, sem agentes de IA</span>
              <span className="mt-5 flex-1 space-y-3">
                {oferta.itens.map(item => (
                  <span key={item} className="flex items-start gap-2 py-1 text-sm text-[#33463e]">
                    <CheckCircle2 size={17} className="mt-0.5 shrink-0 text-mint-deep" aria-hidden="true" />
                    <span>{item}</span>
                  </span>
                ))}
              </span>
              <span className="mt-5 text-xs font-semibold text-[#0D8071]">{marcado ? 'Plano base escolhido' : 'Selecionar este plano'}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-6 grid gap-5 rounded-2xl border border-[#d5e4d9] bg-[#f6faf7] p-5 lg:grid-cols-[minmax(0,1fr)_minmax(290px,0.75fr)] sm:p-7">
        <div>
          <h3 className="text-lg font-semibold text-[#183F37]">Monte seu plano</h3>
          <p className="mt-1 text-sm leading-6 text-[#546c60]">
            Marque somente os recursos que pretende usar. O total mensal aparece ao lado.
          </p>
          {plano === 'avulso' && (
            <div className="mt-5">
              <label htmlFor="soma-saas-modulo" className="mb-2 block text-sm font-semibold text-[#24473b]">Qual ferramenta deseja?</label>
              <select id="soma-saas-modulo" value={selecionado?.slug || ''} onChange={e => setModulo(e.target.value)}
                className="min-h-11 w-full rounded-xl border border-[#aecfc0] bg-white px-3 py-2 text-sm text-[#234539] focus-visible:outline-2 focus-visible:outline-[#0D8071]">
                {modulos.length ? modulos.map(m => <option key={m.slug} value={m.slug}>{m.title}</option>)
                  : <option value="">Escolher com a equipe</option>}
              </select>
            </div>
          )}
          <fieldset className="mt-5 space-y-3">
            <legend className="mb-3 text-sm font-semibold text-[#24473b]">Recursos opcionais de IA</legend>
            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-[#d4e4d9] bg-white p-4">
              <input type="checkbox" checked={iris} onChange={e => setIris(e.target.checked)}
                className="mt-1 h-5 w-5 shrink-0 accent-[#0D8071]" />
              <span className="flex-1 text-sm leading-6 text-[#334c40]">
                <strong className="block text-[#173a2d]">Íris Copiloto na plataforma</strong>
                Orientação conversacional e apoio de carreira pelo portal.
                <span className="mt-1 block font-semibold text-[#0D8071]">+ {formatarReais(ADICIONAL_IA_CENTAVOS)}/mês, se contratado sozinho</span>
              </span>
            </label>
            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-[#d4e4d9] bg-white p-4">
              <input type="checkbox" checked={whatsapp} onChange={e => setWhatsapp(e.target.checked)}
                className="mt-1 h-5 w-5 shrink-0 accent-[#0D8071]" />
              <span className="flex-1 text-sm leading-6 text-[#334c40]">
                <strong className="block text-[#173a2d]">Agente de carreira no WhatsApp</strong>
                Acompanhamento automatizado, mediante autorização e limites de uso.
                <span className="mt-1 block font-semibold text-[#0D8071]">+ {formatarReais(ADICIONAL_IA_CENTAVOS)}/mês, se contratado sozinho</span>
              </span>
            </label>
            <p className="text-xs leading-5 text-[#537669]">
              Se escolher os dois agentes, o adicional combinado é de {formatarReais(DOIS_AGENTES_CENTAVOS)}/mês, em vez de R$ 300,00.
              Valores de uso, franquia e disponibilidade são confirmados antes da contratação.
            </p>
          </fieldset>
        </div>
        <aside className="h-fit rounded-2xl border border-[#bfd9c9] bg-white p-5" aria-label="Resumo de preços">
          <h4 className="text-base font-semibold text-[#1e4236]">Resumo da sua escolha</h4>
          <dl className="mt-4 space-y-3 text-sm text-[#3c5a4d]">
            <div className="flex items-start justify-between gap-3"><dt>{CATALOGO_SAAS[plano].nome}</dt><dd className="shrink-0 font-semibold">{formatarReais(calculo.base)}</dd></div>
            {plano === 'avulso' && <div className="text-xs text-[#637b6e]">{selecionado?.title || 'Módulo a definir'}</div>}
            {(iris || whatsapp) && (
              <div className="flex items-start justify-between gap-3">
                <dt>{iris && whatsapp ? 'Íris + agente WhatsApp' : iris ? 'Íris Copiloto' : 'Agente WhatsApp'}</dt>
                <dd className="shrink-0 font-semibold">{formatarReais(calculo.adicionais)}</dd>
              </div>
            )}
          </dl>
          <div className="mt-5 border-t border-[#dce8df] pt-4" aria-live="polite" aria-atomic="true">
            <p className="text-xs text-[#607568]">Total mensal simulado</p>
            <p className="mt-1 text-3xl font-bold tracking-tight text-[#173c2f]">{formatarReais(calculo.total)}<span className="ml-1 text-sm font-normal">/mês</span></p>
          </div>
          <a href={linkContato} target="_blank" rel="noopener noreferrer"
            className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#0D8071] px-4 py-3 text-center text-sm font-semibold text-white hover:bg-[#096b5e] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0D8071]">
            <MessageCircle size={18} aria-hidden="true" /> Solicitar contratação <ArrowUpRight size={15} aria-hidden="true" />
          </a>
          <p className="mt-3 text-xs leading-5 text-[#64796f]">
            Abre o WhatsApp com sua seleção e o valor calculado para a equipe SOMA confirmar.
            Nenhuma cobrança acontece ao clicar.
          </p>
        </aside>
      </div>

      {modulos.length > 0 && (
        <div className="mt-7 rounded-2xl border border-[#dde6e0] bg-[#f8faf8] p-5 sm:p-6">
          <h3 className="font-semibold text-[#183F37]">Ferramentas disponíveis</h3>
          <p className="mt-1 text-sm text-[#63796d]">Também é possível começar por um único módulo, sem contratar Íris ou WhatsApp.</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {modulos.map(m => (
              <div key={m.slug} className="rounded-lg border border-[#e2e9e4] bg-white px-4 py-3">
                <p className="text-sm font-medium text-[#1d4538]">{m.title}</p>
                {m.description && <p className="mt-1 text-xs leading-5 text-[#6a7972]">{m.description}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="mt-4 space-y-1 text-xs leading-5 text-[#65756b]">
        <p>Preços de referência mensais para novas contratações no Brasil. Os módulos sem IA não incluem acesso livre aos agentes nem consumo ilimitado.</p>
        <p>Contratação disponível após validação de segurança. O simulador gera uma solicitação comercial; o checkout SaaS automático ainda não foi habilitado.</p>
        <p>Os planos de mentoria com encontros humanos são contratos separados, e os preços de contratos existentes não são alterados por esta simulação.</p>
      </div>
    </section>
  );
}

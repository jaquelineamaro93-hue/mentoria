'use client';

import { useMemo, useState } from 'react';
import { ArrowUpRight, CheckCircle2, Layers3, MessageCircle, Sparkles, Workflow, UsersRound, UserRound, MapPin, PackageCheck } from 'lucide-react';
import {
  BASE_SAAS_CENTAVOS, CATALOGO_SAAS,
  formatarReais, ADICIONAL_IA_CENTAVOS, DOIS_AGENTES_CENTAVOS,
  calcularResumoSaas, KIT_ONBOARDING_CENTAVOS, MODALIDADES_MENTORIA,
  type ModalidadeMentoria, type PlanoSaas,
} from '@/lib/soma-saas-pricing';

type Modulo = { slug: string; title: string; description: string | null };
const TIPOS: PlanoSaas[] = ['avulso', 'essencial', 'pro'];

const ICONES = { avulso: Layers3, essencial: Workflow, pro: Sparkles };

export default function SomaSaasShowcase({ modulos }: { modulos: Modulo[] }) {
  const [plano, setPlano] = useState<PlanoSaas>('essencial');
  const [modulo, setModulo] = useState('');
  const [iris, setIris] = useState(false);
  const [whatsapp, setWhatsapp] = useState(false);
  const [kitOnboarding, setKitOnboarding] = useState(false);
  const [mentoria, setMentoria] = useState<ModalidadeMentoria>('nenhuma');

  const calculo = useMemo(
    () => calcularResumoSaas(plano, { iris, whatsapp }, kitOnboarding),
    [plano, iris, whatsapp, kitOnboarding]
  );
  const selecionado = modulos.find(m => m.slug === modulo) || modulos[0];
  const mensagem = [
    'Olá, equipe SOMA. Quero solicitar uma contratação da SOMA Plataforma.',
    'Plano: ' + CATALOGO_SAAS[plano].nome,
    ...(plano === 'avulso' ? ['Módulo: ' + (selecionado?.title || 'A definir')] : []),
    'Íris Copiloto: ' + (iris ? 'sim' : 'não'),
    'Agente no WhatsApp: ' + (whatsapp ? 'sim' : 'não'),
    'Kit Onboarding avulso: ' + (kitOnboarding ? 'sim, R$ 189,90 uma única vez' : 'não'),
    'Mentoria humana: ' + (mentoria === 'nenhuma' ? 'não selecionada' : MODALIDADES_MENTORIA[mentoria].nome + ', orçamento e disponibilidade sob consulta'),
    'Valor da plataforma: ' + formatarReais(calculo.total) + ' por mês',
    'Valor avulso do kit: ' + formatarReais(calculo.kitAvulso),
    'Estimativa inicial plataforma e kit: ' + formatarReais(calculo.estimativaPrimeiroMes),
    ...(mentoria !== 'nenhuma' ? ['O valor da mentoria não está incluído na estimativa.'] : []),
    'Entendo que esta é uma simulação e que a contratação depende de confirmação de acesso e condições.',
  ].join('\n');
  // Canal comercial já utilizado no portal SOMA. Nenhum dado pessoal é incluído
  // no link; a pessoa escolhe se quer enviar a mensagem no WhatsApp.
  const linkPlataforma = '/plataforma?' + new URLSearchParams({ plano, modulo: selecionado?.slug || '', iris: iris ? '1' : '0', whatsapp: whatsapp ? '1' : '0' }).toString();
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

      <nav className="mb-6 grid gap-3 sm:grid-cols-2" aria-label="Caminhos da SOMA">
        <a href="#soma-saas-configurador"
          className="rounded-2xl border-2 border-[#0D8071] bg-[#f4faf7] px-5 py-4 text-left transition hover:bg-[#e5f5ee]">
          <span className="block text-base font-bold text-[#174e3d]">SOMA Plataforma</span>
          <span className="mt-1 block text-sm leading-6 text-[#557267]">Monte sua assinatura de ferramentas e IA, sem acompanhamento humano obrigatório.</span>
          <span className="mt-2 block text-xs font-semibold text-[#0D8071]">Personalizar minha plataforma ↓</span>
        </a>
        <a href="#soma-carreira"
          className="rounded-2xl border border-[#d8e4dc] bg-white px-5 py-4 text-left transition hover:border-[#0D8071] hover:bg-[#f8fbf9]">
          <span className="block text-base font-bold text-[#174e3d]">SOMA Carreira</span>
          <span className="mt-1 block text-sm leading-6 text-[#557267]">Experiência completa com acompanhamento de pessoas, em grupo, individual ou presencial.</span>
          <span className="mt-2 block text-xs font-semibold text-[#0D8071]">Conhecer mentorias ↓</span>
        </a>
      </nav>
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

      <div id="soma-saas-configurador" className="mt-6 grid scroll-mt-24 gap-5 rounded-2xl border border-[#d5e4d9] bg-[#f6faf7] p-5 lg:grid-cols-[minmax(0,1fr)_minmax(290px,0.75fr)] sm:p-7">
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
          <fieldset className="mt-6 space-y-3 border-t border-[#d2e1d6] pt-5">
            <legend className="text-sm font-semibold text-[#24473b]">Outros extras</legend>
            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-[#d4e4d9] bg-white p-4">
              <input type="checkbox" checked={kitOnboarding} onChange={e => setKitOnboarding(e.target.checked)}
                className="mt-1 h-5 w-5 shrink-0 accent-[#0D8071]" />
              <span className="flex-1 text-sm leading-6 text-[#334c40]">
                <strong className="flex items-center gap-2 text-[#173a2d]"><PackageCheck size={18} aria-hidden="true" /> Kit Onboarding</strong>
                Kit de boas-vindas avulso para começar a jornada na SOMA.
                <span className="mt-1 block font-semibold text-[#0D8071]">+ {formatarReais(KIT_ONBOARDING_CENTAVOS)}, pagamento único</span>
                <span className="mt-1 block text-xs text-[#61766a]">Se o seu contrato de mentoria já inclui um kit, ele não deve ser cobrado novamente.</span>
              </span>
            </label>
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
            {kitOnboarding && (
              <div className="flex items-start justify-between gap-3">
                <dt>Kit Onboarding <span className="block text-xs text-[#72867b]">Pagamento único</span></dt>
                <dd className="shrink-0 font-semibold">{formatarReais(calculo.kitAvulso)}</dd>
              </div>
            )}
            {mentoria !== 'nenhuma' && (
              <div className="flex items-start justify-between gap-3">
                <dt>Mentoria: {MODALIDADES_MENTORIA[mentoria].nome}</dt>
                <dd className="shrink-0 text-xs font-semibold">Sob consulta</dd>
              </div>
            )}
          </dl>
          <div className="mt-5 border-t border-[#dce8df] pt-4" aria-live="polite" aria-atomic="true">
            <p className="text-xs text-[#607568]">Total mensal simulado</p>
            <p className="mt-1 text-3xl font-bold tracking-tight text-[#173c2f]">{formatarReais(calculo.total)}<span className="ml-1 text-sm font-normal">/mês</span></p>
            {kitOnboarding && <p className="mt-2 text-sm font-medium text-[#365b4a]">Plataforma e kit no primeiro mês: {formatarReais(calculo.estimativaPrimeiroMes)}</p>}
            {mentoria !== 'nenhuma' && <p className="mt-2 text-xs leading-5 text-[#61766a]">O valor da mentoria humana é contratado à parte e não está incluído neste total.</p>}
          </div>
          <a href={linkPlataforma} onClick={() => { document.cookie = `soma_saas_intent=${encodeURIComponent(linkPlataforma)}; Path=/; Max-Age=3600; SameSite=Lax; Secure`; }}
            className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#0D8071] px-4 py-3 text-center text-sm font-semibold text-white hover:bg-[#096b5e] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0D8071]">
            <MessageCircle size={18} aria-hidden="true" /> Começar meus 7 dias grátis <ArrowUpRight size={15} aria-hidden="true" />
          </a>
          <p className="mt-3 text-xs leading-5 text-[#64796f]">
            Teste as ferramentas escolhidas por 7 dias, sem cartão. Depois, assine pelo Mercado Pago. Kit e mentoria são contratados separadamente.
          </p>
        </aside>
      </div>

      <section id="soma-carreira" aria-labelledby="soma-carreira-titulo"
        className="mt-8 scroll-mt-24 rounded-2xl border border-[#dce3df] bg-white p-5 sm:p-7">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#0D8071]">SOMA Carreira · acompanhamento humano</p>
          <h3 id="soma-carreira-titulo" className="mt-2 font-display text-2xl text-[#173f33] sm:text-3xl">A jornada completa, com pessoas ao seu lado</h3>
          <p className="mt-2 text-sm leading-6 text-[#5e7167]">
            Quer apoio de mentores além das ferramentas? Escolha a modalidade de seu interesse para receber as condições e verificar a agenda.
            A mentoria não está inclusa no preço mensal da plataforma.
          </p>
        </div>
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
        <p className="mt-4 text-xs leading-5 text-[#61766a]">
          Os planos completos SOMA de 6 e 12 meses já aparecem nesta página com os preços e benefícios vigentes.
          Algumas versões online já incluem Kit Onboarding. Consulte os itens do contrato antes de incluir o kit avulso.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <a href="#opcoes-de-acesso" className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[#bfd7c8] px-4 text-sm font-semibold text-[#1d5745] hover:bg-[#f0f9f3]">
            Ver planos completos e preços
          </a>
          <a href={linkContato} target="_blank" rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#0D8071] px-4 text-sm font-semibold text-white hover:bg-[#096e60]">
            <MessageCircle size={16} aria-hidden="true" /> Solicitar orientação comercial
          </a>
        </div>
      </section>

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
    </section>
  );
}

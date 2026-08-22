"use client";

import Link from "next/link";
import { CreditCard, Check } from "lucide-react";

const PILARES = [
  {
    letra: "S",
    nome: "Sabedoria Interna",
    desc: "A base de tudo é o acesso à sua verdade. Identificar seus diferenciais únicos e silenciar o ruído externo para ouvir o que sua trajetória e seus valores dizem sobre o seu próximo passo.",
  },
  {
    letra: "O",
    nome: "Objetividade Magnética",
    desc: "Ter propósito sem direção é apenas sonho. Transformamos sua essência em metas claras, com uma estratégia que atrai as oportunidades certas porque você sabe o que está buscando.",
  },
  {
    letra: "M",
    nome: "Maestria em Ação",
    desc: "O conhecimento só se torna poder quando aplicado. Excelência na execução, refinamento das suas habilidades e coragem de agir com autoridade e presença no mercado.",
  },
  {
    letra: "A",
    nome: "Alquimia de Resultados",
    desc: "Onde a estratégia encontra a realização. O estágio de colheita e expansão, transformando desafios em crescimento contínuo e sustentando o sucesso com equilíbrio.",
  },
];

const ETAPA_ONLINE = [
  ["Mergulho nas Metas", "Sessão individual para entender seus desejos, o que te bloqueia e onde você quer chegar."],
  ["DISC e Forças de Caráter", "Descubra como seu comportamento dita seus resultados."],
  ["Motivadores e Energia", "O que realmente te faz entrar em movimento."],
  ["Preparação de Rota", "Você sai com a clareza necessária para aproveitar ao máximo o encontro presencial."],
];

const ETAPA_PRESENCIAL = [
  ["Encontro com Membros", "Discutimos contextos de carreira e desafios reais de ambientes corporativos."],
  ["Estratégia de Posicionamento", "Revisão de LinkedIn e currículo sob a ótica de quem precisa se destacar."],
  ["Networking Estratégico", "Aprenda a se colocar e a construir alianças para sua ascensão."],
  ["Ajuste de Foco", "Revisão das metas individuais dentro da dinâmica do grupo."],
];

const INCLUSO = [
  ["Diagnóstico de Perfil e Carreira", "Análise profunda das suas competências e onde elas se encaixam no mercado."],
  ["Mapeamento de Talentos", "Identificação dos seus diferenciais competitivos para ganhar autoridade."],
  ["Plano de Ação 90 dias", "Um roteiro prático e direcionado para seus próximos passos."],
  ["Presença Profissional", "Revisão estratégica de LinkedIn ou currículo sob o olhar de quem contrata."],
  ["Bônus: Guia Dream Board", "Exercício visual de projeção de metas."],
];

const PLANOS = [
  {
    duracao: "6 meses",
    modalidade: "Presencial em São Paulo",
    foco: "Movimento e Posicionamento",
    resumo:
      "Para quem busca clareza imediata e um plano de ação para mudar a realidade profissional no curto prazo.",
    encontros: ["1 online individual", "6 online em grupo", "6 presenciais em grupo"],
    total: "13 encontros",
    avista: "R$ 650",
    cartao: "R$ 750",
    recorrente: "R$ 900 em 4x",
    destaque: false,
  },
  {
    duracao: "6 meses",
    modalidade: "100% online",
    foco: "Movimento e Posicionamento",
    resumo:
      "Mesma jornada, para quem está fora de São Paulo. Mais tempo individual comigo no lugar dos encontros presenciais.",
    encontros: ["14 online individuais", "6 online em grupo"],
    total: "20 encontros",
    avista: "R$ 600",
    cartao: "R$ 700",
    recorrente: "R$ 850 em 4x",
    destaque: false,
  },
  {
    duracao: "12 meses",
    modalidade: "Presencial em São Paulo",
    foco: "Consistência e Alta Performance",
    resumo:
      "Para quem deseja suporte de uma especialista em estratégia e liderança durante todo o ano.",
    encontros: ["2 online individuais", "12 online em grupo", "12 presenciais em grupo"],
    total: "26 encontros",
    avista: "R$ 850",
    cartao: "R$ 950",
    recorrente: "R$ 1.200 em 5x",
    destaque: true,
  },
  {
    duracao: "12 meses",
    modalidade: "100% online",
    foco: "Consistência e Alta Performance",
    resumo:
      "O ano inteiro de acompanhamento, para quem está fora de São Paulo, com mais sessões individuais.",
    encontros: ["16 online individuais", "12 online em grupo"],
    total: "28 encontros",
    avista: "R$ 800",
    cartao: "R$ 900",
    recorrente: "R$ 1.150 em 5x",
    destaque: false,
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-cream">
  {/* HEADER */}
      <header className="fixed top-0 right-0 z-50 p-6 flex gap-4">
        <Link
          href="/planos"
          className="px-6 py-2 rounded-lg font-medium text-ink hover:bg-white transition"
        >
          Planos
        </Link>
        <Link
          href="/login"
          className="px-6 py-2 bg-brand text-white rounded-lg font-medium hover:bg-brand-deep transition"
        >
          Portal do Mentorado
        </Link>
      </header>
      {/* HERO */}
      <section className="px-6 pt-24 pb-20 md:pt-32 md:pb-28 max-w-4xl mx-auto text-center">
        <p className="text-[11px] uppercase tracking-[0.28em] text-ink-faint mb-6">
          Mentoria de Carreira e Estratégia
        </p>
        <h1 className="font-display text-5xl md:text-6xl text-ink mb-6 leading-[1.05]">
          Sua totalidade integrada
        </h1>
        <p className="text-lg text-ink-soft max-w-2xl mx-auto mb-10 leading-relaxed">
          Se você sente que precisa destravar a sua carreira, essa mentoria é para você.
          Uma metodologia que une autodescoberta, estratégia e execução de alto nível.
        </p>
        <Link
          href="/planos"
          className="inline-block bg-brand hover:bg-brand-deep text-white px-8 py-4 rounded-lg font-medium transition-colors"
        >
          Conheça o programa
        </Link>
      </section>

      {/* O QUE É SOMA */}
      <section className="px-6 py-20 bg-paper border-y border-line">
        <div className="max-w-3xl mx-auto">
          <p className="text-[11px] uppercase tracking-[0.22em] text-ink-faint mb-5">
            A metodologia
          </p>
          <h2 className="font-display text-4xl text-ink mb-6">
            SOMA vem do grego e representa a totalidade do ser
          </h2>
          <p className="text-ink-soft leading-relaxed mb-4">
            A união entre mente, corpo e espírito. A metodologia que criei é um chamado para
            você integrar todas as suas potências e parar de fragmentar quem você é.
          </p>
          <p className="text-ink-soft leading-relaxed">
            É sobre somar suas experiências, sua intuição e sua técnica para construir uma
            trajetória inabalável. Foi desenhada para quem cansou de se sentir em partes e
            deseja a plenitude de uma vida profissional alinhada.
          </p>
        </div>
      </section>

      {/* OS 4 PILARES */}
      <section className="px-6 py-20 max-w-5xl mx-auto">
        <p className="text-[11px] uppercase tracking-[0.22em] text-ink-faint mb-10 text-center">
          Os quatro pilares
        </p>
        <div className="grid md:grid-cols-2 gap-5">
          {PILARES.map((p) => (
            <div key={p.letra} className="bg-paper p-7 rounded-xl border border-line">
              <div className="flex items-baseline gap-3 mb-3">
                <span className="font-display text-4xl text-brand leading-none">{p.letra}</span>
                <h3 className="text-lg text-ink">{p.nome}</h3>
              </div>
              <p className="text-sm text-ink-soft leading-relaxed">{p.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* SOMA ELAN */}
      <section className="px-6 py-20 bg-paper border-y border-line">
        <div className="max-w-3xl mx-auto">
          <p className="text-[11px] uppercase tracking-[0.22em] text-ink-faint mb-5">
            SOMA Elan
          </p>
          <h2 className="font-display text-4xl text-ink mb-6">
            Mentoria de carreira e ambiência
          </h2>
          <p className="text-ink-soft leading-relaxed mb-8">
            Um programa híbrido em dois tempos, desenhado para quem deseja sair da dúvida,
            entender seu valor real e entrar em um ecossistema de crescimento. Aqui, unimos a
            análise individual ao poder do coletivo.
          </p>
          <div className="grid sm:grid-cols-3 gap-5">
            {[
              ["Escuta ativa", "Entendemos suas metas e o contexto real da sua carreira hoje."],
              ["Clareza comportamental", "Mapeamos sua essência através de dados científicos."],
              ["Pertencimento", "Um fluxo de troca com quem busca o mesmo nível de excelência."],
            ].map(([titulo, desc]) => (
              <div key={titulo}>
                <h3 className="text-sm font-medium text-ink mb-1.5">{titulo}</h3>
                <p className="text-sm text-ink-faint leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* COMO FUNCIONA */}
      <section className="px-6 py-20 max-w-5xl mx-auto">
        <p className="text-[11px] uppercase tracking-[0.22em] text-ink-faint mb-10 text-center">
          Como funciona
        </p>
        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-paper p-8 rounded-xl border border-line">
            <p className="text-[10px] uppercase tracking-[0.18em] text-ink-faint mb-2">
              Etapa 1 · Online
            </p>
            <h3 className="font-display text-2xl text-ink mb-6">
              Alinhamento e mapa individual
            </h3>
            <div className="flex flex-col gap-4">
              {ETAPA_ONLINE.map(([titulo, desc]) => (
                <div key={titulo} className="flex gap-3">
                  <Check size={16} strokeWidth={2} className="text-brand shrink-0 mt-1" />
                  <div>
                    <p className="text-sm font-medium text-ink">{titulo}</p>
                    <p className="text-sm text-ink-faint leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-paper p-8 rounded-xl border border-line">
            <p className="text-[10px] uppercase tracking-[0.18em] text-ink-faint mb-2">
              Etapa 2 · Presencial
            </p>
            <h3 className="font-display text-2xl text-ink mb-6">
              Fluxo, presença e ambiência
            </h3>
            <div className="flex flex-col gap-4">
              {ETAPA_PRESENCIAL.map(([titulo, desc]) => (
                <div key={titulo} className="flex gap-3">
                  <Check size={16} strokeWidth={2} className="text-brand shrink-0 mt-1" />
                  <div>
                    <p className="text-sm font-medium text-ink">{titulo}</p>
                    <p className="text-sm text-ink-faint leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <p className="text-sm text-ink-faint text-center mt-8">
          Os encontros do grupo acontecem uma vez ao mês.
        </p>
      </section>

      {/* PLANOS */}
      <section className="px-6 py-20 bg-paper border-y border-line">
        <div className="max-w-5xl mx-auto">
          <p className="text-[11px] uppercase tracking-[0.22em] text-ink-faint mb-10 text-center">
            Investimento
          </p>
          <div className="grid md:grid-cols-2 gap-6">
            {PLANOS.map((plano) => (
              <div
                key={plano.duracao + plano.modalidade}
                className={`relative bg-cream p-8 rounded-xl border ${
                  plano.destaque ? "border-brand" : "border-line"
                }`}
              >
                {plano.destaque && (
                  <span className="absolute -top-3 left-8 bg-gold text-ink text-[10px] font-semibold uppercase tracking-wider px-3 py-1 rounded-full">
                    Mais completo
                  </span>
                )}
                <p className="text-[10px] uppercase tracking-[0.18em] text-ink-faint mb-1">
                  SOMA Fluxo
                </p>
                <h3 className="font-display text-3xl text-ink mb-1">{plano.duracao}</h3>
                <p className="text-sm text-brand font-medium mb-1">{plano.modalidade}</p>
                <p className="text-sm text-ink-faint mb-4">{plano.foco}</p>
                <p className="text-sm text-ink-soft leading-relaxed mb-6">{plano.resumo}</p>

                <div className="border-t border-line pt-5 mb-5">
                  <p className="text-xs uppercase tracking-wider text-ink-faint mb-3">
                    {plano.total}
                  </p>
                  <ul className="flex flex-col gap-1.5">
                    {plano.encontros.map((e) => (
                      <li key={e} className="text-sm text-ink-soft flex gap-2">
                        <span className="text-brand">·</span>
                        {e}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="border-t border-line pt-5 mb-6">
                  <p className="font-display text-4xl text-ink mb-1">
                    {plano.avista}{" "}
                    <span className="text-base text-ink-faint font-body not-italic">à vista</span>
                  </p>
                  <p className="text-sm text-ink-faint">
                    {plano.cartao} no cartão · {plano.recorrente} no crédito recorrente
                  </p>
                  <p className="text-xs text-ink-faint mt-1">
                    O crédito recorrente não compromete o limite do cartão.
                  </p>
                </div>

                <Link
                  href="/planos"
                  className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-lg font-medium transition-colors ${
                    plano.destaque
                      ? "bg-brand hover:bg-brand-deep text-white"
                      : "border border-brand text-brand hover:bg-brand-soft"
                  }`}
                >
                  <CreditCard size={16} strokeWidth={1.75} />
                  Assinar pelo Mercado Pago
                </Link>
              </div>
            ))}
          </div>

          <div className="mt-12 max-w-3xl mx-auto">
            <p className="text-[11px] uppercase tracking-[0.22em] text-ink-faint mb-6 text-center">
              Incluso nos quatro planos
            </p>
            <div className="grid sm:grid-cols-2 gap-x-8 gap-y-4">
              {INCLUSO.map(([titulo, desc]) => (
                <div key={titulo} className="flex gap-3">
                  <Check size={16} strokeWidth={2} className="text-brand shrink-0 mt-1" />
                  <div>
                    <p className="text-sm font-medium text-ink">{titulo}</p>
                    <p className="text-sm text-ink-faint leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* JAQUELINE */}
      <section className="px-6 py-20 max-w-5xl mx-auto">
        <div className="grid md:grid-cols-[320px_1fr] gap-10 items-start">
          <div className="w-full aspect-square rounded-xl overflow-hidden border border-line bg-brand-soft">
            <img
              src="/jaqueline.jpg"
              alt="Jaqueline Amaro"
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-[0.22em] text-ink-faint mb-4">
              Quem conduz
            </p>
            <h2 className="font-display text-4xl text-ink mb-2">Jaqueline Amaro</h2>
            <p className="text-brand font-medium mb-6">
              Administradora e Head de CRM
            </p>
            <div className="flex flex-col gap-4 text-ink-soft leading-relaxed">
              <p>
                Trajetória construída na intersecção entre dados, tecnologia e negócios. Como
                Head na agência e mentora, já vivi na prática o desafio de transformar
                arquiteturas em resultados reais e carreiras estagnadas em trajetórias de alta
                performance.
              </p>
              <p>
                Passagens por Banco do Brasil, Loft, Ansell e Guanabara Rodoviário.
              </p>
              <p>
                Hoje coloco essa vivência de mercado a serviço de profissionais que desejam
                dominar o ecossistema de CRM ou impulsionar a carreira com intenção
                estratégica. Através da Metodologia SOMA, entrego o mapa para você sair da
                execução automática, ganhar autoridade e construir um futuro com propósito.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="px-6 py-24 bg-ink text-center">
        <h2 className="font-display text-4xl md:text-5xl text-cream mb-6 max-w-3xl mx-auto leading-tight">
          É o momento de somar suas forças e ocupar o seu lugar no mundo
        </h2>
        <p className="text-lg text-cream/70 max-w-2xl mx-auto mb-10 leading-relaxed">
          Para quem busca integrar quem é com o que faz, transformando potencial adormecido em
          resultados concretos.
        </p>
        <Link
          href="/planos"
          className="inline-block bg-gold hover:bg-gold/90 text-ink px-8 py-4 rounded-lg font-semibold transition-colors"
        >
          Começar agora
        </Link>
      </section>

      {/* FOOTER */}
      <footer className="bg-paper border-t border-line px-6 py-14">
        <div className="max-w-5xl mx-auto">
          <div className="grid sm:grid-cols-3 gap-10 pb-10 border-b border-line">
            <div>
              <h4 className="text-[11px] uppercase tracking-[0.18em] text-ink-faint mb-3">
                Pagamento
              </h4>
              <p className="text-sm text-ink-soft">Mercado Pago</p>
              <p className="text-sm text-ink-faint mt-1">
                No Pix, cartão ou crédito recorrente
              </p>
            </div>
            <div>
              <h4 className="text-[11px] uppercase tracking-[0.18em] text-ink-faint mb-3">
                Segurança
              </h4>
              <ul className="flex flex-col gap-1.5">
                <li className="text-sm text-ink-soft flex gap-2">
                  <Check size={14} strokeWidth={2} className="text-brand shrink-0 mt-1" />
                  Dados protegidos
                </li>
                <li className="text-sm text-ink-soft flex gap-2">
                  <Check size={14} strokeWidth={2} className="text-brand shrink-0 mt-1" />
                  Privacidade garantida
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-[11px] uppercase tracking-[0.18em] text-ink-faint mb-3">
                Redes
              </h4>
              <div className="flex flex-col gap-1.5">
                <a
                  href="https://www.instagram.com/jaquedocrm1112"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-brand hover:text-brand-deep transition-colors"
                >
                  @jaquedocrm1112
                </a>
                <a
                  href="https://www.linkedin.com/in/jaquelineamaro/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-brand hover:text-brand-deep transition-colors"
                >
                  LinkedIn
                </a>
              </div>
            </div>
          </div>
          <p className="text-xs text-ink-faint text-center pt-8">
            © 2012–2026 SOMA Mentoria. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}

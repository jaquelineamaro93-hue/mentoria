import { Metadata } from 'next';
import Link from 'next/link'; 
import { CheckCircle2, Users, Compass, Target, Sparkles, Video, MapPin } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import type { PlanoMentoria } from '@/lib/types';

export const metadata: Metadata = {
  title: 'SOMA Mentoria - Transforme sua Carreira',
  description:
    'Mentoria de carreira e estratégia com Jaqueline Amaro. Metodologia SOMA: sabedoria interna, objetividade magnética, maestria em ação e alquimia de resultados.',
};

const PILARES_SOMA = [
  {
    letra: 'S',
    titulo: 'Sabedoria Interna',
    texto:
      'A base de tudo é o acesso à sua verdade. Identificar seus diferenciais únicos e silenciar o ruído externo para ouvir o que sua trajetória e seus valores dizem sobre o seu próximo passo.',
  },
  {
    letra: 'O',
    titulo: 'Objetividade Magnética',
    texto:
      'Ter propósito sem direção é apenas sonho. Transformamos sua essência em metas claras, com uma estratégia que atrai as oportunidades certas porque você sabe exatamente o que está buscando.',
  },
  {
    letra: 'M',
    titulo: 'Maestria em Ação',
    texto:
      'O conhecimento só se torna poder quando aplicado. Excelência na execução, refinamento das suas habilidades e coragem de agir com autoridade e presença no mercado.',
  },
  {
    letra: 'A',
    titulo: 'Alquimia de Resultados',
    texto:
      'Onde a estratégia encontra a realização. O estágio de colheita e expansão, onde você transforma desafios em crescimento contínuo e sustenta o sucesso com equilíbrio e propósito.',
  },
];

export default async function HomePage() {
  const supabase = await createClient();
  const { data: planosRaw } = await supabase
    .from('planos_mentoria')
    .select('*')
    .eq('ativo', true)
    .eq('visivel_checkout', true)
    .order('duracao_meses', { ascending: true });

  // A página pública de checkout mantém, às vezes, um plano de R$ 0,01 só
  // pra validar o webhook do Mercado Pago. Isso não deve aparecer aqui.
  const planos = (planosRaw ?? []).filter((p: PlanoMentoria) => Number(p.preco_avista) >= 100);

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream to-white">
      {/* Header */}
      <header className="border-b border-line">
        <div className="max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
          <h1 className="font-display text-2xl text-brown-deep">SOMA Mentoria</h1>
          <div className="space-x-4">
            <Link href="/login" className="text-brown-deep hover:underline font-medium">
              Entrar
            </Link>
            <Link
              href="/planos"
              className="bg-brown-deep text-white px-6 py-2 rounded-lg font-medium hover:bg-brown transition-colors"
            >
              Começar
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 py-20 text-center">
        <p className="text-xs uppercase tracking-[0.25em] text-sky-deep mb-4">
          Mentoria de Carreira e Estratégia
        </p>
        <h2 className="font-display text-5xl text-brown-deep mb-6">
          Se você sente que precisa destravar a sua carreira, essa mentoria é para você
        </h2>
        <p className="text-xl text-ink-faint mb-8 max-w-2xl mx-auto">
          A Metodologia SOMA une autodescoberta, estratégia de carreira e execução de alto nível.
          Para quem cansou de se sentir &quot;em partes&quot; e deseja a plenitude de uma vida
          profissional alinhada.
        </p>
        <Link
          href="/planos"
          className="inline-block bg-brown-deep text-white px-8 py-4 rounded-lg font-display text-lg hover:bg-brown transition-colors"
        >
          Ver Planos
        </Link>
      </section>

      {/* Sobre a mentora */}
      <section className="bg-white py-20 border-t border-b border-line">
        <div className="max-w-4xl mx-auto px-6">
          <p className="text-xs uppercase tracking-[0.2em] text-sky-deep mb-3 text-center">
            Sobre a mentora
          </p>
          <h3 className="font-display text-3xl text-brown-deep text-center mb-8">
            Jaqueline Amaro
          </h3>
          <div className="text-ink-soft leading-relaxed space-y-4 text-center max-w-2xl mx-auto">
            <p>
              Administradora e Head de CRM, com uma trajetória construída na intersecção entre
              dados, tecnologia e negócios. Passagens em empresas como Banco do Brasil, Loft,
              Ansell e Guanabara Rodoviário.
            </p>
            <p>
              Como head de agência e mentora, já vivi na prática o desafio de transformar
              arquiteturas em resultados reais e carreiras estagnadas em trajetórias de alta
              performance.
            </p>
            <p>
              Hoje coloco toda essa vivência de mercado a serviço de profissionais que desejam
              impulsionar a carreira com intenção estratégica. Através da Metodologia SOMA, entrego
              o mapa para você sair da execução automática, ganhar autoridade e construir um futuro
              com propósito e ROI pessoal.
            </p>
          </div>
        </div>
      </section>

      {/* Metodologia SOMA */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-6">
          <p className="text-xs uppercase tracking-[0.2em] text-sky-deep mb-3 text-center">
            A metodologia
          </p>
          <h3 className="font-display text-3xl text-brown-deep text-center mb-4">
            SOMA: sua totalidade
          </h3>
          <p className="text-ink-faint text-center max-w-2xl mx-auto mb-12">
            A palavra SOMA vem do grego e representa a totalidade do ser: a união entre mente,
            corpo e espírito. Um chamado para você integrar todas as suas potências e parar de
            fragmentar quem você é.
          </p>

          <div className="grid sm:grid-cols-2 gap-6">
            {PILARES_SOMA.map((pilar) => (
              <div key={pilar.letra} className="border border-line rounded-2xl p-6 bg-white">
                <div className="w-10 h-10 rounded-full bg-brown-deep text-white flex items-center justify-center font-display text-lg mb-4">
                  {pilar.letra}
                </div>
                <h4 className="font-display text-lg text-brown-deep mb-2">{pilar.titulo}</h4>
                <p className="text-sm text-ink-faint leading-relaxed">{pilar.texto}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Como funciona */}
      <section className="bg-white py-20 border-t border-b border-line">
        <div className="max-w-6xl mx-auto px-6">
          <p className="text-xs uppercase tracking-[0.2em] text-sky-deep mb-3 text-center">
            Como funciona
          </p>
          <h3 className="font-display text-3xl text-brown-deep text-center mb-12">
            Um programa híbrido em dois tempos
          </h3>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="border border-line rounded-2xl p-8">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-full bg-sky-tint border border-sky flex items-center justify-center">
                  <Video size={18} className="text-sky-deep" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-sky-deep">Etapa 1 · Online</p>
                  <h4 className="font-display text-lg text-brown-deep">
                    Alinhamento e mapa individual
                  </h4>
                </div>
              </div>
              <ul className="space-y-3 text-sm text-ink-faint">
                <li className="flex gap-2">
                  <CheckCircle2 size={16} className="text-green-600 shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-ink">Mergulho nas metas:</strong> sessão individual para
                    entender seus desejos, o que te bloqueia e onde você quer chegar.
                  </span>
                </li>
                <li className="flex gap-2">
                  <CheckCircle2 size={16} className="text-green-600 shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-ink">DISC &amp; forças de caráter:</strong> descubra
                    como seu comportamento dita seus resultados.
                  </span>
                </li>
                <li className="flex gap-2">
                  <CheckCircle2 size={16} className="text-green-600 shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-ink">Motivadores e energia:</strong> o que realmente te
                    faz entrar em movimento.
                  </span>
                </li>
                <li className="flex gap-2">
                  <CheckCircle2 size={16} className="text-green-600 shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-ink">Preparação de rota:</strong> saia com a clareza
                    necessária para aproveitar ao máximo o encontro presencial.
                  </span>
                </li>
              </ul>
            </div>

            <div className="border border-line rounded-2xl p-8">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-full bg-sky-tint border border-sky flex items-center justify-center">
                  <MapPin size={18} className="text-sky-deep" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-sky-deep">
                    Etapa 2 · Presencial
                  </p>
                  <h4 className="font-display text-lg text-brown-deep">
                    Fluxo, presença e ambiência
                  </h4>
                </div>
              </div>
              <ul className="space-y-3 text-sm text-ink-faint">
                <li className="flex gap-2">
                  <CheckCircle2 size={16} className="text-green-600 shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-ink">Encontro com membros:</strong> o poder da troca,
                    discutindo contextos de carreira e desafios reais de ambientes corporativos.
                  </span>
                </li>
                <li className="flex gap-2">
                  <CheckCircle2 size={16} className="text-green-600 shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-ink">Estratégia de posicionamento:</strong> revisão de
                    LinkedIn e currículo sob a ótica de quem precisa se destacar no mercado.
                  </span>
                </li>
                <li className="flex gap-2">
                  <CheckCircle2 size={16} className="text-green-600 shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-ink">Networking estratégico:</strong> aprenda a se
                    colocar e a construir alianças para sua ascensão.
                  </span>
                </li>
                <li className="flex gap-2">
                  <CheckCircle2 size={16} className="text-green-600 shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-ink">Ajuste de foco:</strong> revisão das metas
                    individuais dentro da dinâmica do grupo.
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Planos */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-6">
          <h3 className="font-display text-3xl text-brown-deep text-center mb-2">
            Escolha seu Plano
          </h3>
          <p className="text-sm text-ink-faint text-center mb-12">
            Preços e parcelamentos exatamente como no checkout, sem letras miúdas.
          </p>

          <div className="grid md:grid-cols-2 gap-8">
            {planos.map((plano, i) => {
              const destaque = i === planos.length - 1 && planos.length > 1;
              return (
                <div
                  key={plano.id}
                  className={`rounded-2xl p-8 border-2 ${
                    destaque ? 'border-brown-deep bg-brown-deep/5' : 'border-line'
                  }`}
                >
                  {destaque && (
                    <div className="mb-4">
                      <span className="bg-brown-deep text-white text-xs font-medium px-3 py-1 rounded-full">
                        Mais completo
                      </span>
                    </div>
                  )}

                  <h4 className="font-display text-2xl text-brown-deep mb-1">{plano.nome}</h4>
                  {plano.foco && <p className="text-sm text-ink-faint mb-6">{plano.foco}</p>}

                  <div className="mb-6">
                    <p className="font-display text-3xl text-brown-deep mb-1">
                      R$ {Number(plano.preco_avista).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-xs text-ink-faint">à vista</p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-ink-faint">
                      <span>
                        R${' '}
                        {Number(plano.preco_cartao).toLocaleString('pt-BR', {
                          minimumFractionDigits: 2,
                        })}{' '}
                        no cartão
                      </span>
                      <span>
                        {plano.parcelas_recorrente}x de R${' '}
                        {(
                          Number(plano.preco_recorrente_total) / plano.parcelas_recorrente
                        ).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}{' '}
                        no recorrente
                      </span>
                    </div>
                  </div>

                  {plano.descricao_encontros && (
                    <p className="text-sm text-ink-soft mb-4">{plano.descricao_encontros}</p>
                  )}

                  <div className="space-y-2.5 mb-8 text-sm text-ink-faint">
                    {(plano.itens_inclusos ?? []).map((item: string) => (
                      <div key={item} className="flex items-start gap-2">
                        <CheckCircle2 size={16} className="text-green-600 shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>

                  <Link
                    href="/checkout"
                    className={`w-full block text-center px-6 py-3 rounded-lg font-medium transition-colors ${
                      destaque
                        ? 'bg-brown-deep text-white hover:bg-brown'
                        : 'bg-brown-deep/10 text-brown-deep hover:bg-brown-deep hover:text-white'
                    }`}
                  >
                    Escolher Plano
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Benefícios */}
      <section className="bg-white py-20 border-t border-b border-line">
        <div className="max-w-6xl mx-auto px-6">
          <h3 className="font-display text-3xl text-brown-deep text-center mb-12">Por que SOMA?</h3>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <Compass size={32} className="text-brown-deep mx-auto mb-4" />
              <h4 className="font-display text-lg text-brown-deep mb-2">Diagnóstico real</h4>
              <p className="text-sm text-ink-faint">
                Análise de perfil e carreira feita por quem já viveu o mercado, não um teste
                genérico.
              </p>
            </div>

            <div className="text-center">
              <Users size={32} className="text-brown-deep mx-auto mb-4" />
              <h4 className="font-display text-lg text-brown-deep mb-2">Comunidade</h4>
              <p className="text-sm text-ink-faint">
                Encontros presenciais com quem busca o mesmo nível de excelência que você.
              </p>
            </div>

            <div className="text-center">
              <Target size={32} className="text-brown-deep mx-auto mb-4" />
              <h4 className="font-display text-lg text-brown-deep mb-2">Plano de ação</h4>
              <p className="text-sm text-ink-faint">
                Roteiro prático de 90 dias, não só teoria: você sai de cada etapa sabendo o próximo
                passo.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="bg-brown-deep text-white py-16">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <Sparkles size={28} className="mx-auto mb-4 opacity-80" />
          <h3 className="font-display text-3xl mb-4">É o momento de somar suas forças</h3>
          <p className="text-lg mb-8 opacity-90 max-w-xl mx-auto">
            Para quem não aceita mais perder, busca integrar quem é com o que faz e quer ocupar o
            seu lugar no mundo.
          </p>
          <Link
            href="/planos"
            className="inline-block bg-white text-brown-deep px-8 py-4 rounded-lg font-display text-lg hover:bg-cream transition-colors"
          >
            Ver Planos e Começar
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-line py-8 text-center text-sm text-ink-faint">
        <div className="max-w-6xl mx-auto px-6">
          <p>© 2026 SOMA Mentoria. Todos os direitos reservados.</p>
          <div className="mt-4 space-x-6">
            <Link href="/termos" className="hover:text-brown-deep">
              Termos
            </Link>
            <a
              href="https://instagram.com/jaquedocrm1112"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-brown-deep"
            >
              Instagram
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

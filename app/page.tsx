import { Metadata } from 'next';
import Link from 'next/link';
import { CheckCircle2, Users, Compass, Target, Sparkles, Video, MapPin } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import type { PlanoMentoria } from '@/lib/types';

export const metadata: Metadata = {
  title: 'SOMA Mentoria - Transforme sua Carreira',
  description: 'Mentoria de carreira com Jaqueline Amaro. Metodologia SOMA: sabedoria interna, objetividade magnética, maestria em ação e alquimia de resultados.',
};

const PILARES_SOMA = [
  {
    letra: 'S',
    titulo: 'Sabedoria Interna',
    texto: 'A base de tudo é o acesso à sua verdade. Identificar seus diferenciais únicos e silenciar o ruído externo para ouvir o que sua trajetória e seus valores dizem sobre o seu próximo passo.',
  },
  {
    letra: 'O',
    titulo: 'Objetividade Magnética',
    texto: 'Ter propósito sem direção é apenas sonho. Transformamos sua essência em metas claras, com uma estratégia que atrai as oportunidades certas porque você sabe exatamente o que está buscando.',
  },
  {
    letra: 'M',
    titulo: 'Maestria em Ação',
    texto: 'O conhecimento só se torna poder quando aplicado. Excelência na execução, refinamento das suas habilidades e coragem de agir com autoridade e presença no mercado.',
  },
  {
    letra: 'A',
    titulo: 'Alquimia de Resultados',
    texto: 'Onde a estratégia encontra a realização. O estágio de colheita e expansão, onde você transforma desafios em crescimento contínuo e sustenta o sucesso com equilíbrio e propósito.',
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

  const planos = (planosRaw ?? []).filter((p: PlanoMentoria) => Number(p.preco_avista) >= 100);

  return (
    <div className="min-h-screen bg-white">
      {/* Header Preto */}
      <header style={{ backgroundColor: '#1A1A1A', borderBottom: '1px solid #2D2D2D' }}>
        <div className="max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
          <h1 className="font-display text-2xl text-white">SOMA Mentoria</h1>
          <div className="space-x-4">
            <Link href="/login" className="text-white hover:text-white opacity-90 font-medium">
              Entrar
            </Link>
            <Link
              href="/planos"
              className="text-black px-6 py-2 rounded-lg font-medium transition-colors hover:opacity-90"
              style={{ backgroundColor: '#0D8071' }}
            >
              Começar
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Preto Full */}
      <section style={{ backgroundColor: '#1A1A1A', color: '#FFFFFF' }} className="w-full px-6 py-20 text-center">
        <div className="max-w-6xl mx-auto">
          <p className="text-xs uppercase tracking-[0.25em] mb-4" style={{ color: '#0D8071' }}>
            Mentoria de Carreira e Estratégia
          </p>
          <h2 className="font-display text-5xl mb-6">
            Se você sente que precisa destravar a sua carreira, essa mentoria é para você
          </h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto opacity-90">
            A Metodologia SOMA une autodescoberta, estratégia de carreira e execução de alto nível.
            Para quem cansou de se sentir "em partes" e deseja a plenitude de uma vida profissional alinhada.
          </p>
          <Link
            href="/planos"
            className="inline-block px-8 py-4 rounded-lg font-display text-lg transition-colors"
            style={{ backgroundColor: '#0D8071', color: '#1A1A1A' }}
          >
            Ver Planos
          </Link>
        </div>
      </section>

      {/* Sobre — Branco */}
      <section className="bg-white py-20" style={{ borderTop: '1px solid #E8E8E8', borderBottom: '1px solid #E8E8E8' }}>
        <div className="max-w-4xl mx-auto px-6">
          <p className="text-xs uppercase tracking-[0.2em] mb-3 text-center" style={{ color: '#0D8071' }}>Sobre a mentora</p>
          <h3 className="font-display text-3xl text-center mb-8" style={{ color: '#1A1A1A' }}>Jaqueline Amaro</h3>
          <div className="leading-relaxed space-y-4 text-center max-w-2xl mx-auto" style={{ color: '#808080' }}>
            <p>Administradora e Head de CRM, com uma trajetória construída na intersecção entre dados, tecnologia e negócios. Passagens em empresas como Banco do Brasil, Loft, Ansell e Guanabara Rodoviário.</p>
            <p>Como head de agência e mentora, já vivi na prática o desafio de transformar arquiteturas em resultados reais e carreiras estagnadas em trajetórias de alta performance.</p>
            <p>Hoje coloco toda essa vivência de mercado a serviço de profissionais que desejam impulsionar a carreira com intenção estratégica. Através da Metodologia SOMA, entrego o mapa para você sair da execução automática, ganhar autoridade e construir um futuro com propósito e ROI pessoal.</p>
          </div>
        </div>
      </section>

      {/* SOMA Pilares */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <p className="text-xs uppercase tracking-[0.2em] mb-3 text-center" style={{ color: '#0D8071' }}>A metodologia</p>
          <h3 className="font-display text-3xl text-center mb-4" style={{ color: '#1A1A1A' }}>SOMA: sua totalidade</h3>
          <p className="text-center max-w-2xl mx-auto mb-12" style={{ color: '#808080' }}>
            A palavra SOMA vem do grego e representa a totalidade do ser: a união entre mente, corpo e espírito. Um chamado para você integrar todas as suas potências e parar de fragmentar quem você é.
          </p>

          <div className="grid sm:grid-cols-2 gap-6">
            {PILARES_SOMA.map((pilar) => {
              const cores: any = { S: '#0D8071', O: '#FF7A8A', M: '#FFB366', A: '#1A1A1A' };
              return (
                <div key={pilar.letra} className="border rounded-2xl p-6 bg-white" style={{ borderColor: '#E8E8E8' }}>
                  <div className="w-10 h-10 rounded-full text-white flex items-center justify-center font-display text-lg mb-4" style={{ backgroundColor: cores[pilar.letra] }}>
                    {pilar.letra}
                  </div>
                  <h4 className="font-display text-lg mb-2" style={{ color: '#1A1A1A' }}>{pilar.titulo}</h4>
                  <p className="text-sm" style={{ color: '#808080' }}>{pilar.texto}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Como funciona */}
      <section className="bg-white py-20" style={{ borderTop: '1px solid #E8E8E8', borderBottom: '1px solid #E8E8E8' }}>
        <div className="max-w-6xl mx-auto px-6">
          <p className="text-xs uppercase tracking-[0.2em] mb-3 text-center" style={{ color: '#0D8071' }}>Como funciona</p>
          <h3 className="font-display text-3xl text-center mb-12" style={{ color: '#1A1A1A' }}>Um programa híbrido em dois tempos</h3>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="border rounded-2xl p-8 bg-white" style={{ borderColor: '#E8E8E8' }}>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-full border-2 flex items-center justify-center" style={{ borderColor: '#0D8071', backgroundColor: 'rgba(61, 217, 200, 0.1)' }}>
                  <Video size={18} style={{ color: '#0D8071' }} />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide" style={{ color: '#0D8071' }}>Etapa 1 · Online</p>
                  <h4 className="font-display text-lg" style={{ color: '#1A1A1A' }}>Alinhamento e mapa individual</h4>
                </div>
              </div>
              <ul className="space-y-3 text-sm" style={{ color: '#808080' }}>
                <li className="flex gap-2">
                  <CheckCircle2 size={16} className="text-green-600 shrink-0 mt-0.5" />
                  <span><strong style={{ color: '#1A1A1A' }}>Mergulho nas metas:</strong> sessão individual para entender seus desejos, o que te bloqueia e onde você quer chegar.</span>
                </li>
                <li className="flex gap-2">
                  <CheckCircle2 size={16} className="text-green-600 shrink-0 mt-0.5" />
                  <span><strong style={{ color: '#1A1A1A' }}>DISC & forças:</strong> descubra como seu comportamento dita seus resultados.</span>
                </li>
              </ul>
            </div>

            <div className="border rounded-2xl p-8 bg-white" style={{ borderColor: '#E8E8E8' }}>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-full border-2 flex items-center justify-center" style={{ borderColor: '#FF7A8A', backgroundColor: 'rgba(255, 122, 138, 0.1)' }}>
                  <MapPin size={18} style={{ color: '#FF7A8A' }} />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide" style={{ color: '#FF7A8A' }}>Etapa 2 · Presencial</p>
                  <h4 className="font-display text-lg" style={{ color: '#1A1A1A' }}>Fluxo, presença e ambiência</h4>
                </div>
              </div>
              <ul className="space-y-3 text-sm" style={{ color: '#808080' }}>
                <li className="flex gap-2">
                  <CheckCircle2 size={16} className="text-green-600 shrink-0 mt-0.5" />
                  <span><strong style={{ color: '#1A1A1A' }}>Encontro com membros:</strong> o poder da troca com quem busca excelência.</span>
                </li>
                <li className="flex gap-2">
                  <CheckCircle2 size={16} className="text-green-600 shrink-0 mt-0.5" />
                  <span><strong style={{ color: '#1A1A1A' }}>Estratégia de posicionamento:</strong> LinkedIn e CV sob ótica de quem se destaca.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* DEPOIMENTOS */}
      <section className="px-6 py-20 bg-white" style={{ borderTop: '1px solid #E8E8E8', borderBottom: '1px solid #E8E8E8' }}>
        <div className="max-w-5xl mx-auto">
          <p className="text-xs uppercase tracking-wider mb-4 text-center font-semibold" style={{ color: '#808080' }}>Histórias reais</p>
          <h3 className="font-display text-4xl text-center mb-12" style={{ color: '#1A1A1A' }}>Quem passou por aqui</h3>

          <div className="grid md:grid-cols-3 gap-6">
            <a href="https://lnkd.in/p/esE9t5fr" target="_blank" rel="noopener noreferrer" className="rounded-lg p-6 border-2 transition-all hover:shadow-lg" style={{ backgroundColor: 'rgba(13, 128, 113, 0.08)', borderColor: '#0D8071' }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-white text-sm" style={{ backgroundColor: '#0D8071' }}>ML</div>
                <div>
                  <p className="font-semibold" style={{ color: '#1A1A1A' }}>Maria Laura Soares</p>
                  <p className="text-xs font-medium" style={{ color: '#0D8071' }}>CRM & Lifecycle Marketing</p>
                </div>
              </div>
              <p className="text-sm mb-4 leading-relaxed" style={{ color: '#808080' }}>"Percebi que alguns dos meus pontos fortes eu nunca tinha parado para identificar de forma consciente. Os primeiros encontros já ampliaram tanto minha visão, estou imaginando tudo o que tem pela frente."</p>
              <div className="flex justify-between items-center">
                <div className="text-lg">⭐⭐⭐⭐⭐</div>
                <p className="text-xs font-medium" style={{ color: '#0D8071' }}>Ver no LinkedIn →</p>
              </div>
            </a>

            <a href="https://lnkd.in/p/eetWmSiv" target="_blank" rel="noopener noreferrer" className="rounded-lg p-6 border-2 transition-all hover:shadow-lg" style={{ backgroundColor: 'rgba(255, 122, 138, 0.08)', borderColor: '#FF7A8A' }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-white text-sm" style={{ backgroundColor: '#FF7A8A' }}>GG</div>
                <div>
                  <p className="font-semibold" style={{ color: '#1A1A1A' }}>Giulia Gomes</p>
                  <p className="text-xs font-medium" style={{ color: '#FF7A8A' }}>CRM Analyst & Lifecycle Marketing</p>
                </div>
              </div>
              <p className="text-sm mb-4 leading-relaxed" style={{ color: '#808080' }}>"É uma mentoria muito voltada para carreira mesmo. Tenho saído desses encontros com aquela sensação de que estou ajustando o caminho, não só fazendo mais, mas fazendo melhor."</p>
              <div className="flex justify-between items-center">
                <div className="text-lg">⭐⭐⭐⭐⭐</div>
                <p className="text-xs font-medium" style={{ color: '#FF7A8A' }}>Ver no LinkedIn →</p>
              </div>
            </a>

            <a href="https://lnkd.in/p/euSGD_V9" target="_blank" rel="noopener noreferrer" className="rounded-lg p-6 border-2 transition-all hover:shadow-lg" style={{ backgroundColor: 'rgba(255, 179, 102, 0.08)', borderColor: '#FFB366' }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-white text-sm" style={{ backgroundColor: '#FFB366' }}>RA</div>
                <div>
                  <p className="font-semibold" style={{ color: '#1A1A1A' }}>Rita Alecrim</p>
                  <p className="text-xs font-medium" style={{ color: '#FFB366' }}>CRM Senior / Product Owner</p>
                </div>
              </div>
              <p className="text-sm mb-4 leading-relaxed" style={{ color: '#808080' }}>"Que mentoria incrível! Foram horas de muito conteúdo, trocas e aprendizado prático. Saio dessa mentoria com a bagagem cheia e com a expectativa de aplicar as novas estratégias."</p>
              <div className="flex justify-between items-center">
                <div className="text-lg">⭐⭐⭐⭐⭐</div>
                <p className="text-xs font-medium" style={{ color: '#FFB366' }}>Ver no LinkedIn →</p>
              </div>
            </a>
          </div>
        </div>
      </section>

      {/* Planos */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <h3 className="font-display text-3xl text-center mb-2" style={{ color: '#1A1A1A' }}>Escolha seu Plano</h3>
          <p className="text-sm text-center mb-12" style={{ color: '#808080' }}>Preços e parcelamentos exatamente como no checkout, sem letras miúdas.</p>

          <div className="grid md:grid-cols-2 gap-8">
            {planos.map((plano, i) => {
              const destaque = i === planos.length - 1 && planos.length > 1;
              return (
                <div key={plano.id} className="rounded-2xl p-8 border-2" style={{ borderColor: destaque ? '#1A1A1A' : '#E8E8E8', backgroundColor: destaque ? 'rgba(26, 26, 26, 0.02)' : '#FFFFFF' }}>
                  {destaque && <div className="mb-4"><span className="text-white text-xs font-medium px-3 py-1 rounded-full" style={{ backgroundColor: '#1A1A1A' }}>Mais completo</span></div>}
                  <h4 className="font-display text-2xl mb-1" style={{ color: '#1A1A1A' }}>{plano.nome}</h4>
                  {plano.foco && <p className="text-sm mb-6" style={{ color: '#808080' }}>{plano.foco}</p>}
                  <div className="mb-6">
                    <p className="font-display text-3xl mb-1" style={{ color: '#1A1A1A' }}>R$ {Number(plano.preco_avista).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    <p className="text-xs" style={{ color: '#808080' }}>à vista</p>
                  </div>
                  <Link href="/planos" className="w-full block text-center px-6 py-3 rounded-lg font-medium transition-colors" style={{ backgroundColor: destaque ? '#0D8071' : 'rgba(61, 217, 200, 0.1)', color: destaque ? '#1A1A1A' : '#0D8071' }}>
                    Escolher Plano
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Benefícios */}
      <section className="bg-white py-20" style={{ borderTop: '1px solid #E8E8E8', borderBottom: '1px solid #E8E8E8' }}>
        <div className="max-w-6xl mx-auto px-6">
          <h3 className="font-display text-3xl text-center mb-12" style={{ color: '#1A1A1A' }}>Por que SOMA?</h3>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <Compass size={32} className="mx-auto mb-4" style={{ color: '#1A1A1A' }} />
              <h4 className="font-display text-lg mb-2" style={{ color: '#1A1A1A' }}>Diagnóstico real</h4>
              <p className="text-sm" style={{ color: '#808080' }}>Análise de perfil feita por quem viveu o mercado, não um teste genérico.</p>
            </div>
            <div className="text-center">
              <Users size={32} className="mx-auto mb-4" style={{ color: '#0D8071' }} />
              <h4 className="font-display text-lg mb-2" style={{ color: '#1A1A1A' }}>Comunidade</h4>
              <p className="text-sm" style={{ color: '#808080' }}>Encontros presenciais com quem busca o mesmo nível de excelência.</p>
            </div>
            <div className="text-center">
              <Target size={32} className="mx-auto mb-4" style={{ color: '#FF7A8A' }} />
              <h4 className="font-display text-lg mb-2" style={{ color: '#1A1A1A' }}>Plano de ação</h4>
              <p className="text-sm" style={{ color: '#808080' }}>Roteiro prático de 90 dias, não só teoria.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Final — Preto */}
      <section style={{ backgroundColor: '#1A1A1A' }} className="w-full px-6 py-16 text-center">
        <div className="max-w-4xl mx-auto">
          <Sparkles size={28} className="mx-auto mb-4 opacity-80" style={{ color: '#0D8071' }} />
          <h3 className="font-display text-3xl mb-4 text-white">É o momento de somar suas forças</h3>
          <p className="text-lg mb-8 opacity-90 max-w-xl mx-auto text-white">Para quem não aceita mais perder, busca integrar quem é com o que faz e quer ocupar o seu lugar no mundo.</p>
          <Link href="/planos" className="inline-block px-8 py-4 rounded-lg font-display text-lg transition-colors" style={{ backgroundColor: '#0D8071', color: '#1A1A1A' }}>
            Ver Planos e Começar
          </Link>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-white" style={{ borderTop: '1px solid #E8E8E8' }}>
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="font-display text-4xl text-center text-black mb-2">Perguntas Frequentes</h2>
          <p className="text-center text-gray-text mb-12 text-base">Tire suas dúvidas sobre como a mentoria SOMA funciona</p>

          <div className="space-y-4">
            <details className="border border-gray-faint rounded-lg p-6 cursor-pointer hover:border-gray-text transition-colors" open>
              <summary className="font-display text-lg text-black flex justify-between items-center cursor-pointer">
                <span>Como a mentoria SOMA funciona?</span>
                <span className="text-gray-text">+</span>
              </summary>
              <p className="text-gray-text mt-4 leading-relaxed">A mentoria SOMA funciona em dois momentos. Primeiro você tem encontros online onde a gente mapeia quem você é, identifica seus diferenciais e desenha um plano prático de 90 dias. Depois você participa de encontros presenciais em grupo onde a gente trabalha networking, posicionamento profissional e aprende juntos com pessoas que buscam o mesmo nível de excelência que você.</p>
            </details>

            <details className="border border-gray-faint rounded-lg p-6 cursor-pointer hover:border-gray-text transition-colors">
              <summary className="font-display text-lg text-black flex justify-between items-center cursor-pointer">
                <span>Quanto tempo preciso dedicar à mentoria?</span>
                <span className="text-gray-text">+</span>
              </summary>
              <p className="text-gray-text mt-4 leading-relaxed">Oferecemos planos de 6 meses ou 12 meses conforme sua necessidade. A mentoria se adapta ao seu contexto, seja você começando algo novo, enfrentando uma crise ou buscando fazer as coisas com mais excelência. O tempo depende do quanto você quer evoluir e do quanto está disposto a se dedicar.</p>
            </details>

            <details className="border border-gray-faint rounded-lg p-6 cursor-pointer hover:border-gray-text transition-colors">
              <summary className="font-display text-lg text-black flex justify-between items-center cursor-pointer">
                <span>Qual é o investimento?</span>
                <span className="text-gray-text">+</span>
              </summary>
              <p className="text-gray-text mt-4 leading-relaxed">A gente oferece flexibilidade total. Você pode pagar à vista com PIX, em uma parcela no cartão ou parcelar ao longo dos meses. Depois que você confirma o pagamento, já ganha acesso ao portal com todos os materiais, agendamento dos encontros e começa a jornada. Tudo fica guardado lá pra você acompanhar seu progresso.</p>
            </details>

            <details className="border border-gray-faint rounded-lg p-6 cursor-pointer hover:border-gray-text transition-colors">
              <summary className="font-display text-lg text-black flex justify-between items-center cursor-pointer">
                <span>Preciso vir presencialmente?</span>
                <span className="text-gray-text">+</span>
              </summary>
              <p className="text-gray-text mt-4 leading-relaxed">Temos planos 100% online e planos presenciais. Se você não consegue vir pessoalmente, sem problema. Os encontros em grupo podem ser virtuais. O importante é que você realmente quer mudar de patamar na carreira e está aberto pra aprender com quem já passou pelo mesmo que você.</p>
            </details>

            <details className="border border-gray-faint rounded-lg p-6 cursor-pointer hover:border-gray-text transition-colors">
              <summary className="font-display text-lg text-black flex justify-between items-center cursor-pointer">
                <span>Posso ver quem já fez a mentoria?</span>
                <span className="text-gray-text">+</span>
              </summary>
              <p className="text-gray-text mt-4 leading-relaxed">Com certeza. No topo da página você já viu uns depoimentos. Mas se quiser ver mais histórias e histórias completas, é só clicar nos nomes deles que leva para os posts deles no LinkedIn. Lá você vê com as próprias palavras deles como foi a experiência de trabalhar comigo.</p>
            </details>
          </div>
        </div>
      </section>

      {/* Footer — Preto */}
      <footer style={{ backgroundColor: '#1A1A1A', borderTop: '1px solid #2D2D2D' }} className="py-8 text-center text-sm">
        <div className="max-w-6xl mx-auto px-6">
          <p style={{ color: '#999999' }}>© 2026 SOMA Mentoria. Todos os direitos reservados.</p>
          <div className="mt-4 space-x-6">
            <Link href="/termos" style={{ color: '#999999', textDecoration: 'none' }}>Termos</Link>
            <a href="https://instagram.com/jaquedocrm1112" target="_blank" rel="noopener noreferrer" style={{ color: '#999999', textDecoration: 'none' }}>Instagram</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

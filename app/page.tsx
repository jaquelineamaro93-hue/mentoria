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
              style={{ backgroundColor: '#3DD9C8' }}
            >
              Começar
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Preto Full */}
      <section style={{ backgroundColor: '#1A1A1A', color: '#FFFFFF' }} className="max-w-6xl mx-auto px-6 py-20 text-center">
        <p className="text-xs uppercase tracking-[0.25em] mb-4" style={{ color: '#3DD9C8' }}>
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
          style={{ backgroundColor: '#3DD9C8', color: '#1A1A1A' }}
        >
          Ver Planos
        </Link>
      </section>

      {/* Sobre — Branco */}
      <section className="bg-white py-20" style={{ borderTop: '1px solid #E8E8E8', borderBottom: '1px solid #E8E8E8' }}>
        <div className="max-w-4xl mx-auto px-6">
          <p className="text-xs uppercase tracking-[0.2em] mb-3 text-center" style={{ color: '#3DD9C8' }}>Sobre a mentora</p>
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
          <p className="text-xs uppercase tracking-[0.2em] mb-3 text-center" style={{ color: '#3DD9C8' }}>A metodologia</p>
          <h3 className="font-display text-3xl text-center mb-4" style={{ color: '#1A1A1A' }}>SOMA: sua totalidade</h3>
          <p className="text-center max-w-2xl mx-auto mb-12" style={{ color: '#808080' }}>
            A palavra SOMA vem do grego e representa a totalidade do ser: a união entre mente, corpo e espírito. Um chamado para você integrar todas as suas potências e parar de fragmentar quem você é.
          </p>

          <div className="grid sm:grid-cols-2 gap-6">
            {PILARES_SOMA.map((pilar) => {
              const cores: any = { S: '#3DD9C8', O: '#FF7A8A', M: '#FFB366', A: '#1A1A1A' };
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
          <p className="text-xs uppercase tracking-[0.2em] mb-3 text-center" style={{ color: '#3DD9C8' }}>Como funciona</p>
          <h3 className="font-display text-3xl text-center mb-12" style={{ color: '#1A1A1A' }}>Um programa híbrido em dois tempos</h3>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="border rounded-2xl p-8 bg-white" style={{ borderColor: '#E8E8E8' }}>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-full border-2 flex items-center justify-center" style={{ borderColor: '#3DD9C8', backgroundColor: 'rgba(61, 217, 200, 0.1)' }}>
                  <Video size={18} style={{ color: '#3DD9C8' }} />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide" style={{ color: '#3DD9C8' }}>Etapa 1 · Online</p>
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
            <div className="rounded-lg p-6 border-2" style={{ backgroundColor: 'rgba(61, 217, 200, 0.08)', borderColor: '#3DD9C8' }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-white text-sm" style={{ backgroundColor: '#3DD9C8' }}>NM</div>
                <div>
                  <p className="font-semibold" style={{ color: '#1A1A1A' }}>Natalia M.</p>
                  <p className="text-xs font-medium" style={{ color: '#3DD9C8' }}>S — Sabedoria Interna</p>
                </div>
              </div>
              <p className="text-sm mb-4 leading-relaxed" style={{ color: '#808080' }}>"A metodologia SOMA transformou minha carreira. Finalmente entendi meus diferenciais únicos."</p>
              <div className="text-lg">⭐⭐⭐⭐⭐</div>
            </div>

            <div className="rounded-lg p-6 border-2" style={{ backgroundColor: 'rgba(255, 122, 138, 0.08)', borderColor: '#FF7A8A' }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-white text-sm" style={{ backgroundColor: '#FF7A8A' }}>CB</div>
                <div>
                  <p className="font-semibold" style={{ color: '#1A1A1A' }}>Carlos B.</p>
                  <p className="text-xs font-medium" style={{ color: '#FF7A8A' }}>O — Objetividade Magnética</p>
                </div>
              </div>
              <p className="text-sm mb-4 leading-relaxed" style={{ color: '#808080' }}>"Estrutura cristalina, impacto real. Saí com um plano executável e posicionamento definido."</p>
              <div className="text-lg">⭐⭐⭐⭐⭐</div>
            </div>

            <div className="rounded-lg p-6 border-2" style={{ backgroundColor: 'rgba(255, 179, 102, 0.08)', borderColor: '#FFB366' }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-white text-sm" style={{ backgroundColor: '#FFB366' }}>SL</div>
                <div>
                  <p className="font-semibold" style={{ color: '#1A1A1A' }}>Sofia L.</p>
                  <p className="text-xs font-medium" style={{ color: '#FFB366' }}>M — Maestria em Ação</p>
                </div>
              </div>
              <p className="text-sm mb-4 leading-relaxed" style={{ color: '#808080' }}>"Encontrou os detalhes que ninguém vira. Agora tenho autoridade genuína em tudo que faço."</p>
              <div className="text-lg">⭐⭐⭐⭐⭐</div>
            </div>
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
                  <Link href="/planos" className="w-full block text-center px-6 py-3 rounded-lg font-medium transition-colors" style={{ backgroundColor: destaque ? '#3DD9C8' : 'rgba(61, 217, 200, 0.1)', color: destaque ? '#1A1A1A' : '#3DD9C8' }}>
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
              <Users size={32} className="mx-auto mb-4" style={{ color: '#3DD9C8' }} />
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
      <section style={{ backgroundColor: '#1A1A1A' }} className="py-16">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <Sparkles size={28} className="mx-auto mb-4 opacity-80" style={{ color: '#3DD9C8' }} />
          <h3 className="font-display text-3xl mb-4 text-white">É o momento de somar suas forças</h3>
          <p className="text-lg mb-8 opacity-90 max-w-xl mx-auto text-white">Para quem não aceita mais perder, busca integrar quem é com o que faz e quer ocupar o seu lugar no mundo.</p>
          <Link href="/planos" className="inline-block px-8 py-4 rounded-lg font-display text-lg transition-colors" style={{ backgroundColor: '#3DD9C8', color: '#1A1A1A' }}>
            Ver Planos e Começar
          </Link>
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

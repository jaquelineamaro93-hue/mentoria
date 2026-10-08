import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import type { PlanoMentoria } from '@/lib/types';
import { Mascot } from '@/components/soma/CareerJourney';

export default async function PlanosPage() {
  const supabase = await createClient();

  const { data: planosRaw } = await supabase
    .from('planos_mentoria')
    .select('*')
    .eq('ativo', true)
    .eq('visivel_checkout', true)
    .order('duracao_meses', { ascending: true })
    .order('ordem', { ascending: true });

  const planos = (planosRaw || []).filter((p) => {
    const hasTestInCodigo = p.codigo && p.codigo.toLowerCase().includes('teste');
    const hasTestInName = p.nome && p.nome.toLowerCase().includes('teste');
    const hasTestInDesc = p.descricao_encontros && p.descricao_encontros.toLowerCase().includes('teste');
    return !hasTestInCodigo && !hasTestInName && !hasTestInDesc;
  });

  return (
    <div className="min-h-screen bg-white px-4 py-6 sm:p-6">
      <div className="max-w-6xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 text-black hover:text-gray-text mb-6 sm:mb-8">
          <ArrowLeft size={20} />
          <span>Voltar</span>
        </Link>

        <section className="relative mb-10 overflow-hidden rounded-[28px] bg-[#102A2B] px-5 py-9 text-white sm:px-10 sm:py-12 lg:px-14" aria-labelledby="planos-titulo">
          <div aria-hidden="true" className="pointer-events-none absolute -right-20 -top-28 h-[420px] w-[420px] rounded-full border-[65px] border-white/[0.04]" />
          <div className="relative grid items-center gap-7 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="max-w-xl">
              <p className="mb-4 text-xs font-semibold uppercase tracking-[.22em] text-[#FFCB9C]">SOMA Mentoria | Ferramentas de carreira</p>
              <h1 id="planos-titulo" className="font-display text-4xl leading-tight sm:text-5xl">Sua carreira merece novas possibilidades</h1>
              <p className="mt-5 max-w-lg text-sm leading-7 text-[#D6E7DE] sm:text-base">Explore ferramentas para LinkedIn, currículo, Gupy e desenvolvimento profissional com o apoio da SOMA</p>
              <a href="#opcoes-de-acesso" className="mt-6 inline-flex min-h-12 items-center justify-center rounded-full bg-[#FFB366] px-6 py-3 text-sm font-semibold text-[#183F37] transition-colors hover:bg-[#FFD1A2] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">Conhecer opções de acesso</a>
            </div>
            <div className="relative grid grid-cols-4 gap-2 sm:gap-3 lg:grid-cols-2 lg:gap-4" aria-label="Lume, Norte, Brasa e Íris, mascotes oficiais da SOMA">
              {[
                { name: 'Lume', color: '#E9B95F', rotation: '-5deg' },
                { name: 'Norte', color: '#E79574', rotation: '5deg' },
                { name: 'Brasa', color: '#8AC6B1', rotation: '4deg' },
                { name: 'Íris', color: '#B9A3DF', rotation: '-4deg' },
              ].map((item, i) => (
                <div key={item.name} className="group relative flex min-w-0 flex-col items-center justify-center rounded-2xl border border-white/70 bg-[#F7F7EE] p-2 shadow-[0_18px_40px_rgba(0,0,0,.18)] transition-transform duration-300 hover:-translate-y-2 motion-reduce:transform-none sm:rounded-3xl sm:p-4" style={{ transform: 'rotate(' + item.rotation + ')' }}>
                  <div aria-hidden="true" className="pointer-events-none absolute inset-x-3 bottom-6 h-8 rounded-full opacity-30 blur-xl" style={{ backgroundColor: item.color }} />
                  <span className="soma-mascote-animado relative block transform-gpu transition-transform duration-500 group-hover:scale-110 motion-reduce:transform-none" style={{ animation: 'soma-mascote-float 4s ease-in-out infinite', animationDelay: i * -0.7 + 's' }}><Mascot index={i} size={125} /></span>
                  <span className="relative mt-1 text-xs font-semibold text-[#183F37] sm:text-sm">{item.name}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
        <div id="opcoes-de-acesso" className="mb-6 text-center sm:mb-9">
          <h2 className="font-display text-3xl text-[#183F37] sm:text-4xl">Escolha como começar</h2>
          <p className="mt-2 text-sm text-[#527064]">Encontre o plano que faz sentido para o seu momento</p>
        </div>

        <div className="grid md:grid-cols-2 gap-5 sm:gap-8">
          {(planos || []).map((plano: PlanoMentoria) => (
            <div key={plano.id} className="bg-white border-2 border-gray-faint rounded-2xl p-5 sm:p-8 flex flex-col">
              <div className="mb-6">
                <p className="text-xs font-medium text-blue-600 mb-2">{plano.duracao_meses} MESES</p>
                <h2 className="text-2xl font-display text-black mb-1">{plano.nome}</h2>
                <p className="text-sm mb-4">
                  {plano.codigo.includes('online') ? (
                    <span className="text-blue-600 font-medium">100% Online</span>
                  ) : (
                    <span className="text-gray-text">{plano.foco}</span>
                  )}
                </p>
                <p className="text-xs text-gray-text mb-6">{plano.descricao_encontros}</p>
              </div>

              <div className="space-y-2 mb-8 flex-grow">
                {(plano.itens_inclusos || []).map((item: string, i: number) => (
                  <div key={i} className="flex gap-2 text-sm text-black">
                    <span>✓</span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-faint pt-6 mb-6">
                <div className="space-y-2 mb-4">
                  <div className="flex flex-col gap-1 sm:flex-row sm:justify-between text-sm">
                    <span className="text-gray-text">PIX</span>
                    <span className="font-bold text-black">R$ {Number(plano.preco_avista).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex flex-col gap-1 sm:flex-row sm:justify-between text-sm">
                    <span className="text-gray-text">Cartão (1x)</span>
                    <span className="font-bold text-black">R$ {Number(plano.preco_cartao).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex flex-col gap-1 sm:flex-row sm:justify-between text-sm">
                    <span className="text-gray-text">Recorrente</span>
                    <span className="font-bold text-black">{plano.parcelas_recorrente}x R$ {(Number(plano.preco_recorrente_total) / plano.parcelas_recorrente).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2.5">
                {plano.trial_enabled && (
                  <Link
                    href={`/login?mode=cadastrar&trial_plan=${plano.id}`}
                    className="w-full inline-flex items-center justify-center border border-mint-deep bg-mint-light text-black py-3 rounded-lg font-medium hover:bg-mint/30 text-center transition"
                  >
                    {plano.trial_label || 'Teste grátis'} por até {plano.trial_days} dias
                  </Link>
                )}
                <Link
                  href={`/checkout?plan=${plano.id}`}
                  className="w-full inline-flex items-center justify-center bg-brown-deep text-white py-3 rounded-lg font-medium hover:bg-brown text-center transition"
                >
                  Comprar
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

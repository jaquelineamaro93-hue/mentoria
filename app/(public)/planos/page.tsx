import Link from 'next/link';
import ScrollToSectionButton from '@/components/public/ScrollToSectionButton';
import { ArrowLeft } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import type { PlanoMentoria } from '@/lib/types';
import { Mascot } from '@/components/soma/CareerJourney';
import SomaSaasShowcase from '@/components/public/SomaSaasShowcase';
import SomaCarreiraOptions from '@/components/public/SomaCarreiraOptions';

export default async function PlanosPage() {
  const supabase = await createClient();

  const { data: planosRaw } = await supabase
    .from('planos_mentoria')
    .select('*')
    .eq('ativo', true)
    .eq('visivel_checkout', true)
    .order('duracao_meses', { ascending: true })
    .order('ordem', { ascending: true });

  const { data: modulosRaw } = await supabase.from('soma_modules')
    .select('slug,title,description').eq('enabled', true)
    .order('display_order', { ascending: true });

  const planos = (planosRaw || []).filter((p) => {
    const hasTestInCodigo = p.codigo && p.codigo.toLowerCase().includes('teste');
    const hasTestInName = p.nome && p.nome.toLowerCase().includes('teste');
    const hasTestInDesc = p.descricao_encontros && p.descricao_encontros.toLowerCase().includes('teste');
    return !hasTestInCodigo && !hasTestInName && !hasTestInDesc;
  });

  return (
    <div className="min-h-screen bg-white px-4 py-6 sm:p-6">
      <div className="max-w-[1400px] mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 text-black hover:text-gray-text mb-6 sm:mb-8">
          <ArrowLeft size={20} />
          <span>Voltar</span>
        </Link>

        <section className="relative mb-10 overflow-hidden rounded-[28px] bg-[#102A2B] px-5 py-9 text-white sm:px-10 sm:py-12 lg:px-14" aria-labelledby="planos-titulo">
          <div aria-hidden="true" className="pointer-events-none absolute -right-20 -top-28 h-[420px] w-[420px] rounded-full border-[65px] border-white/[0.04]" />
          <div className="relative grid items-center gap-7 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="max-w-xl">
              <p className="mb-4 text-xs font-semibold uppercase tracking-[.22em] text-[#FFCB9C]">SOMA | Carreira e Plataforma</p>
              <h1 id="planos-titulo" className="font-display text-4xl leading-tight sm:text-5xl">Sua carreira merece novas possibilidades</h1>
              <p className="mt-5 max-w-lg text-sm leading-7 text-[#D6E7DE] sm:text-base">Escolha acompanhamento humano na SOMA Carreira ou monte sua assinatura de ferramentas na SOMA Plataforma.</p>
              <ScrollToSectionButton targetId="opcoes-de-acesso" className="mt-6 inline-flex min-h-12 items-center justify-center rounded-full bg-[#FFB366] px-6 py-3 text-sm font-semibold text-[#183F37] transition-colors hover:bg-[#FFD1A2] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">Conhecer opções de acesso</ScrollToSectionButton>
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

        <div className="grid items-start gap-8 lg:grid-cols-2 lg:gap-10">
        <section id="soma-carreira" aria-labelledby="soma-carreira-heading" className="min-w-0 rounded-3xl border border-[#dce8df] bg-[#fcfdfb] p-5 sm:p-7">
          <header className="mb-6"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-mint-deep">Mentoria · acompanhamento humano</p><h2 id="soma-carreira-heading" className="mt-2 font-display text-3xl text-[#183F37]">SOMA Carreira</h2><p className="mt-3 text-sm leading-7 text-[#4a645c]">Uma jornada com mentores, encontros e ferramentas para apoiar sua evolução profissional.</p></header>
        <div className="grid gap-4">
          {(planos || []).map((plano: PlanoMentoria) => (
            <div key={plano.id} className="bg-white border-2 border-[#e2e9e5] hover:border-[#91c8b7] transition-colors rounded-2xl p-5 sm:p-6 flex flex-col">
              <div className="mb-6">
                <p className="text-xs font-medium text-[#0D8071] mb-2">{plano.duracao_meses} MESES</p>
                <h2 className="text-2xl font-display text-[#183F37] mb-1">{plano.nome}</h2>
                <p className="text-sm mb-4">
                  {plano.codigo.includes('online') ? (
                    <span className="text-[#0D8071] font-medium">100% Online</span>
                  ) : (
                    <span className="text-gray-text">{plano.foco}</span>
                  )}
                </p>
                <p className="text-xs text-gray-text mb-6">{plano.descricao_encontros}</p>
              </div>

              <details className="mb-5 rounded-xl bg-[#f6faf7] p-4"><summary className="cursor-pointer text-sm font-semibold text-[#24473b]">Ver o que está incluído</summary><div className="mt-3 space-y-2">
                {(plano.itens_inclusos || []).map((item: string, i: number) => (
                  <div key={i} className="flex gap-2 text-sm text-black">
                    <span>✓</span>
                    <span>{item}</span>
                  </div>
                ))}
              </div></details>

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
                    className="w-full inline-flex items-center justify-center border border-[#bfd9c9] bg-[#f2faf5] text-[#174e3d] py-3 rounded-xl font-semibold hover:bg-[#e5f5ee] text-center transition"
                  >
                    {plano.trial_label || 'Teste grátis'} por até {plano.trial_days} dias
                  </Link>
                )}
                <Link
                  href={`/checkout?plan=${plano.id}`}
                  className="w-full inline-flex items-center justify-center bg-[#0D8071] text-white py-3 rounded-xl font-semibold hover:bg-[#096b5e] text-center transition"
                >
                  Comprar
                </Link>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-5"><SomaCarreiraOptions /></div>
        </section>
        <div className="min-w-0 rounded-3xl border border-[#dce8df] bg-[#fcfdfb] p-5 sm:p-7"><SomaSaasShowcase modulos={modulosRaw ?? []} /></div>
        </div>
      </div>
    </div>
  );
}

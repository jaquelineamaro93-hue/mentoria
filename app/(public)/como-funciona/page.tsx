import Link from 'next/link';

export default function ComoFuncionaPage() {
  return (
    <div className="min-h-screen bg-white">
      <header style={{ backgroundColor: '#1A1A1A', borderBottom: '1px solid #2D2D2D' }}>
        <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between gap-6">
          <Link href="/" className="font-display text-2xl text-white">SOMA Mentoria</Link>
          <nav className="hidden lg:flex items-center gap-6 text-sm text-white/70">
            <Link href="/como-funciona" className="text-white">Como funciona</Link>
            <Link href="/depoimentos" className="hover:text-white transition-colors">Depoimentos</Link>
            <Link href="/#planos" className="hover:text-white transition-colors">Planos</Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-white/90 font-medium text-sm">Entrar</Link>
            <Link href="/planos" className="px-5 py-2.5 rounded-lg font-medium text-sm text-white" style={{ backgroundColor: '#0D8071' }}>Começar</Link>
          </div>
        </div>
      </header>

      <main>
        <section className="px-6 py-16 md:py-20 bg-[#F8F7F4] border-b border-gray-faint">
          <div className="max-w-4xl mx-auto text-center">
            <p className="text-xs uppercase tracking-[0.22em] mb-3 text-mint-deep">Como funciona</p>
            <h1 className="font-display text-4xl md:text-5xl text-black">Humano no contexto, portal na continuidade.</h1>
            <p className="mt-5 text-gray-text leading-relaxed max-w-2xl mx-auto">
              O encontro ajuda a ler o momento. O portal registra decisões, ações e evolução para você não recomeçar do zero.
            </p>
          </div>
        </section>

        <section className="px-6 py-14 md:py-16">
          <div className="max-w-5xl mx-auto grid gap-5 md:grid-cols-2">
            <div className="border rounded-2xl p-7 bg-white" style={{ borderColor: '#E8E8E8' }}>
              <div className="h-10 w-10 rounded-full border flex items-center justify-center text-xs font-semibold tracking-[0.12em]" style={{ borderColor: 'rgba(13,128,113,.28)', color: '#0D8071', backgroundColor: 'rgba(13,128,113,.06)' }}>01</div>
              <p className="text-xs uppercase tracking-wide mt-5" style={{ color: '#0D8071' }}>Online</p>
              <h2 className="font-display text-2xl mt-1 text-black">Alinhamento e mapa individual</h2>
              <p className="mt-3 text-sm leading-relaxed text-gray-text">
                Metas, bloqueios, forças, contexto e direção traduzidos em um plano prático. O objetivo é entender seu cenário antes de escolher ferramentas ou ações.
              </p>
            </div>

            <div className="border rounded-2xl p-7 bg-white" style={{ borderColor: '#E8E8E8' }}>
              <div className="h-10 w-10 rounded-full border flex items-center justify-center text-xs font-semibold tracking-[0.12em]" style={{ borderColor: 'rgba(142,63,74,.25)', color: '#8E3F4A', backgroundColor: 'rgba(142,63,74,.06)' }}>02</div>
              <p className="text-xs uppercase tracking-wide mt-5" style={{ color: '#8E3F4A' }}>Presencial ou online</p>
              <h2 className="font-display text-2xl mt-1 text-black">Presença, posicionamento e troca</h2>
              <p className="mt-3 text-sm leading-relaxed text-gray-text">
                Situações reais, posicionamento profissional, repertório coletivo e próximos movimentos. A mentoria conecta reflexão com execução.
              </p>
            </div>
          </div>

          <div className="max-w-5xl mx-auto mt-6 rounded-2xl bg-[#F8F7F4] border border-gray-faint p-7 md:p-8">
            <p className="text-xs uppercase tracking-[0.18em] text-mint-deep">Entre um encontro e outro</p>
            <h2 className="font-display text-2xl md:text-3xl text-black mt-2">O portal mantém a jornada organizada.</h2>
            <p className="mt-3 text-sm md:text-base leading-relaxed text-gray-text max-w-3xl">
              Autoconhecimento, plano de desenvolvimento, primeiros 90 dias, currículo, vagas, LinkedIn e preparação para entrevistas ficam conectados ao seu contexto, para que o trabalho continue sem fragmentar a jornada.
            </p>
          </div>
        </section>

        <section className="px-6 py-12 text-center" style={{ backgroundColor: '#1A1A1A' }}>
          <h2 className="font-display text-3xl text-white">Veja o formato que combina com seu momento.</h2>
          <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/#planos" className="px-7 py-3.5 rounded-lg text-white font-medium" style={{ backgroundColor: '#0D8071' }}>Ver planos</Link>
            <Link href="/" className="px-7 py-3.5 rounded-lg border border-white/25 text-white font-medium">Voltar para a página inicial</Link>
          </div>
        </section>
      </main>
    </div>
  );
}

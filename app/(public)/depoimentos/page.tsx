import Link from 'next/link';

const depoimentos = [
  {
    nome: 'Maria Laura Soares',
    cargo: 'CRM & Lifecycle Marketing',
    iniciais: 'ML',
    texto: '"Percebi que alguns dos meus pontos fortes eu nunca tinha parado para identificar de forma consciente. Os primeiros encontros já ampliaram tanto minha visão, estou imaginando tudo o que tem pela frente."',
    href: 'https://lnkd.in/p/esE9t5fr',
    cor: '#0D8071',
    bg: 'rgba(13, 128, 113, 0.08)',
  },
  {
    nome: 'Giulia Gomes',
    cargo: 'CRM Analyst & Lifecycle Marketing',
    iniciais: 'GG',
    texto: '"É uma mentoria muito voltada para carreira mesmo. Tenho saído desses encontros com aquela sensação de que estou ajustando o caminho, não só fazendo mais, mas fazendo melhor."',
    href: 'https://lnkd.in/p/eetWmSiv',
    cor: '#B24D5B',
    bg: 'rgba(178, 77, 91, 0.08)',
  },
  {
    nome: 'Rita Alecrim',
    cargo: 'CRM Senior / Product Owner',
    iniciais: 'RA',
    texto: '"Que mentoria incrível! Foram horas de muito conteúdo, trocas e aprendizado prático. Saio dessa mentoria com a bagagem cheia e com a expectativa de aplicar as novas estratégias."',
    href: 'https://lnkd.in/p/euSGD_V9',
    cor: '#A85D24',
    bg: 'rgba(168, 93, 36, 0.08)',
  },
];

export default function DepoimentosPage() {
  return (
    <div className="min-h-screen bg-white">
      <header style={{ backgroundColor: '#1A1A1A', borderBottom: '1px solid #2D2D2D' }}>
        <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between gap-6">
          <Link href="/" className="font-display text-2xl text-white">SOMA Mentoria</Link>
          <nav className="hidden lg:flex items-center gap-6 text-sm text-white/70">
            <Link href="/como-funciona" className="hover:text-white transition-colors">Como funciona</Link>
            <Link href="/depoimentos" className="text-white">Depoimentos</Link>
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
            <p className="text-xs uppercase tracking-[0.22em] mb-3 text-mint-deep">Histórias reais</p>
            <h1 className="font-display text-4xl md:text-5xl text-black">Quem passou por aqui</h1>
            <p className="mt-5 text-gray-text leading-relaxed max-w-2xl mx-auto">
              Relatos de pessoas que usaram a SOMA para organizar decisões, reconhecer forças e transformar clareza em movimento.
            </p>
          </div>
        </section>

        <section className="px-6 py-14 md:py-16">
          <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-6">
            {depoimentos.map((item) => (
              <a
                key={item.nome}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-2xl p-6 border transition-all hover:-translate-y-1 hover:shadow-lg"
                style={{ backgroundColor: item.bg, borderColor: item.cor }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-white text-sm" style={{ backgroundColor: item.cor }}>
                    {item.iniciais}
                  </div>
                  <div>
                    <p className="font-semibold text-black">{item.nome}</p>
                    <p className="text-xs font-medium" style={{ color: item.cor }}>{item.cargo}</p>
                  </div>
                </div>
                <p className="text-sm mb-5 leading-relaxed text-gray-text">{item.texto}</p>
                <div className="flex justify-between items-center">
                  <div className="text-lg" aria-label="5 estrelas">⭐⭐⭐⭐⭐</div>
                  <span className="text-xs font-semibold" style={{ color: item.cor }}>Ver no LinkedIn →</span>
                </div>
              </a>
            ))}
          </div>
        </section>

        <section className="px-6 py-12 text-center" style={{ backgroundColor: '#1A1A1A' }}>
          <h2 className="font-display text-3xl text-white">Quer entender se a SOMA faz sentido para seu momento?</h2>
          <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/#planos" className="px-7 py-3.5 rounded-lg text-white font-medium" style={{ backgroundColor: '#0D8071' }}>Ver planos</Link>
            <Link href="/" className="px-7 py-3.5 rounded-lg border border-white/25 text-white font-medium">Voltar para a página inicial</Link>
          </div>
        </section>
      </main>
    </div>
  );
}

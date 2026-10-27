import Link from 'next/link';
import { LanguageSwitcher } from '@/components/LocaleProvider';
import LocalizedText from '@/components/LocalizedText';

const navigation = [
  { label: 'Como funciona', href: '/como-funciona' },
  { label: 'Portal', href: '/portal' },
  { label: 'Rede SOMA', href: '/rede-soma' },
  { label: 'Depoimentos', href: '/depoimentos' },
  { label: 'Cases', href: '/cases' },
  { label: 'Planos', href: '/planos' },
] as const;

/** Header e rodapé compartilhados somente por páginas institucionais. */
export function SomaSiteHeader({ active }: { active?: string }) {
  return (
    <header className="sticky top-0 z-50 border-b border-[#31463F] bg-[#0F1A18]/95 text-[#EEF3F1] backdrop-blur-md">
      <div className="mx-auto flex min-h-[76px] max-w-[1280px] items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" aria-label="SOMA Mentoria, ir para página inicial" className="shrink-0 font-display text-xl font-semibold tracking-tight text-white sm:text-2xl">
          SOMA <span className="font-serif font-normal italic text-[#8FD3BE]">Mentoria</span>
        </Link>
        <nav aria-label="Navegação principal" className="hidden items-center gap-4 lg:flex xl:gap-6">
          {navigation.map(item => (
            <Link key={item.href} href={item.href} aria-current={active === item.href ? 'page' : undefined}
              className={`text-sm transition-colors hover:text-white ${active === item.href ? 'font-semibold text-[#8FD3BE]' : 'text-[#C3D0CC]'}`}>
              <LocalizedText text={item.label} />
            </Link>
          ))}
        </nav>
        <div className="flex shrink-0 items-center gap-2">
          <Link href="/login" className="hidden min-h-11 items-center px-2 text-sm font-semibold text-[#E3EEE9] hover:text-white sm:inline-flex">Entrar</Link>
          <Link href="/planos" className="inline-flex min-h-11 items-center justify-center rounded-full bg-[#8FD3BE] px-4 text-sm font-semibold text-[#0F1A18] transition-colors hover:bg-[#C6F0E2] sm:px-6">Começar</Link>
          <div className="hidden md:block"><LanguageSwitcher /></div>
          <details className="group relative lg:hidden">
            <summary className="flex min-h-11 cursor-pointer list-none items-center justify-center rounded-full border border-[#4B6259] px-3 text-sm text-white [&::-webkit-details-marker]:hidden" aria-label="Abrir navegação">Menu</summary>
            <nav aria-label="Navegação móvel" className="absolute right-0 top-12 z-50 flex w-60 flex-col gap-1 rounded-2xl border border-[#3B594D] bg-[#10211C] p-3 shadow-2xl">
              {navigation.map(item => <Link key={item.href} href={item.href} className="rounded-lg px-3 py-2.5 text-sm text-[#EEF3F1] hover:bg-white/10"><LocalizedText text={item.label}/></Link>)}
              <Link href="/login" className="rounded-lg px-3 py-2.5 text-sm text-[#EEF3F1] hover:bg-white/10">Entrar</Link>
              <div className="border-t border-white/15 pt-3 md:hidden"><LanguageSwitcher /></div>
            </nav>
          </details>
        </div>
      </div>
    </header>
  );
}

export function SomaSiteFooter() {
  return (
    <footer className="border-t border-[#2E443B] bg-[#0B1412] text-[#DCE7E1]">
      <div className="mx-auto grid max-w-7xl gap-9 px-5 py-12 sm:px-8 md:grid-cols-[1.3fr_1fr_1fr] md:py-16">
        <div className="max-w-sm">
          <Link href="/" className="font-display text-2xl font-semibold text-white">SOMA <span className="font-serif font-normal italic text-[#8FD3BE]">Mentoria</span></Link>
          <p className="mt-1 text-xs font-semibold uppercase tracking-[.18em] text-[#8FD3BE]">Desde 2022</p>
          <p className="mt-5 text-sm leading-7 text-[#A9BAB5]">Mentoria de carreira e portal de acompanhamento para quem quer crescer com clareza</p>
        </div>
        <div>
          <h2 className="mb-4 text-xs font-bold uppercase tracking-[.2em] text-[#8FD3BE]">Navegação</h2>
          <nav className="grid grid-cols-2 gap-x-5 gap-y-3 text-sm">
            {navigation.map(item => <Link key={item.href} className="text-[#C3D0CC] hover:text-white" href={item.href}><LocalizedText text={item.label}/></Link>)}
          </nav>
        </div>
        <div>
          <h2 className="mb-4 text-xs font-bold uppercase tracking-[.2em] text-[#8FD3BE]">Converse com a SOMA</h2>
          <a className="block text-sm text-[#C3D0CC] hover:text-white" href="mailto:consultoria@camarocrm.com">consultoria@camarocrm.com</a>
          <a className="mt-3 block text-sm text-[#C3D0CC] hover:text-white" target="_blank" rel="noopener noreferrer" href="https://instagram.com/jaquedocrm1112">Instagram</a>
          <Link className="mt-3 block text-sm text-[#C3D0CC] hover:text-white" href="/quem-faz">Quem faz a SOMA</Link>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-wrap justify-between gap-3 px-5 py-5 text-xs text-[#8EA69A] sm:px-8">
          <span>© {new Date().getFullYear()} SOMA Mentoria</span>
          <div className="flex gap-5"><Link href="/termos">Termos e privacidade</Link><Link href="/contratos">Contratos</Link></div>
        </div>
      </div>
    </footer>
  );
}

export function SomaSiteCallToAction({ title = 'É o momento de somar suas forças' }: { title?: string }) {
  return (
    <section className="border-t border-white/10 bg-[#142922] px-5 py-16 text-center sm:py-20">
      <h2 className="mx-auto max-w-4xl font-display text-4xl font-semibold tracking-tight text-[#EEF3F1] sm:text-5xl">{title}</h2>
      <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-[#C3D0CC]">Clareza para decidir, estratégia para se posicionar e acompanhamento para continuar avançando</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/planos" className="inline-flex min-h-12 items-center rounded-full bg-[#8FD3BE] px-7 font-semibold text-[#10221c] hover:bg-[#C6F0E2]">Ver planos e começar</Link>
        <Link href="/login" className="inline-flex min-h-12 items-center rounded-full border border-[#59766B] px-7 font-semibold text-white hover:border-[#8FD3BE]">Já faço parte</Link>
      </div>
    </section>
  );
}

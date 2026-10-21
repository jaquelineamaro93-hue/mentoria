import { Sparkles } from 'lucide-react';

export default function PortalLoading() {
  return (
    <section aria-label="Carregando a sua jornada" role="status" aria-live="polite"
      className="mx-auto w-full max-w-5xl px-1 py-6 sm:py-10">
      <div className="mb-7 flex items-center gap-3">
        <span aria-hidden="true" className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#e2f3ef] text-[#0d8071]">
          <Sparkles size={22} />
        </span>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.17em] text-[#0d8071]">Sua jornada SOMA</p>
          <h2 className="mt-1 font-display text-2xl text-[#183f37] sm:text-3xl">Preparando sua próxima ofensiva</h2>
        </div>
      </div>
      <p className="mb-6 text-sm text-[#536e63]">Organizando as informações da sua carreira com segurança.</p>
      <div className="grid animate-pulse gap-4 motion-reduce:animate-none sm:grid-cols-2">
        <div className="h-32 rounded-2xl border border-[#e2e9e4] bg-[#ecf1ef]" />
        <div className="h-32 rounded-2xl border border-[#e2e9e4] bg-[#ecf1ef]" />
        <div className="h-24 rounded-2xl border border-[#e2e9e4] bg-[#ecf1ef] sm:col-span-2" />
      </div>
    </section>
  );
}

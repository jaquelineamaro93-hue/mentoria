/**
 * Composição visual do hero SOMA baseada no Home-html (3).
 * Ilustra o percurso no portal, não dados reais de uma conta.
 * Mantém os módulos independentes para escalarem de desktop a mobile.
 */
export default function SomaHeroJourney() {
  return (
    <div aria-hidden="true" className="soma-hero-journey relative mx-auto h-[375px] w-full max-w-[470px] shrink-0 sm:h-[500px] lg:mx-0 lg:h-[520px] lg:max-w-none">
      <div className="soma-home-boia-one absolute left-[3%] top-2 flex w-[62%] items-center gap-3 rounded-[18px] border border-[#2F5A50] bg-[#1C2E2B] px-3 py-3 shadow-[0_20px_40px_rgba(0,0,0,.35)] sm:left-[4%] sm:top-5 sm:w-[55%] sm:px-[18px] sm:py-4" style={{ rotate: '-4deg' }}>
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#8FD3BE] text-sm font-bold text-[#0F1A18]">✓</span>
        <span className="min-w-0"><strong className="block text-[13px] leading-tight text-[#EEF3F1] sm:text-[15px]">Mapa Quem Sou Eu</strong><span className="mt-1 block text-xs text-[#A9BAB5] sm:text-[13px]">Concluído</span></span>
      </div>

      <div className="soma-home-boia-two absolute left-[12%] top-[88px] flex w-[82%] flex-col gap-3 rounded-[22px] bg-[#EEF3F1] p-4 text-[#0F1A18] shadow-[0_30px_60px_rgba(0,0,0,.45)] sm:left-[14%] sm:top-[120px] sm:w-[76%] sm:gap-[14px] sm:p-6">
        <span className="text-[11px] font-bold tracking-[.08em] text-[#22685A] sm:text-xs">SEU PDI</span>
        <span className="font-serif text-[26px] italic leading-[1.05] sm:text-[30px]">Plano que vira rotina</span>
        <span className="h-[6px] w-full rounded-full bg-[#D5DFDB]"><span className="block h-full w-[62%] rounded-full bg-[#22685A]"/></span>
        <div className="grid gap-2 text-xs sm:text-sm">
          <span className="rounded-[10px] border border-[#D5DFDB] bg-white px-3 py-2.5 leading-snug">✓ Definir prioridade de desenvolvimento</span>
          <span className="rounded-[10px] border border-[#D5DFDB] bg-white px-3 py-2.5 leading-snug text-[#4F5652]">○ Revisar avanço no check-in mensal</span>
        </div>
      </div>

      <div className="soma-home-boia-three absolute bottom-[55px] right-[2%] flex w-[70%] items-center gap-2.5 rounded-[20px] bg-[#8FD3BE] px-3 py-3 text-[#0F1A18] shadow-[0_20px_40px_rgba(0,0,0,.35)] sm:bottom-10 sm:right-0 sm:w-[60%] sm:gap-3 sm:px-[18px] sm:py-4" style={{ rotate: '3deg' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/jaqueline-amaro-2026.webp" alt="" width={44} height={44} decoding="async" loading="lazy" className="h-10 w-10 shrink-0 rounded-full border-2 border-[#0F1A18] object-cover object-[center_20%] sm:h-11 sm:w-11"/>
        <span className="min-w-0"><strong className="block text-[10px] font-bold tracking-wide sm:text-xs">PRÓXIMO ENCONTRO</strong><span className="mt-0.5 block text-[12px] font-semibold leading-tight sm:text-[14px]">Individual com a Jaqueline</span><span className="mt-1 block text-[11px] sm:text-[13px]">Agendamento no portal</span></span>
      </div>

      <div className="soma-home-boia-one absolute bottom-0 left-0 flex max-w-full items-center gap-2.5 rounded-full border border-[#2F5A50] bg-[#0F1A18] py-2 pl-2 pr-4 text-xs text-[#EEF3F1] shadow-lg sm:bottom-2 sm:gap-3 sm:text-sm">
        <span className="flex shrink-0 items-center">
          <span className="grid h-7 w-7 place-items-center rounded-full border-2 border-[#0F1A18] bg-[#2F5A50] text-[10px] font-bold">NF</span>
          <span className="-ml-2 grid h-7 w-7 place-items-center rounded-full border-2 border-[#0F1A18] bg-[#5A4A2F] text-[10px] font-bold">HS</span>
          <span className="-ml-2 grid h-7 w-7 place-items-center rounded-full border-2 border-[#0F1A18] bg-[#4A2F5A] text-[10px] font-bold">JC</span>
        </span>
        <span>Histórias reais de carreira</span>
      </div>
    </div>
  );
}

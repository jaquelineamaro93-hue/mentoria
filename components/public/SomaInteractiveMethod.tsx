'use client';

import { useState } from 'react';

const pillars = [
  { letter:'S', name:'Sabedoria Interna', color:'#8FD3BE', text:'A base de tudo é o acesso à sua verdade. Identificar seus diferenciais únicos e silenciar o ruído externo para ouvir o que sua trajetória e seus valores dizem sobre o seu próximo passo.' },
  { letter:'O', name:'Objetividade Magnética', color:'#F2A7AE', text:'Ter propósito sem direção é apenas sonho. Transformamos sua essência em metas claras, com uma estratégia que atrai as oportunidades certas porque você sabe exatamente o que está buscando.' },
  { letter:'M', name:'Maestria em Ação', color:'#E9B49A', text:'O conhecimento só se torna poder quando aplicado. Excelência na execução, refinamento das suas habilidades e coragem de agir com autoridade e presença no mercado.' },
  { letter:'A', name:'Alquimia de Resultados', color:'#EEF3F1', text:'Onde a estratégia encontra a realização. O estágio de colheita e expansão, onde você transforma desafios em crescimento contínuo e sustenta o sucesso com equilíbrio e propósito.' },
];
const moments = [
  { short:'Crescer onde estou', phrase:'Quero crescer onde estou.', items:['Leitura de cenário','Primeiros 90 dias','Posicionamento interno','Plano de desenvolvimento (PDI)'] },
  { short:'Nova oportunidade', phrase:'Quero uma nova oportunidade.', items:['Currículo, Gupy & ATS','LinkedIn e networking','Vagas e candidaturas','Entrevistas'] },
  { short:'Entender minha direção', phrase:'Ainda preciso entender minha direção.', items:['Mapa Quem Sou Eu','Diagnóstico e forças','Diário de bordo','Acompanhamento para sair da dúvida'] },
];

export function SomaInteractiveMethod() {
  const [active, setActive] = useState(0);
  const p = pillars[active];
  return <section className="mx-auto max-w-7xl px-5 py-14 sm:px-8 sm:py-20" aria-labelledby="soma-method-heading">
    <div className="mb-6 flex flex-wrap items-baseline justify-between gap-2">
      <p className="text-sm font-semibold text-[#8FD3BE]">Como funciona · o método</p>
      <p className="text-sm text-[#93A6A1]">Toque em cada letra</p>
    </div>
    <div role="tablist" aria-label="Pilares do método SOMA" className="grid grid-cols-4 gap-1 border-b border-[#2B403C] sm:gap-3">
      {pillars.map((item,i)=><button key={item.letter} id={`method-tab-${i}`} type="button" role="tab" aria-selected={i===active} aria-controls="method-content"
        onClick={()=>setActive(i)}
        className="min-w-0 px-0 py-1 text-center font-display text-[clamp(4.8rem,17vw,15rem)] font-extrabold leading-none tracking-[-.07em] transition-colors focus-visible:outline-2 focus-visible:outline-[#8FD3BE]"
        style={{ color:i===active?item.color:'#536D62' }}>{item.letter}</button>)}
    </div>
    <div id="method-content" role="tabpanel" aria-labelledby={`method-tab-${active}`} className="grid gap-6 border-b border-[#2B403C] py-8 md:grid-cols-[.9fr_1.2fr] md:gap-14">
      <div><p className="text-sm text-[#93A6A1]">0{active+1} de 04</p><h1 id="soma-method-heading" className="mt-2 font-display text-4xl italic text-[#EEF3F1] sm:text-5xl">{p.name}</h1></div>
      <p className="max-w-2xl text-lg leading-8 text-[#C3D0CC] sm:text-xl">{p.text}</p>
    </div>
  </section>;
}

export function SomaInteractiveMoment() {
  const [selected,setSelected]=useState(0);
  const current=moments[selected];
  return <section className="border-t border-[#22332F] py-14 sm:py-20">
    <div className="mx-auto max-w-7xl px-5 sm:px-8">
      <h2 className="max-w-4xl font-display text-4xl font-semibold leading-tight tracking-tight sm:text-6xl">A mesma carreira pede <span className="font-serif font-normal italic text-[#8FD3BE]">estratégias diferentes.</span></h2>
      <div className="mt-9 flex flex-wrap gap-2" role="tablist" aria-label="Seu momento profissional">
        {moments.map((item,i)=><button key={item.short} type="button" role="tab" aria-selected={i===selected} onClick={()=>setSelected(i)}
          className={`rounded-full px-5 py-3 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8FD3BE] ${selected===i?'bg-[#8FD3BE] text-[#0F1A18]':'border border-[#3C5550] text-[#C3D0CC] hover:border-[#8FD3BE]'}`}>{item.short}</button>)}
      </div>
      <div className="mt-8 grid gap-8 rounded-3xl border border-[#2D493E] bg-[#152721] p-6 sm:p-9 md:grid-cols-[1fr_1fr]">
        <div><p className="text-sm text-[#8FD3BE]">0{selected+1} / 03</p><h3 className="mt-4 font-display text-3xl font-semibold sm:text-4xl">“{current.phrase}”</h3><p className="mt-5 text-base leading-7 text-[#C3D0CC]">Cada momento pede uma estratégia diferente. A SOMA parte do seu contexto para organizar o próximo passo.</p></div>
        <div><h4 className="mb-4 text-base font-semibold text-[#8FD3BE]">O que trabalhamos na mentoria</h4><ul className="grid gap-3">{current.items.map(item=><li key={item} className="flex items-center gap-3 border-b border-white/10 pb-3 text-base text-[#E4F0EB]"><span className="h-2 w-2 rounded-full bg-[#8FD3BE]" />{item}</li>)}</ul></div>
      </div>
    </div>
  </section>;
}

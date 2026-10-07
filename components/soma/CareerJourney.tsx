'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, Lock, Sparkles, Check } from 'lucide-react';

const companions = [
  { name: 'Lume', animal: 'Coruja', color: '#E9B95F', dark: '#563D20', score: 0, chapter: 'Acenda sua clareza', meaning: 'Sabedoria para reconhecer suas forças.', quote: 'Você não precisa ter todas as respostas. Comece pelo que já existe de forte em você.', mission: 'Conhecer minhas forças', href: '/quem-sou-eu' },
  { name: 'Norte', animal: 'Raposa', color: '#E79574', dark: '#6F3C35', score: 300, chapter: 'Escolha sua direção', meaning: 'Objetividade para transformar intenção em movimento.', quote: 'Uma carreira com direção começa com um próximo passo que cabe na sua vida.', mission: 'Traçar meu próximo passo', href: '/pdi' },
  { name: 'Brasa', animal: 'Capivara', color: '#8AC6B1', dark: '#28594B', score: 700, chapter: 'Cultive sua potência', meaning: 'Maestria construída com prática e constância.', quote: 'Pequenos passos também são avanço. Vamos dar consistência ao que você já começou?', mission: 'Explorar minha jornada', href: '/dashboard' },
  { name: 'Íris', animal: 'Beija-flor', color: '#B9A3DF', dark: '#51406F', score: 1500, chapter: 'Abra novos caminhos', meaning: 'Alquimia para conectar sua história às oportunidades.', quote: 'Sua história tem valor. Agora é hora de fazer o mundo enxergar o que você soma.', mission: 'Explorar oportunidades', href: '/vagas' },
];

function Mascot({ index, size = 160 }: { index: number; size?: number }) {
  const c = companions[index];
  return <svg viewBox="0 0 200 200" width={size} height={size} role="img" aria-label={`${c.name}, ${c.animal} da SOMA`} className="max-w-full drop-shadow-xl">
    <ellipse cx="100" cy="181" rx="52" ry="8" fill={c.dark} opacity=".12" />
    {index === 3 ? <>
      <path d="M89 110Q15 24 40 124Q58 151 94 140M110 108Q172 17 162 124Q148 148 109 140" fill={c.color} />
      <ellipse cx="100" cy="131" rx="32" ry="44" fill={c.dark}/><circle cx="102" cy="86" r="30" fill={c.color}/><path d="M128 79L184 72L130 91" fill={c.dark}/><path d="M91 163L71 184L111 174" fill={c.color}/>
    </> : <>
      {index === 1 && <path d="M127 153Q188 164 172 93Q151 109 141 140" fill={c.color}/>}
      <ellipse cx="100" cy="132" rx="49" ry="45" fill={c.dark}/>
      {index !== 2 ? <path d="M48 86L49 26L82 54L119 54L150 26L151 87" fill={c.color}/> : <><circle cx="61" cy="63" r="18" fill={c.dark}/><circle cx="139" cy="63" r="18" fill={c.dark}/></>}
      <rect x="45" y="53" width="110" height="86" rx={index === 2 ? 35 : 43} fill={c.color}/>
      {index === 0 && <><circle cx="77" cy="91" r="25" fill="#FFF5DD"/><circle cx="122" cy="91" r="25" fill="#FFF5DD"/></>}
      {index === 1 && <path d="M49 96Q74 116 100 131Q127 112 151 96L123 133L77 133Z" fill="#FFF5DD"/>}
      {index === 2 && <ellipse cx="100" cy="112" rx="37" ry="21" fill="#CFE9DD"/>}
      <path d="M63 156L80 167M120 167L138 156" stroke={c.color} strokeWidth="13" strokeLinecap="round"/>
    </>}
    <circle cx={index === 3 ? 110 : 78} cy={index === 3 ? 82 : 91} r="5" fill={c.dark}/>
    {index !== 3 && <><circle cx="122" cy="91" r="5" fill={c.dark}/><path d="M94 108Q100 115 107 108" fill="none" stroke={c.dark} strokeWidth="3" strokeLinecap="round"/></>}
    <path d="M96 139L100 151L111 153L102 161L104 173L93 167L83 172L85 160L77 152L89 151Z" fill="#FFE5A0"/>
    <path d="M161 33V49M153 41H169M32 116V126M27 121H37" stroke={c.color} strokeWidth="3" strokeLinecap="round"/>
  </svg>;
}

export function CareerCompanion({ points }: { points: number }) {
  const index = companions.reduce((level, item, i) => points >= item.score ? i : level, 0);
  return <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F3F5ED] px-2 py-1 text-[10px] font-semibold text-[#386657]"><Mascot index={index} size={30}/>{companions[index].name}</span>;
}

export default function CareerJourney({ points, earned, total }: { points: number; earned: number; total: number }) {
  const active = companions.reduce((level, c, index) => points >= c.score ? index : level, 0);
  const [selected, setSelected] = useState<number | null>(null);
  const index = selected ?? active;
  const c = companions[index];
  const unlocked = points >= c.score;
  const next = companions[active + 1];
  const progress = next ? Math.min(100, Math.max(0, (points - companions[active].score) / (next.score - companions[active].score) * 100)) : 100;
  return <section className="mb-8 overflow-hidden rounded-[28px] border border-[#DFE7DD] bg-[#F7F7EE]">
    <div className="relative overflow-hidden bg-[#183F37] px-6 py-8 text-white sm:px-9">
      <div className="pointer-events-none absolute -right-12 -top-28 h-96 w-96 rounded-full border-[45px] border-white/5"/>
      <p className="relative flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[.25em] text-[#B7DAC6]"><Sparkles size={15}/> A Expedição SOMA</p>
      <div className="relative mt-3 flex flex-wrap items-end justify-between gap-5"><div><h2 className="max-w-lg font-display text-3xl leading-tight sm:text-4xl">Sua carreira tem uma história.<br/><span className="text-[#EFC77D]">Vamos escrever o próximo capítulo?</span></h2><p className="mt-3 max-w-lg text-sm leading-6 text-[#D0E3D9]">Cada ação vira um Impulso. Cada capítulo revela uma nova força em você.</p></div><div className="rounded-2xl border border-white/15 bg-white/10 px-5 py-4"><strong className="block text-3xl">{points.toLocaleString('pt-BR')}</strong><span className="text-xs text-[#D0E3D9]">Impulsos na sua jornada</span></div></div>
    </div>
    <div className="grid gap-6 p-5 sm:p-8 lg:grid-cols-[1.2fr_1fr]">
      <div className="relative flex flex-col items-center gap-3 rounded-3xl p-6 text-center sm:flex-row sm:text-left" style={{ backgroundColor: `${c.color}30` }}>
        <div className="shrink-0"><Mascot index={index}/></div><div><p className="text-xs font-medium uppercase tracking-widest" style={{color:c.dark}}>Capítulo {index + 1} · {unlocked ? 'Companheiro desbloqueado' : 'Ainda no horizonte'}</p><h3 className="mt-2 text-3xl font-bold" style={{color:c.dark}}>{c.name}</h3><p className="mt-1 text-sm font-semibold">{c.meaning}</p><blockquote className="mt-4 text-sm leading-6 text-[#425049]">“{c.quote}”</blockquote>{unlocked ? <Link href={c.href} className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#183F37] px-5 py-3 text-xs font-semibold text-white">{c.mission}<ArrowUpRight size={15}/></Link> : <p className="mt-4 flex items-center justify-center gap-2 text-sm font-semibold sm:justify-start"><Lock size={14}/>{(c.score-points).toLocaleString('pt-BR')} Impulsos para conhecer {c.name}</p>}</div>
      </div>
      <div className="flex flex-col justify-center"><p className="text-xs font-bold uppercase tracking-[.2em] text-[#386657]">Seu mapa de evolução</p><div className="mt-4 grid grid-cols-4 gap-2">{companions.map((item,i)=><button key={item.name} onClick={()=>setSelected(i)} aria-pressed={index===i} className={`rounded-2xl border p-2 text-center transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#183F37] focus-visible:ring-offset-2 hover:-translate-y-1 motion-reduce:transform-none ${index===i ? 'border-[#386657] bg-white shadow-md' : 'border-transparent bg-white/60'}`}><div className={points<item.score ? 'opacity-50' : ''}><Mascot index={i} size={80}/></div><span className="block text-xs font-bold">{item.name}</span><span className="mt-1 flex items-center justify-center gap-1 text-[10px] text-[#527064]">{points>=item.score ? <Check size={11}/> : <Lock size={10}/>} {item.score}</span></button>)}</div><h3 className="mt-5 text-lg font-bold text-[#183F37]">{companions[active].chapter}</h3><div role="progressbar" aria-label="Progresso até o próximo companheiro" aria-valuenow={Math.round(progress)} aria-valuemin={0} aria-valuemax={100} className="mt-3 h-2.5 overflow-hidden rounded-full bg-[#DDE5D7]"><div className="h-full rounded-full bg-[#598F72] transition-all" style={{width:`${progress}%`}}/></div><p className="mt-3 text-xs leading-5 text-[#527064]">{next ? `Mais ${(next.score-points).toLocaleString('pt-BR')} Impulsos e ${next.name} entra na sua história.` : 'Todos os companheiros chegaram. Sua jornada continua nas próximas conquistas.'}</p><p className="mt-2 text-xs text-[#527064]">{earned} de {total} conquistas registradas · Seu ritmo também merece ser celebrado.</p></div>
    </div>
  </section>;
}

'use client';
import {useState} from 'react';
import {GAME_LABELS,gradeGame,parseGames,publicGame,type GameKind,type LearningGame,type PublicGame} from '@/lib/learning/games';
import LearningGames from './LearningGames';
const input='mt-1 block w-full rounded-lg border border-[#c5d9cd] bg-white px-3 py-2.5 text-sm text-[#213d34]';
export default function GameEditor({games,onChange}:{games:LearningGame[];onChange:(games:LearningGame[])=>void}){
 const [preview,setPreview]=useState<PublicGame[]|null>(null),[previewSource,setPreviewSource]=useState<LearningGame[]>([]),[error,setError]=useState('');
 function update(index:number,patch:Partial<LearningGame>){setPreview(null);onChange(games.map((g,i)=>i===index?{...g,...patch}:g));}
 function add(kind:GameKind){setPreview(null);onChange([...games,{id:crypto.randomUUID(),kind,title:'',prompt:'',items:['',''],matches:kind==='matching'?['','']:[],answer:0,explanation:''}]);}
 return <section className="space-y-4 rounded-2xl border border-[#d5e4dc] bg-[#f6f9f5] p-4 sm:p-5" aria-label="Configurar minigames">
  <div><h2 className="text-lg font-semibold text-[#173f36]">Pratique jogando</h2><p className="mt-2 text-sm leading-6 text-[#5c7167]">Vincule desafios ao conteúdo do vídeo ou da apresentação desta aula. São opcionais e não mudam as regras de conclusão nem duplicam Impulsos.</p></div>
  {games.map((g,i)=><div key={g.id} className="space-y-3 rounded-xl border border-[#d5e4dc] bg-white p-4">
   <div className="flex items-center justify-between gap-3"><h3 className="text-sm font-semibold">{i+1}. {GAME_LABELS[g.kind]}</h3><button type="button" onClick={()=>{onChange(games.filter((_,j)=>j!==i));setPreview(null);}} className="min-h-11 text-sm text-red-800">Remover desafio {i+1}</button></div>
   <label className="block text-sm">Título<input maxLength={120} value={g.title} onChange={e=>update(i,{title:e.target.value})} className={input}/></label>
   <label className="block text-sm">Instrução ou situação<textarea maxLength={1000} rows={3} value={g.prompt} onChange={e=>update(i,{prompt:e.target.value})} className={input}/></label>
   <label className="block text-sm">{g.kind==='sequence'?'Etapas na ordem correta, uma por linha':g.kind==='matching'?'Conceitos, um por linha':'Alternativas, uma por linha'}<textarea rows={4} value={g.items.join('\n')} onChange={e=>update(i,{items:e.target.value.split('\n')})} className={input}/><span className="mt-1 block text-xs text-[#5c7167]">De 2 a 8 itens diferentes, até 300 caracteres por item.</span></label>
   {g.kind==='matching'&&<label className="block text-sm">Correspondências na mesma ordem dos conceitos, uma por linha<textarea rows={4} value={g.matches.join('\n')} onChange={e=>update(i,{matches:e.target.value.split('\n')})} className={input}/></label>}
   {g.kind==='decision'&&<label className="block text-sm">Alternativa correta<select value={g.answer} onChange={e=>update(i,{answer:Number(e.target.value)})} className={input}>{g.items.map((item,j)=><option key={j} value={j}>{j+1}. {item||'Preencha a alternativa'}</option>)}</select></label>}
   <label className="block text-sm">Explicação do aprendizado<textarea maxLength={2000} rows={3} value={g.explanation} onChange={e=>update(i,{explanation:e.target.value})} className={input}/><span className="mt-1 block text-xs text-[#5c7167]">Explique por que essa relação, ordem ou decisão faz sentido. Aparece depois da tentativa.</span></label>
  </div>)}
  <div className="flex flex-wrap gap-3">{(Object.keys(GAME_LABELS) as GameKind[]).map(kind=><button key={kind} type="button" disabled={games.length>=6} onClick={()=>add(kind)} className="min-h-11 rounded-xl border border-[#c5d9cd] bg-white px-4 py-2 text-sm font-medium text-[#246554] disabled:opacity-50">Adicionar: {GAME_LABELS[kind]}</button>)}</div>
  {games.length>0&&<button type="button" onClick={()=>{try{const valid=parseGames(games);setPreviewSource(valid);setPreview(valid.map(publicGame));setError('');}catch(e){setError(e instanceof Error?e.message:'Revise os desafios.');setPreview(null);}}} className="min-h-11 text-sm font-semibold text-[#246554] underline">Pré-visualizar os jogos antes de salvar</button>}
  {error&&<p role="alert" className="text-sm text-red-800">{error}</p>}
  {preview&&<div className="border-t border-[#d5e4dc] pt-5"><p className="mb-4 text-xs text-[#5c7167]">Prévia local. Esta tentativa não salva progresso nem altera pontuação.</p><LearningGames key={JSON.stringify(preview)} lessonId="preview" games={preview} preview={(game,answers)=>{const source=previewSource.find(g=>g.id===game.id)!;return {correct:gradeGame(source,answers),explanation:source.explanation};}}/></div>}
 </section>;
}

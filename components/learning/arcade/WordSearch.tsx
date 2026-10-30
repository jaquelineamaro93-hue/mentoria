'use client';
import {useEffect,useRef,useState,type CSSProperties,type KeyboardEvent} from 'react';
import {Check,Pause,Play,RotateCcw,Search} from 'lucide-react';
import {buildWordBoard,cellLine,normalizeWord,readSelection,type Cell} from '@/lib/learning/arcade';
import type {PublicGame} from '@/lib/learning/games';
import styles from './Arcade.module.css';
export type GameFeedback={correct:boolean;explanation:string};
export type ArcadeProps={game:PublicGame;onFinish:(answers:string[])=>Promise<GameFeedback>};
export default function WordSearch({game,onFinish}:ArcadeProps){
 const [board,setBoard]=useState(()=>buildWordBoard(game.items));
 const [status,setStatus]=useState<'intro'|'playing'|'paused'|'won'|'timeup'>('intro');
 const [seconds,setSeconds]=useState(300),[found,setFound]=useState<string[]>([]),[marks,setMarks]=useState<string[]>([]),[selection,setSelection]=useState<Cell[]>([]),[notice,setNotice]=useState(''),[feedback,setFeedback]=useState<GameFeedback|null>(null),[checking,setChecking]=useState(false);
 const grid=useRef<HTMLDivElement>(null),anchor=useRef<Cell|null>(null),down=useRef<Cell|null>(null),dragged=useRef(false),foundRef=useRef<string[]>([]),finishing=useRef(false);
 useEffect(()=>{if(status!=='playing')return;const timer=window.setInterval(()=>setSeconds(s=>Math.max(0,s-1)),1000);return ()=>clearInterval(timer);},[status]);
 if(seconds===0&&status==='playing')setStatus('timeup');
 useEffect(()=>{const pause=()=>{if(document.hidden)setStatus(s=>s==='playing'?'paused':s);};document.addEventListener('visibilitychange',pause);return ()=>document.removeEventListener('visibilitychange',pause);},[]);
 function reset(){setBoard(buildWordBoard(game.items));setSeconds(300);setFound([]);foundRef.current=[];setMarks([]);setSelection([]);anchor.current=null;down.current=null;setNotice('');setFeedback(null);finishing.current=false;setStatus('playing');}
 async function finish(words:string[]){if(finishing.current)return;finishing.current=true;setChecking(true);try{setFeedback(await onFinish(game.items.filter(w=>words.includes(normalizeWord(w)))));}catch(e){finishing.current=false;setNotice(e instanceof Error?e.message:'Não foi possível conferir.');}finally{setChecking(false);}}
 function accept(start:Cell,end:Cell){
  const line=cellLine(start,end),selected=readSelection(board,line),reverse=[...selected].reverse().join('');
  const word=game.items.map(normalizeWord).find(w=>w===selected||w===reverse);
  anchor.current=null;setSelection([]);
  if(!word){setNotice('Essa sequência não está na lista. Procure outra conexão.');return;}
  if(foundRef.current.includes(word)){setNotice('Você já encontrou essa palavra.');return;}
  const next=[...foundRef.current,word];foundRef.current=next;setFound(next);setMarks(m=>[...new Set([...m,...line.map(c=>c.row+':'+c.col)])]);setNotice('Encontrou: '+game.items.find(w=>normalizeWord(w)===word));
  if(next.length===game.items.length){setStatus('won');void finish(next);}
 }
 function pointCell(x:number,y:number){const element=document.elementFromPoint(x,y)?.closest<HTMLElement>('[data-word-cell]');if(!element||!grid.current?.contains(element))return null;return {row:Number(element.dataset.row),col:Number(element.dataset.col)};}
 function keyboard(event:KeyboardEvent<HTMLButtonElement>,p:Cell){
  if(status!=='playing')return;
  const moves:Record<string,[number,number]>={ArrowUp:[-1,0],ArrowDown:[1,0],ArrowLeft:[0,-1],ArrowRight:[0,1]};
  if(moves[event.key]){event.preventDefault();const [r,c]=moves[event.key];grid.current?.querySelector<HTMLButtonElement>(`[data-row="${Math.max(0,Math.min(board.size-1,p.row+r))}"][data-col="${Math.max(0,Math.min(board.size-1,p.col+c))}"]`)?.focus();}
  if(event.key==='Enter'||event.key===' '){event.preventDefault();if(anchor.current)accept(anchor.current,p);else{anchor.current=p;setSelection([p]);}}
  if(event.key==='Escape'){anchor.current=null;setSelection([]);}
 }
 const time=Math.floor(seconds/60)+':'+String(seconds%60).padStart(2,'0');
 return <div className={styles.arcade}>
  <header className={styles.top}><span className={styles.brand}>SOMA Arcade · Caça-palavras</span><div className={styles.stats}><span>Tempo <strong>{time}</strong></span><span>Palavras <strong>{found.length}/{game.items.length}</strong></span><span>Pontos <strong>{found.length*100}</strong></span></div></header>
  <div className={styles.progress}><span style={{width:found.length/game.items.length*100+'%'}}/></div>
  {status==='intro'?<div className={styles.splash}><div className={styles.splashContent}><div className={styles.emblem}><Search size={48}/></div><h4 className={styles.title}>{game.title}</h4><p className={styles.prompt}>{game.prompt}</p><p className={styles.hint}>Encontre as palavras na horizontal, vertical ou diagonal. Arraste pelas letras ou toque no início e no fim da palavra.</p><div className={styles.buttons}><button className={styles.button} type="button" onClick={reset}><Play size={18}/>Jogar</button></div><p className={styles.hint}>5 minutos · Pode pausar e jogar novamente</p></div></div>:<div className={styles.body}>
   <h4 className={styles.title}>{game.title}</h4><p className={styles.prompt}>{game.prompt}</p>
   <div className={styles.boardArea}>
    <div style={{position:'relative'}}><div ref={grid} className={styles.grid} style={{'--size':board.size} as CSSProperties} aria-label="Tabuleiro de caça-palavras"
     onPointerMove={e=>{if(!down.current||status!=='playing')return;const p=pointCell(e.clientX,e.clientY);if(!p)return;if(p.row!==down.current.row||p.col!==down.current.col)dragged.current=true;setSelection(cellLine(down.current,p));}}
     onPointerUp={e=>{if(!down.current||status!=='playing')return;const p=pointCell(e.clientX,e.clientY)||down.current;const start=down.current;down.current=null;if(dragged.current)accept(start,p);else if(anchor.current)accept(anchor.current,p);else{anchor.current=p;setSelection([p]);}}}
     onPointerCancel={()=>{down.current=null;anchor.current=null;setSelection([]);}}>
     {board.grid.flatMap((row,r)=>row.map((letter,c)=><button key={r+':'+c} type="button" disabled={status!=='playing'} data-word-cell="true" data-row={r} data-col={c} data-selected={selection.some(p=>p.row===r&&p.col===c)} data-found={marks.includes(r+':'+c)} aria-label={`${letter}, linha ${r+1}, coluna ${c+1}`} onKeyDown={e=>keyboard(e,{row:r,col:c})} onPointerDown={e=>{if(status!=='playing')return;e.preventDefault();down.current={row:r,col:c};dragged.current=false;grid.current?.setPointerCapture(e.pointerId);setSelection([{row:r,col:c}]);}}>{letter}</button>))}
    </div>{status==='paused'&&<div className={styles.overlay}><div><h4 className={styles.title}>Partida pausada</h4><button type="button" className={styles.button} onClick={()=>setStatus('playing')}><Play size={18}/>Continuar</button></div></div>}</div>
    <ul className={styles.words} aria-label="Palavras para encontrar">{game.items.map(w=><li key={w} data-found={found.includes(normalizeWord(w))}>{found.includes(normalizeWord(w))&&<Check size={12} style={{display:'inline',marginRight:5}}/>}{w}</li>)}</ul>
   </div>
   <p className={styles.notice} role="status">{notice}</p>
   {(status==='won'||status==='timeup')&&<div className={styles.result}><h4>{status==='won'?'Você encontrou todas as palavras':'O tempo terminou'}</h4><p>{found.length} palavras encontradas · {found.length*100} pontos na partida</p>{checking?<p>Conferindo o aprendizado...</p>:feedback?<p>{feedback.explanation}</p>:status==='won'?<button type="button" className={styles.secondary} onClick={()=>void finish(found)}>Conferir aprendizado novamente</button>:<p>Você pode jogar outra vez e procurar os conceitos que faltaram.</p>}</div>}
   <div className={styles.buttons}>{status==='playing'&&<button type="button" className={styles.secondary} onClick={()=>setStatus('paused')}><Pause size={16}/>Pausar</button>}<button type="button" disabled={checking} className={styles.secondary} onClick={reset}><RotateCcw size={16}/>Jogar novamente</button></div>
   <p className={styles.keyboard}>Teclado: setas movem o foco; Enter marca o início e o fim; Esc cancela. Pontos desta partida não alteram seus Impulsos.</p>
  </div>}
 </div>;
}

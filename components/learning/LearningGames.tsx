'use client';
import {useRef,useState} from 'react';
import {ArrowDown,ArrowUp,CheckCircle2,Gamepad2,RotateCcw} from 'lucide-react';
import {GAME_LABELS,type PublicGame} from '@/lib/learning/games';
import styles from './LearningGames.module.css';
import WordSearch from './arcade/WordSearch';
import SliceGame from './arcade/SliceGame';
type Feedback={correct:boolean;explanation:string};
export default function LearningGames({lessonId,games,onReview,preview,onSolved}:{lessonId:string;games:PublicGame[];onReview?:()=>void;preview?:(game:PublicGame,answers:string[])=>Feedback;onSolved?:()=>void}){
 const [index,setIndex]=useState(0),[solved,setSolved]=useState<string[]>([]);
 if(!games.length)return null;
 const game=games[index];
 return <section className={styles.section} aria-label="Minigames da aula">
  <header className={styles.heading}><div><p className={styles.eyebrow}><Gamepad2 size={17}/> Aprender, testar, aplicar</p><h3>Escolha seu jogo</h3><p>Entre na partida e explore os conceitos desta aula.</p></div><span className={styles.badge}>{solved.length} de {games.length} desafios resolvidos</span></header>
  <div className={styles.tabs} role="group" aria-label="Escolher desafio">{games.map((g,i)=><button key={g.id} type="button" aria-pressed={i===index} onClick={()=>setIndex(i)}>{solved.includes(g.id)&&<CheckCircle2 size={16}/>}<span>{GAME_LABELS[g.kind]}<small>{g.title}</small></span></button>)}</div>
  <GamePlayer key={game.id} game={game} lessonId={lessonId} number={index+1} total={games.length} preview={preview} onReview={onReview} onCorrect={()=>{setSolved(s=>s.includes(game.id)?s:[...s,game.id]);onSolved?.();}}/>
  <p className={styles.note}>Os jogos são uma prática complementar. A conclusão da aula e os Impulsos continuam na atividade de aplicação, uma vez por aula.</p>
 </section>;
}
type PlayerProps={game:PublicGame;lessonId:string;number:number;total:number;onCorrect:()=>void;onReview?:()=>void;preview?:(game:PublicGame,answers:string[])=>Feedback};
function GamePlayer(props:PlayerProps){
 const {game,lessonId,preview,onCorrect}=props;
 async function finish(answers:string[]):Promise<Feedback>{
  let result:Feedback;
  if(preview)result=preview(game,answers);
  else{const response=await fetch('/api/aprender/jogo',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({lesson_id:lessonId,game_id:game.id,answers})});const body=await response.json();if(!response.ok)throw new Error(body.error||'Não foi possível conferir a partida.');result=body;}
  if(result.correct)onCorrect();return result;
 }
 if(game.kind==='wordsearch')return <WordSearch game={game} onFinish={finish}/>;
 if(game.kind==='slice')return <SliceGame game={game} onFinish={finish}/>;
 return <Challenge {...props}/>;
}

function Challenge({game,lessonId,number,total,onCorrect,onReview,preview}:{game:PublicGame;lessonId:string;number:number;total:number;onCorrect:()=>void;onReview?:()=>void;preview?:(game:PublicGame,answers:string[])=>Feedback}){
 const [answers,setAnswers]=useState<string[]>(game.kind==='sequence'?[...game.items]:Array(game.kind==='decision'?1:game.items.length).fill(''));
 const [feedback,setFeedback]=useState<Feedback|null>(null),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 const lock=useRef(false);
 function change(a:string[]){setAnswers(a);setFeedback(null);setError('');}
 function move(i:number,delta:number){const j=i+delta;if(j<0||j>=answers.length)return;const a=[...answers];[a[i],a[j]]=[a[j],a[i]];change(a);}
 async function check(){if(lock.current)return;lock.current=true;setBusy(true);setError('');try{
  let result:Feedback;
  if(preview)result=preview(game,answers);
  else {const r=await fetch('/api/aprender/jogo',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({lesson_id:lessonId,game_id:game.id,answers})});const b=await r.json();if(!r.ok)throw new Error(b.error||'Não foi possível conferir.');result=b;}
  setFeedback(result);if(result.correct)onCorrect();
 }catch(e){setError(e instanceof Error?e.message:'Não foi possível conferir. Tente novamente.');}finally{lock.current=false;setBusy(false);}}
 return <div className={styles.challenge}>
  <p className={styles.eyebrow}>Desafio {number} de {total}</p><h4>{game.title}</h4><p className={styles.prompt}>{game.prompt}</p>
  {game.kind==='sequence'&&<><p className={styles.hint}>Use as setas para organizar os passos. Funciona também por teclado e no celular.</p><ol className={styles.items}>{answers.map((item,i)=><li key={item}><span className={styles.number}>{i+1}</span><span className={styles.itemText}>{item}</span><div className={styles.arrows}><button type="button" disabled={busy||i===0} onClick={()=>move(i,-1)} aria-label={'Mover para cima: '+item}><ArrowUp size={17}/></button><button type="button" disabled={busy||i===answers.length-1} onClick={()=>move(i,1)} aria-label={'Mover para baixo: '+item}><ArrowDown size={17}/></button></div></li>)}</ol></>}
  {game.kind==='matching'&&<div className={styles.items}>{game.items.map((item,i)=><label key={item} className={styles.pair}><span>{item}</span><select disabled={busy} aria-label={'Correspondência de '+item} value={answers[i]} onChange={e=>change(answers.map((a,j)=>i===j?e.target.value:a))}><option value="">Selecione a conexão</option>{game.choices.map(c=><option key={c} value={c} disabled={answers.some((a,j)=>j!==i&&a===c)}>{c}</option>)}</select></label>)}</div>}
  {game.kind==='decision'&&<fieldset className={styles.options}><legend className="sr-only">Escolha sua decisão</legend>{game.items.map((item,i)=><label key={item} className={answers[0]===item?styles.selected:''}><input type="radio" name={'game-'+game.id} disabled={busy} checked={answers[0]===item} onChange={()=>change([item])}/><span className={styles.number}>{String.fromCharCode(65+i)}</span><span>{item}</span></label>)}</fieldset>}
  <div className={styles.actions}><button type="button" className={styles.primary} disabled={busy||answers.some(a=>!a)} onClick={()=>void check()}>{busy?'Conferindo...':'Conferir resposta'}</button><button type="button" disabled={busy} onClick={()=>{change(game.kind==='sequence'?[...game.items]:Array(game.kind==='decision'?1:game.items.length).fill(''));}}><RotateCcw size={16}/>Tentar novamente</button>{onReview&&<button type="button" onClick={onReview}>Rever a aula</button>}</div>
  {feedback&&<div role="status" className={feedback.correct?styles.success:styles.feedback}><strong>{feedback.correct?'Você conectou o aprendizado':'Vamos olhar mais uma vez'}</strong><p>{feedback.explanation}</p>{!feedback.correct&&<p>Reorganize sua resposta ou reveja o conteúdo e tente novamente.</p>}</div>}
  {error&&<p role="alert" className={styles.error}>{error}</p>}
 </div>;
}

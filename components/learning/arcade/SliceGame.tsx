'use client';
import {useEffect,useRef,useState} from 'react';
import {Crosshair,Heart,Pause,Play,RotateCcw,Volume2,VolumeX} from 'lucide-react';
import {segmentHitsCircle,type Point} from '@/lib/learning/arcade';
import type {ArcadeProps,GameFeedback} from './WordSearch';
import styles from './Arcade.module.css';
type Orb={id:number;x:number;y:number;vx:number;vy:number;radius:number;label:string;virus:boolean;spin:number;hit:boolean};
type Particle={x:number;y:number;vx:number;vy:number;life:number;color:string};
type Half={x:number;y:number;vx:number;vy:number;life:number;rotation:number;color:string;side:number};
type Engine={orbs:Orb[];particles:Particle[];halves:Half[];trail:(Point&{life:number})[];elapsed:number;spawn:number;serial:number;hits:number;combo:number;score:number;lives:number;seen:string[];pointer:Point;lastHit:number};
const WIDTH=720,HEIGHT=430,TARGET=12;
function initial():Engine{return {orbs:[],particles:[],halves:[],trail:[],elapsed:0,spawn:.5,serial:0,hits:0,combo:0,score:0,lives:3,seen:[],pointer:{x:WIDTH/2,y:HEIGHT/2},lastHit:-10};}
export default function SliceGame({game,onFinish}:ArcadeProps){
 const canvas=useRef<HTMLCanvasElement>(null),engine=useRef<Engine>(initial()),pointerDown=useRef(false),sound=useRef(false),audio=useRef<AudioContext|null>(null),running=useRef(false),finishLock=useRef(false);
 const [status,setStatus]=useState<'intro'|'playing'|'paused'|'won'|'lost'>('intro'),[calm,setCalm]=useState(false),[muted,setMuted]=useState(true),[hud,setHud]=useState({score:0,lives:3,hits:0,combo:0,seconds:90,seen:[] as string[]}),[feedback,setFeedback]=useState<GameFeedback|null>(null),[error,setError]=useState(''),[checking,setChecking]=useState(false);
 const seconds=calm?150:90;
 function beep(good:boolean){if(!sound.current)return;try{if(!audio.current)audio.current=new AudioContext();const context=audio.current;if(context.state==='suspended')void context.resume();const oscillator=context.createOscillator(),gain=context.createGain();oscillator.type='sine';oscillator.frequency.setValueAtTime(good?660:140,context.currentTime);oscillator.frequency.exponentialRampToValueAtTime(good?1100:70,context.currentTime+.12);gain.gain.setValueAtTime(.035,context.currentTime);gain.gain.exponentialRampToValueAtTime(.001,context.currentTime+.15);oscillator.connect(gain);gain.connect(context.destination);oscillator.start();oscillator.stop(context.currentTime+.16);}catch{/* Sound is optional. */}}
 async function finish(){if(finishLock.current)return;finishLock.current=true;setChecking(true);try{setFeedback(await onFinish(engine.current.seen));}catch(e){finishLock.current=false;setError(e instanceof Error?e.message:'Não foi possível conferir.');}finally{setChecking(false);}}
 function start(){engine.current=initial();finishLock.current=false;setFeedback(null);setError('');setHud({score:0,lives:3,hits:0,combo:0,seconds,seen:[]});setStatus('playing');}
 function stop(won:boolean){running.current=false;const s=engine.current;setHud({score:s.score,lives:Math.max(0,s.lives),hits:s.hits,combo:s.combo,seconds:Math.max(0,Math.ceil(seconds-s.elapsed)),seen:[...s.seen]});setStatus(won?'won':'lost');pointerDown.current=false;if(won)void finish();}
 function cut(a:Point,b:Point){
  if(!running.current)return;const state=engine.current;state.pointer=b;state.trail.push({...b,life:.2});
  for(const orb of state.orbs){if(orb.hit||!segmentHitsCircle(a,b,orb,orb.radius+6))continue;orb.hit=true;const color=orb.virus?'#f695ff':'#72f6ca';
   for(let side=0;side<2;side++)state.halves.push({x:orb.x,y:orb.y,vx:side===0?95:-95,vy:-55,life:.8,rotation:0,color,side});
   for(let i=0;i<16;i++){const angle=i/16*Math.PI*2,speed=60+Math.random()*160;state.particles.push({x:orb.x,y:orb.y,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,life:.65,color});}
   if(orb.virus){state.combo=state.elapsed-state.lastHit<1.6?state.combo+1:1;state.lastHit=state.elapsed;state.score+=100+Math.min(state.combo-1,5)*25;state.hits++;if(!state.seen.includes(orb.label))state.seen.push(orb.label);beep(true);}
   else{state.lives--;state.combo=0;state.score=Math.max(0,state.score-50);beep(false);}
  }
  if(state.lives<=0)stop(false);else if(state.hits>=TARGET&&state.seen.length===game.items.length)stop(true);
 }
 useEffect(()=>{running.current=status==='playing';if(status!=='playing')return;
  const element=canvas.current,context=element?.getContext('2d');if(!context||!element)return;
  const height=element.clientWidth<500?720:HEIGHT,mobile=height===720;element.height=height;
  let frame=0,last=performance.now(),ui=0;
  function draw(time:number){
   if(!running.current)return;
   const dt=Math.min((time-last)/1000,.04);last=time;const s=engine.current;s.elapsed+=dt;s.spawn-=dt;
   if(s.spawn<=0){
    const virus=s.serial%4!==3,index=(Math.floor(s.serial/4)*3+s.serial%4)%game.items.length;
    const label=virus?game.items[index]:game.choices[Math.floor(Math.random()*game.choices.length)];
    const x=100+Math.random()*(WIDTH-200),speed=calm?.67:1;
    s.orbs.push({id:s.serial++,x,y:height+60,vx:(WIDTH/2-x)*.2,vy:-(330+Math.random()*60)*speed*Math.sqrt(height/430),radius:mobile?48:34,label,virus,spin:Math.random()*6,hit:false});
    s.spawn=calm?1.9:1.1;
   }
   const gradient=context!.createLinearGradient(0,0,0,height);gradient.addColorStop(0,'#0d1237');gradient.addColorStop(1,'#213351');context!.fillStyle=gradient;context!.fillRect(0,0,WIDTH,height);
   for(let i=0;i<55;i++){const x=(i*157.7)%WIDTH,y=(i*91.3)%height;context!.fillStyle=`rgba(185,219,255,${.15+(i%4)*.08})`;context!.beginPath();context!.arc(x,y,(i%3)*.5+.6,0,Math.PI*2);context!.fill();}
   context!.strokeStyle='#6da4ff15';context!.lineWidth=1;for(let y=height-90;y<height;y+=20){context!.beginPath();context!.moveTo(0,y);context!.lineTo(WIDTH,y);context!.stroke();}
   for(const orb of s.orbs){orb.x+=orb.vx*dt;orb.y+=orb.vy*dt;orb.vy+=(calm?92:190)*dt;orb.spin+=dt*.8;
    if(orb.hit)continue;
    if(orb.y>height+90&&orb.vy>0){orb.hit=true;if(orb.virus){s.lives--;s.combo=0;}continue;}
    const color=orb.virus?'#ed8eff':'#7bf5cc';context!.save();context!.translate(orb.x,orb.y);context!.shadowBlur=calm?6:18;context!.shadowColor=color;
    if(orb.virus){context!.strokeStyle='#b970e9';context!.lineWidth=5;for(let i=0;i<10;i++){const angle=i/10*Math.PI*2+orb.spin;context!.beginPath();context!.moveTo(Math.cos(angle)*26,Math.sin(angle)*26);context!.lineTo(Math.cos(angle)*40,Math.sin(angle)*40);context!.stroke();context!.fillStyle='#efb1ff';context!.beginPath();context!.arc(Math.cos(angle)*40,Math.sin(angle)*40,4,0,Math.PI*2);context!.fill();}}
    const glow=context!.createRadialGradient(-10,-13,1,0,0,38);glow.addColorStop(0,orb.virus?'#ffc1ff':'#c2ffe2');glow.addColorStop(1,orb.virus?'#873aad':'#21876d');context!.fillStyle=glow;context!.beginPath();context!.arc(0,0,orb.radius,0,Math.PI*2);context!.fill();context!.shadowBlur=0;
    context!.fillStyle=orb.virus?'#4e2266':'#144b42';context!.beginPath();context!.arc(-10,-5,4,0,Math.PI*2);context!.arc(10,-5,4,0,Math.PI*2);context!.fill();context!.strokeStyle=orb.virus?'#4e2266':'#144b42';context!.lineWidth=2;context!.beginPath();context!.arc(0,10,10,orb.virus?Math.PI:0,orb.virus?Math.PI*2:Math.PI);context!.stroke();context!.restore();
    context!.font=mobile?'600 23px Arial':'600 14px Arial';context!.textAlign='center';const width=Math.min(mobile?360:220,context!.measureText(orb.label).width+18);context!.fillStyle='#0a1027ed';context!.fillRect(orb.x-width/2,orb.y+(mobile?58:44),width,mobile?34:25);context!.fillStyle='#edf6ff';context!.fillText(orb.label,orb.x,orb.y+(mobile?83:61),mobile?350:210);
   }
   for(const h of s.halves){h.x+=h.vx*dt;h.y+=h.vy*dt;h.vy+=220*dt;h.rotation+=dt*(h.side===0?3:-3);h.life-=dt;context!.save();context!.globalAlpha=Math.max(0,h.life/.8);context!.translate(h.x,h.y);context!.rotate(h.rotation);context!.fillStyle=h.color;context!.beginPath();context!.arc(0,0,31,h.side===0?-Math.PI/2:Math.PI/2,h.side===0?Math.PI/2:Math.PI*1.5);context!.closePath();context!.fill();context!.restore();}s.halves=s.halves.filter(h=>h.life>0);
   for(const p of s.particles){p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=140*dt;p.life-=dt;context!.globalAlpha=Math.max(0,p.life/.65);context!.fillStyle=p.color;context!.beginPath();context!.arc(p.x,p.y,4,0,Math.PI*2);context!.fill();}context!.globalAlpha=1;
   s.particles=s.particles.filter(p=>p.life>0);s.orbs=s.orbs.filter(o=>!o.hit);
   s.trail.forEach(p=>p.life-=dt);s.trail=s.trail.filter(p=>p.life>0);
   if(s.trail.length>1){context!.strokeStyle='#b8ffed';context!.lineWidth=5;context!.lineCap='round';context!.shadowBlur=12;context!.shadowColor='#7bf5cc';context!.beginPath();s.trail.forEach((p,i)=>i?context!.lineTo(p.x,p.y):context!.moveTo(p.x,p.y));context!.stroke();context!.shadowBlur=0;}
   context!.strokeStyle='#d0fff188';context!.lineWidth=1;context!.beginPath();context!.arc(s.pointer.x,s.pointer.y,12,0,Math.PI*2);context!.moveTo(s.pointer.x-18,s.pointer.y);context!.lineTo(s.pointer.x+18,s.pointer.y);context!.moveTo(s.pointer.x,s.pointer.y-18);context!.lineTo(s.pointer.x,s.pointer.y+18);context!.stroke();
   if(time-ui>100){setHud({score:s.score,lives:Math.max(0,s.lives),hits:s.hits,combo:s.combo,seconds:Math.max(0,Math.ceil(seconds-s.elapsed)),seen:[...s.seen]});ui=time;}
   if(s.lives<=0||s.elapsed>=seconds){stop(false);return;}
   frame=requestAnimationFrame(draw);
  }
  frame=requestAnimationFrame(draw);return ()=>{running.current=false;cancelAnimationFrame(frame);};
 // The engine is restarted only on a game-state transition. Content is immutable within a keyed game.
 // eslint-disable-next-line react-hooks/exhaustive-deps
 },[status,calm,seconds]);
 useEffect(()=>{const pause=()=>{if(document.hidden){pointerDown.current=false;setStatus(s=>s==='playing'?'paused':s);}};document.addEventListener('visibilitychange',pause);return ()=>{document.removeEventListener('visibilitychange',pause);void audio.current?.close();};},[]);
 function position(clientX:number,clientY:number):Point{const rect=canvas.current!.getBoundingClientRect();return {x:(clientX-rect.left)/rect.width*WIDTH,y:(clientY-rect.top)/rect.height*canvas.current!.height};}
 return <div className={styles.arcade}>
  <header className={styles.top}><span className={styles.brand}>SOMA Arcade · Corte os vírus</span><div className={styles.stats}><span>Pontos <strong>{hud.score}</strong></span><span>Combo <strong>×{hud.combo}</strong></span><span style={{display:'flex',gap:3}} aria-label={hud.lives+' vidas'}>{[0,1,2].map(i=><Heart key={i} size={17} fill={i<hud.lives?'#ff99bd':'none'} color={i<hud.lives?'#ff99bd':'#567080'}/>)}</span><span><strong>{hud.seconds}s</strong></span></div></header>
  {status==='intro'?<div className={styles.splash}><div className={styles.splashContent}><div className={styles.emblem}><Crosshair size={52}/></div><h4 className={styles.title}>{game.title}</h4><p className={styles.prompt}>{game.prompt}</p><p className={styles.hint}>Arraste o dedo ou o mouse para cortar os vírus roxos. Proteja os aliados verdes. Corte {TARGET} vírus e encontre todos os tipos para vencer.</p><label className={styles.calm}><input type="checkbox" checked={calm} onChange={e=>setCalm(e.target.checked)}/>Ritmo tranquilo: mais tempo e movimentos mais lentos</label><div className={styles.buttons}><button type="button" className={styles.button} onClick={start}><Play size={18}/>Jogar</button></div><p className={styles.hint}>3 vidas · {calm?150:90} segundos · Som opcional</p></div></div>:<div className={styles.body}>
   <h4 className={styles.title}>{game.title}</h4><p className={styles.prompt}>{game.prompt}</p><p className={styles.hint}>Corte {Math.min(hud.hits,TARGET)}/{TARGET} vírus · Evite os aliados verdes</p><div className={styles.goalList}>{game.items.map(t=><span key={t} data-found={hud.seen.includes(t)}>{t}</span>)}</div>
   <div className={styles.arena}><canvas ref={canvas} width={WIDTH} height={HEIGHT} tabIndex={0} role="application" aria-label="Jogo de cortar vírus. Arraste para cortar. Teclado: setas movem a mira, espaço corta, P pausa."
    onPointerDown={e=>{if(status!=='playing')return;e.preventDefault();canvas.current?.focus();canvas.current?.setPointerCapture(e.pointerId);pointerDown.current=true;const p=position(e.clientX,e.clientY);cut(p,p);}}
    onPointerMove={e=>{if(!pointerDown.current||status!=='playing')return;e.preventDefault();cut(engine.current.pointer,position(e.clientX,e.clientY));}}
    onPointerUp={()=>{pointerDown.current=false;}} onPointerCancel={()=>{pointerDown.current=false;}}
    onKeyDown={e=>{if(e.key.toLowerCase()==='p'){e.preventDefault();setStatus(s=>s==='playing'?'paused':s==='paused'?'playing':s);return;}if(status!=='playing')return;const moves:Record<string,Point>={ArrowUp:{x:0,y:-30},ArrowDown:{x:0,y:30},ArrowLeft:{x:-30,y:0},ArrowRight:{x:30,y:0}};const s=engine.current;if(moves[e.key]){e.preventDefault();s.pointer={x:Math.max(0,Math.min(WIDTH,s.pointer.x+moves[e.key].x)),y:Math.max(0,Math.min(canvas.current?.height||HEIGHT,s.pointer.y+moves[e.key].y))};}if(e.key===' '){e.preventDefault();cut({x:s.pointer.x-45,y:s.pointer.y},{x:s.pointer.x+45,y:s.pointer.y});}}}/>
    {status!=='playing'&&<div className={styles.overlay}><div><h4 className={styles.title}>{status==='paused'?'Partida pausada':status==='won'?'Missão cumprida':'Vamos jogar de novo?'}</h4><p className={styles.prompt}>{status==='paused'?'Respire. A partida continua de onde parou.':`${hud.score} pontos · ${hud.hits} vírus cortados`}</p><div className={styles.buttons}>{status==='paused'?<button type="button" className={styles.button} onClick={()=>setStatus('playing')}><Play size={18}/>Continuar</button>:<button type="button" className={styles.button} disabled={checking} onClick={start}><RotateCcw size={18}/>Jogar novamente</button>}</div></div></div>}
   </div>
   {feedback&&<div className={styles.result} role="status"><h4>Da partida para sua jornada</h4><p>{feedback.explanation}</p></div>}{checking&&<p className={styles.notice} role="status">Conferindo o aprendizado...</p>}{error&&<p role="alert" className={styles.notice}>{error}<button type="button" className={styles.secondary} onClick={()=>void finish()}>Tentar conferir novamente</button></p>}
   <div className={styles.buttons}>{status==='playing'&&<button type="button" className={styles.secondary} onClick={()=>{pointerDown.current=false;setStatus('paused');}}><Pause size={17}/>Pausar</button>}<button type="button" className={styles.secondary} aria-pressed={!muted} onClick={()=>{sound.current=!sound.current;setMuted(!sound.current);if(sound.current)beep(true);}}>{muted?<VolumeX size={17}/>:<Volume2 size={17}/>}Som {muted?'desligado':'ligado'}</button></div>
   <p className={styles.keyboard}>Teclado: setas movem a mira, espaço corta, P pausa. Os pontos são da partida e não alteram seus Impulsos.</p>
  </div>}
 </div>;
}

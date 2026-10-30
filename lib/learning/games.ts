import {normalizeWord} from './arcade.ts';
export type GameKind = 'matching' | 'sequence' | 'decision' | 'wordsearch' | 'slice';
export type LearningGame = { id:string; kind:GameKind; title:string; prompt:string; items:string[]; matches:string[]; answer:number; explanation:string };
export type PublicGame = Pick<LearningGame,'id'|'kind'|'title'|'prompt'|'items'> & {choices:string[]};
export const GAME_LABELS:Record<GameKind,string> = {matching:'Conecte os conceitos',sequence:'Monte a sequência',decision:'Decida na prática',wordsearch:'Caça-palavras',slice:'Corte os vírus'};
function text(v:unknown,max:number){if(typeof v!=='string'||!v.trim()||v.length>max)throw new Error('Preencha os textos do minigame dentro do limite indicado.');return v.trim();}
function list(v:unknown){if(!Array.isArray(v)||v.length<2||v.length>8)throw new Error('Use de 2 a 8 itens por minigame.');const a=v.map(x=>text(x,300));if(new Set(a).size!==a.length)throw new Error('Os itens do minigame precisam ser diferentes.');return a;}
export function parseGames(value:unknown):LearningGame[]{
 if(value===undefined||value===null)return [];
 if(!Array.isArray(value)||value.length>6)throw new Error('Use até 6 minigames por aula.');
 const games=value.map((v:unknown)=>{
  if(!v||typeof v!=='object')throw new Error('Minigame inválido.');
  const g=v as Record<string,unknown>;
  if(!['matching','sequence','decision','wordsearch','slice'].includes(String(g.kind)))throw new Error('Escolha um formato de minigame válido.');
  const kind=g.kind as GameKind,items=list(g.items),matches=(kind==='matching'||kind==='slice')?list(g.matches):[];
  if(kind==='matching'&&matches.length!==items.length)throw new Error('Cada conceito precisa de uma correspondência.');
  if(kind==='wordsearch'){const words=items.map(normalizeWord);if(words.some(w=>w.length<3||w.length>16)||new Set(words).size!==words.length)throw new Error('Caça-palavras: use palavras diferentes com 3 a 16 letras.');}
  if(kind==='slice'&&([...items,...matches].some(x=>x.length>24)||matches.some(x=>items.includes(x))))throw new Error('Use termos de até 24 caracteres, sem repetir vírus e itens protegidos.');
  const answer=kind==='decision'?g.answer:0;
  if(!Number.isInteger(answer)||Number(answer)<0||Number(answer)>=items.length)throw new Error('Selecione a resposta correta.');
  const id=text(g.id,80);if(!/^[\w-]+$/.test(id))throw new Error('Identificador do minigame inválido.');
  return {id,kind,title:text(g.title,120),prompt:text(g.prompt,1000),items,matches,answer:Number(answer),explanation:text(g.explanation,2000)};
 });
 if(new Set(games.map(g=>g.id)).size!==games.length)throw new Error('Os minigames precisam de identificadores diferentes.');
 return games;
}
export function shuffled<T>(values:T[],random= Math.random):T[]{const a=[...values];for(let i=a.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
export function publicGame(g:LearningGame):PublicGame{
 let items=g.kind==='sequence'?shuffled(g.items):[...g.items];
 // Do not start a sequence already solved, including the rare identity shuffle.
 if(g.kind==='sequence'&&items.every((x,i)=>x===g.items[i]))items=[...items.slice(1),items[0]];
 return {id:g.id,kind:g.kind,title:g.title,prompt:g.prompt,items,choices:(g.kind==='matching'||g.kind==='slice')?shuffled(g.matches):[]};
}
export function gradeGame(g:LearningGame,submission:unknown):boolean{
 if(!Array.isArray(submission)||!submission.every(x=>typeof x==='string'&&x.length<=300))throw new Error('Resposta inválida.');
 if(g.kind==='decision'){if(submission.length!==1||!g.items.includes(submission[0]))throw new Error('Selecione uma alternativa.');return submission[0]===g.items[g.answer];}
 const expected=g.kind==='matching'?g.matches:g.items;
 if(submission.length!==expected.length||new Set(submission).size!==expected.length||submission.some(x=>!expected.includes(x)))throw new Error('Preencha todos os itens sem repetir opções.');
 if(g.kind==='wordsearch'||g.kind==='slice')return true;
 return expected.every((x,i)=>x===submission[i]);
}

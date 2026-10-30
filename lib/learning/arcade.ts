export type Cell = {row:number;col:number};
export type WordPlacement = {word:string;cells:Cell[]};
export type WordBoard = {size:number;grid:string[][];placements:WordPlacement[]};
export const normalizeWord=(s:string)=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z]/g,'').toUpperCase();
const directions=[[0,1],[1,0],[1,1],[-1,1],[0,-1],[-1,0],[-1,-1],[1,-1]];
export function buildWordBoard(words:string[],random=Math.random):WordBoard{
 const normalized=words.map(normalizeWord);
 if(normalized.length<2||normalized.length>8||normalized.some(w=>w.length<3||w.length>16)||new Set(normalized).size!==normalized.length)throw new Error('Use de 2 a 8 palavras diferentes, com 3 a 16 letras.');
 const size=Math.max(10,...normalized.map(w=>w.length+1));
 for(let attempt=0;attempt<30;attempt++){
  const grid=Array.from({length:size},()=>Array<string>(size).fill(''));
  const placements:WordPlacement[]=[];
  for(const word of [...normalized].sort((a,b)=>b.length-a.length)){
   let placed=false;
   for(let trial=0;trial<800;trial++){
    const [dr,dc]=directions[Math.floor(random()*directions.length)],row=Math.floor(random()*size),col=Math.floor(random()*size);
    const cells=Array.from(word,(_,i)=>({row:row+i*dr,col:col+i*dc}));
    if(cells.some((p,i)=>p.row<0||p.row>=size||p.col<0||p.col>=size||(grid[p.row][p.col]&&grid[p.row][p.col]!==word[i])))continue;
    cells.forEach((p,i)=>{grid[p.row][p.col]=word[i];});placements.push({word,cells});placed=true;break;
   }
   if(!placed)break;
  }
  if(placements.length!==words.length)continue;
  grid.forEach(row=>row.forEach((v,i)=>{if(!v)row[i]='ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(random()*26)];}));
  return {size,grid,placements};
 }
 // Guaranteed horizontal fallback prevents a bad RNG from hanging an activity.
 const grid=Array.from({length:size},()=>Array.from({length:size},()=>String.fromCharCode(65+Math.floor(random()*26))));
 const placements=normalized.map((word,row)=>{const cells=Array.from(word,(_,col)=>({row,col}));cells.forEach((p,i)=>grid[p.row][p.col]=word[i]);return {word,cells};});
 return {size,grid,placements};
}
export function cellLine(start:Cell,end:Cell):Cell[]{
 const dy=end.row-start.row,dx=end.col-start.col;
 if(dx!==0&&dy!==0&&Math.abs(dx)!==Math.abs(dy))return [];
 const length=Math.max(Math.abs(dx),Math.abs(dy));
 return Array.from({length:length+1},(_,i)=>({row:start.row+Math.sign(dy)*i,col:start.col+Math.sign(dx)*i}));
}
export function readSelection(board:WordBoard,cells:Cell[]):string{return cells.map(p=>board.grid[p.row]?.[p.col]||'').join('');}
export type Point={x:number;y:number};
export function segmentHitsCircle(a:Point,b:Point,c:Point,radius:number):boolean{
 const dx=b.x-a.x,dy=b.y-a.y,length=dx*dx+dy*dy;
 const t=length?Math.max(0,Math.min(1,((c.x-a.x)*dx+(c.y-a.y)*dy)/length)):0;
 return Math.hypot(c.x-a.x-t*dx,c.y-a.y-t*dy)<=radius;
}

import test from 'node:test';
import assert from 'node:assert/strict';
import {buildWordBoard,normalizeWord,cellLine,readSelection,segmentHitsCircle} from '../lib/learning/arcade.ts';
import {parseGames,gradeGame,publicGame} from '../lib/learning/games.ts';
function rng(seed){return ()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};}
test('every generated board contains every word on a valid straight path across many seeds',()=>{
 for(let seed=0;seed<100;seed++){
  const words=['Contribuição','OBJETIVO','REVISÃO','CONTEXTO','EVIDÊNCIA','AÇÃO'];const board=buildWordBoard(words,rng(seed));
  assert.equal(board.placements.length,words.length);assert.equal(board.grid.length,board.size);
  for(const p of board.placements){assert.equal(readSelection(board,p.cells),p.word);assert.deepEqual(cellLine(p.cells[0],p.cells.at(-1)),p.cells);assert.ok(p.cells.every(c=>c.row>=0&&c.col>=0&&c.row<board.size&&c.col<board.size));}
 }
});
test('degenerate random sources terminate with a valid fallback and invalid words fail early',()=>{
 const board=buildWordBoard(['CARREIRA','FUTURO','ACAO','META'],()=>0);assert.equal(board.placements.length,4);
 for(const words of [['A','B'],['AÇÃO','ACAO'],['123','ABC'],['ABCDEFGHIJKLMNOPQ','ABC']])assert.throws(()=>buildWordBoard(words));
 assert.equal(normalizeWord('Contribuição'),'CONTRIBUICAO');assert.deepEqual(cellLine({row:0,col:0},{row:1,col:2}),[]);
});
test('blade collision checks the entire movement segment, including taps and fast swipes',()=>{
 assert.equal(segmentHitsCircle({x:0,y:0},{x:100,y:0},{x:50,y:10},11),true);
 assert.equal(segmentHitsCircle({x:0,y:0},{x:100,y:0},{x:50,y:20},10),false);
 assert.equal(segmentHitsCircle({x:50,y:50},{x:50,y:50},{x:50,y:50},10),true);
 assert.equal(segmentHitsCircle({x:0,y:0},{x:10,y:0},{x:30,y:0},5),false);
});
const base={id:'arcade',kind:'wordsearch',title:'Palavras da aula',prompt:'Encontre os conceitos',items:['OBJETIVO','ACAO'],matches:[],answer:0,explanation:'Conecte o objetivo à ação.'};
test('arcade content accepts only playable words and distinct bounded virus/ally labels',()=>{
 assert.equal(parseGames([base])[0].kind,'wordsearch');
 for(const items of [['AB','META'],['AÇÃO','ACAO'],['123','ACAO']])assert.throws(()=>parseGames([{...base,items}]));
 const slice={...base,kind:'slice',matches:['PRAZO','REVISAO']};assert.equal(parseGames([slice])[0].kind,'slice');
 assert.throws(()=>parseGames([{...slice,matches:['OBJETIVO','META']}]));assert.throws(()=>parseGames([{...slice,items:['A'.repeat(25),'B']} ]));
 assert.deepEqual(publicGame(slice).choices.sort(),slice.matches.sort());
});
test('arcade victory validates all known concepts once, without treating discovery order as a solution',()=>{
 for(const kind of ['wordsearch','slice']){const game={...base,kind};assert.equal(gradeGame(game,[...game.items].reverse()),true);assert.throws(()=>gradeGame(game,['FAKE','ACAO']));assert.throws(()=>gradeGame(game,['ACAO','ACAO']));assert.throws(()=>gradeGame(game,['ACAO']));}
});

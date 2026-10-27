import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';
const read = path => readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('Home reproduz os seis blocos do HTML aprovado na ordem correta', () => {
 const home=read('app/(public)/page.tsx');
 const order=['Clareza vira','<SomaBrandTicker />','Quem faz a SOMA','soma-home-colagem-2026.webp','O próximo capítulo','É o momento de'];
 let last=-1; for(const item of order){const n=home.indexOf(item);assert.ok(n>last, 'Bloco fora de ordem: '+item);last=n}
 assert.match(home,/Nathalia Ferlin/);
 assert.match(home,/quoteCards\.map/);
 assert.doesNotMatch(home,/<SomaNetworking\s*\/>|<SomaSuccessStories\s*\/>/);
 assert.doesNotMatch(home,/A mesma carreira pede|Ainda ficou alguma dúvida\?/);
 assert.match(home,/href="\/planos"/);
});
test('Três relatos da Home têm origem verificável e não prometem contratação',()=>{
 const home=read('app/(public)/page.tsx');
 for(const name of ['Henrique Silva','Paulo Cézar Silveira','Jéssica Carolina','Nathalia Ferlin'])assert.ok(home.includes(name),name);
 assert.equal((home.match(/tag: '/g)||[]).length,3);
 assert.doesNotMatch(home, /⭐⭐⭐⭐⭐|99%|empresas parceiras|vagas garantidas/);
 const source=read('components/public/SomaSuccessStories.tsx');
 for(const name of ['Nathalia Ferlin','Henrique Silva','Paulo Cézar Silveira','Erick Almeida','Geraldo Macinelli','Jaque Ferreira'])assert.ok(source.includes(name),name);
 assert.match(source,/Resultados individuais não representam promessa de aprovação ou contratação/);
});
test('Depoimentos completos e fontes originais permanecem acessíveis',()=>{
 const home=read('app/(public)/page.tsx');
 const full=read('app/(public)/depoimentos/page.tsx');
 const ui=read('components/public/SomaSuccessStories.tsx');
 assert.match(home,/href="\/depoimentos"/);
 assert.match(full,/Depoimentos com links para os posts originais/);
 for(const name of ['Maria Laura Soares','Giulia Gomes','Rita Alecrim'])assert.ok(full.includes(name));
 for(const href of ['https://lnkd.in/p/esE9t5fr','https://lnkd.in/p/eetWmSiv','https://lnkd.in/p/euSGD_V9'])assert.ok(full.includes(href));
 assert.match(ui,/snap-x snap-mandatory/);
 assert.match(ui,/aria-label="Ver próximos depoimentos"/);
 assert.match(ui,/prefers-reduced-motion/);
});
test('Header compartilhado oferece navegação desktop e mobile',()=>{
 const home=read('app/(public)/page.tsx');
 const nav=read('components/public/SomaMarketingChrome.tsx');
 const rede=read('components/public/SomaNetworking.tsx');
 assert.match(home, /<SomaSiteHeader active="\/"\s*\/>/);
 assert.match(nav,/aria-label="Navegação principal"/);
 assert.match(nav,/aria-label="Navegação móvel"/);
 for(const path of ['/portal','/rede-soma','/planos','/como-funciona','/depoimentos','/cases'])assert.ok(nav.includes("href: '"+path+"'"));
 assert.match(rede,/id="rede-soma"/);
 assert.match(home, /<SomaBrandTicker\s*\/>/);
});

test('A fotografia de colagem original está no repositório e mantém gradiente e enquadramento',()=>{
 const home=read('app/(public)/page.tsx');
 const image=statSync(new URL('../public/soma-home-colagem-2026.webp',import.meta.url));
 assert.ok(image.size>=500000);
 assert.match(home,/src="\/soma-home-colagem-2026\.webp"/);
 assert.match(home,/bg-gradient-to-t/);
 assert.match(home,/object-contain/);
});

test('Novo hero e colagem íntegra coexistem com o gradiente legível', () => {
 const home=read('app/(public)/page.tsx');
 const network=read('components/public/SomaNetworking.tsx');
 const assets=readFileSync(new URL('../public/soma-network-collage.webp',import.meta.url));
 const original=readFileSync(new URL('../public/soma-home-colagem-2026.webp',import.meta.url));
 const cards=read('components/public/SomaHeroJourney.tsx');
 assert.deepEqual(assets,original);
 assert.match(home, /<SomaHeroJourney\s*\/>/);
 assert.match(home, /bg-gradient-to-t/);
 assert.ok(network.indexOf('EMPRESAS.map(empresa') < network.indexOf('{showCollage &&'), '22 logos devem vir antes da colagem');
 for (const x of ['Mapa Quem Sou Eu','SEU PDI','PRÓXIMO ENCONTRO']) assert.ok(cards.includes(x));
});

test('LP Home utiliza retrato mais recente de Jaqueline com corte circular do Canva',()=>{
 const home=read('app/(public)/page.tsx');
 const portrait=statSync(new URL('../public/images/jaqueline-amaro-home-20261027.webp',import.meta.url));
 assert.ok(portrait.size>300000,'Imagem original em boa resolução');
 assert.match(home,/src="\/images\/jaqueline-amaro-home-20261027\.webp"/);
 assert.match(home,/rounded-full object-cover object-\[center_20%\]/);
 assert.doesNotMatch(home,/src="\/images\/jaqueline-amaro-2026\.webp"/);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read = path => readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('Rede SOMA exibe as 22 empresas antes da foto e só uma colagem',()=>{
 const code=read('components/public/SomaNetworking.tsx');
 assert.ok(code.indexOf('EMPRESAS.map(empresa')<code.indexOf('{showCollage &&'));
 assert.equal(code.split('soma-home-colagem-2026.webp').length-1,1);
 assert.match(read('app/(public)/rede-soma/page.tsx'),/<SomaNetworking showCollage\s*\/>/);
});
test('Legacy e nova imagem usam mesma fotografia integral para impedir o buraco branco',()=>{
 const a=readFileSync(new URL('../public/soma-network-collage.webp',import.meta.url));
 const b=readFileSync(new URL('../public/soma-home-colagem-2026.webp',import.meta.url));
 assert.ok(a.length>500000,'Imagem original completa, sem miniatura');
 assert.deepEqual(a,b,'Legacy não deve continuar com a montagem antiga');
 const home=read('app/(public)/page.tsx');
 assert.match(home,/bg-gradient-to-t/);
 assert.match(home,/object-contain/);
});
test('O hero reúne cartões de percurso sem dados pessoais',()=>{
 const home=read('app/(public)/page.tsx');
 const cards=read('components/public/SomaHeroJourney.tsx');
 assert.match(home,/<SomaHeroJourney\s*\/>/);
 for(const label of ['Mapa Quem Sou Eu','SEU PDI','PRÓXIMO ENCONTRO','Histórias reais de carreira']) assert.ok(cards.includes(label),label);
 assert.match(cards,/aria-hidden="true"/);
});
test('Planos corrigem os textos escuros sobre fundo escuro, sem alterar preço',()=>{
 const plans=read('app/(public)/planos/page.tsx');
 const saas=read('components/public/SomaSaasShowcase.tsx');
 const career=read('components/public/SomaCarreiraOptions.tsx');
 assert.doesNotMatch(saas,/text-\[#1d4538\]/);
 assert.match(plans,/bg-\[#B8E2CE\].*text-\[#10221c\]/);
 assert.match(saas,/calcularPrecoSaas\(plano, \{ iris, whatsapp \}\)/);
 assert.match(career,/calcularAdicionalCarreira\(duracao, encontros\)/);
 assert.match(plans,/href=\{\`\/checkout\?plan=\$\{plano.id\}\`\}/);
});

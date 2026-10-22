import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');

test('Depoimentos aparecem de forma destacada na home publica', () => {
  const home = source('app/(public)/page.tsx');
  const ui = source('components/public/SomaSuccessStories.tsx');
  assert.match(home, /import SomaSuccessStories from/);
  assert.match(home, /<SomaSuccessStories \/>/);
  assert.match(ui, /id="historias-reais"/);
  assert.match(ui, /Histórias recebidas, resultados reais/);
  assert.match(ui, /font-display/);
  assert.match(ui, /bg-\[#111b19\]/);
});

test('Carrossel responsivo e com recursos basicos de acessibilidade', () => {
  const ui = source('components/public/SomaSuccessStories.tsx');
  assert.match(ui, /'use client'/);
  assert.match(ui, /snap-x snap-mandatory/);
  assert.match(ui, /overflow-x-auto/);
  assert.match(ui, /sm:w-\[calc/);
  assert.match(ui, /lg:w-\[calc/);
  assert.match(ui, /aria-label="Ver próximos depoimentos"/);
  assert.match(ui, /aria-label="Ver depoimentos anteriores"/);
  assert.match(ui, /disabled=\{!canGoForward\}/);
  assert.match(ui, /disabled=\{!canGoBack\}/);
  assert.match(ui, /prefers-reduced-motion/);
  assert.match(ui, /onScroll=\{syncActive\}/);
});

test('Autores autorizados aparecem sem números, telefones ou conversas privadas', () => {
  const ui = source('components/public/SomaSuccessStories.tsx');
  for (const pessoa of ['Nathalia Ferlin', 'Henrique Silva', 'Paulo Cézar Silveira', 'Erick Almeida', 'Geraldo Macinelli', 'Jaque Ferreira']) {
    assert.ok(ui.includes(pessoa), 'Nome ausente: ' + pessoa);
  }
  assert.doesNotMatch(ui, /wa\.me|whatsapp\.com|<img|next\/image|\\.jpeg|\\.jpg|\\.png/i);
  assert.doesNotMatch(ui, /\+55\s?\d{2}|\b\d{11}\b|@gmail\.com/i);
  assert.match(ui, /historia.nome/);
  assert.match(ui, /historia.iniciais/);
  assert.match(ui, /historia.origem/);
  assert.match(ui, /Depoimentos reais compartilhados com autorização/);
  assert.match(ui, /Resultados individuais não representam promessa de aprovação ou contratação/);
  assert.doesNotMatch(ui, /⭐⭐⭐⭐⭐|99%|empresas parceiras/i);
});

test('Depoimentos nao fazem todos os relatos parecerem contratacoes pela plataforma', () => {
  const ui = source('components/public/SomaSuccessStories.tsx');
  assert.match(ui, /orientações em comunidades/);
  assert.match(ui, /Evolução em entrevistas/);
  assert.match(ui, /Novo contrato profissional/);
  assert.match(ui, /LinkedIn e currículo/);
  assert.match(ui, /Aprovação na Gupy/);
  const cards = (ui.match(/\scategoria:/g) || []).length;
  const autores = (ui.match(/\snome:/g) || []).length;
  assert.equal(cards, autores);
  assert.ok(cards >= 10 && cards <= 20, 'Quantidade de relatos inesperada: ' + cards);
});

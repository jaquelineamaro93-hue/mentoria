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

test('Relatos anonimizados: sem prints, numeros e nomes dos contatos privados', () => {
  const ui = source('components/public/SomaSuccessStories.tsx');
  assert.doesNotMatch(ui, /wa\.me|whatsapp\.com|<img|next\/image|\\.jpeg|\\.jpg|\\.png/i);
  assert.doesNotMatch(ui, /\b(?:Jaqueline Amaro|Henrique Silva|Nathalia Ferlin|Erick Almeida|Geraldo Macinelli|Jaque Ferreira)\b/i);
  assert.doesNotMatch(ui, /\+55\s?\d{2}|\b\d{11}\b/);
  assert.match(ui, /Nome preservado por privacidade/);
  assert.match(ui, /sem promessa de aprovação ou contratação/);
  assert.doesNotMatch(ui, /⭐⭐⭐⭐⭐|99%|100%|empresas parceiras/i);
});

test('Depoimentos nao fazem todos os relatos parecerem contratacoes pela plataforma', () => {
  const ui = source('components/public/SomaSuccessStories.tsx');
  assert.match(ui, /mentorias e comunidades/);
  assert.match(ui, /Relato de evolução em entrevistas/);
  assert.match(ui, /Relato de oportunidade profissional/);
  assert.match(ui, /LinkedIn e currículo/);
  assert.match(ui, /Currículo e Gupy/);
  const cards = (ui.match(/\scategoria:/g) || []).length;
  assert.ok(cards >= 10 && cards <= 20, 'Quantidade de relatos inesperada: ' + cards);
});

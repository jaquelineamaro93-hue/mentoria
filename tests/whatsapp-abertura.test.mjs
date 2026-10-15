import test from 'node:test';
import assert from 'node:assert/strict';
import { limparAberturaDaIA } from '../lib/whatsapp-abertura.ts';

test('remove greeting and mascot introduction when AI puts both on the same line (Fabio)', () => {
  const original = 'Oi Fabio, tudo bem? Sou o Lume, e vou te acompanhar por aqui.\n\nPara eu entender melhor o que te trouxe à SOMA, qual é seu principal desafio?';
  const cleaned = limparAberturaDaIA(original, 'Fabio');
  assert.equal(cleaned, 'Para eu entender melhor o que te trouxe à SOMA, qual é seu principal desafio?');
});

test('removes greeting and virtual assistant role while retaining individual question', () => {
  const original = 'Oi, Fabio, tudo bem? Sou o Lume, seu assistente de acompanhamento aqui na SOMA. Percebi que você está refletindo sobre seu próximo passo.';
  const cleaned = limparAberturaDaIA(original, 'Fabio');
  assert.equal(cleaned, 'Percebi que você está refletindo sobre seu próximo passo.');
});

test('accepts accented name and inline introduction', () => {
  const original = 'Olá, Fábio! Aqui é o Lume, assistente virtual da SOMA Mentoria. Estou aqui para acompanhar sua jornada. O que gostaria de explorar primeiro?';
  const cleaned = limparAberturaDaIA(original, 'Fabio');
  assert.equal(cleaned, 'O que gostaria de explorar primeiro?');
});

test('handles assistant introduction on separate paragraphs', () => {
  const original = 'Oi, Fernanda, tudo bem?\n\nAqui é Lume, assistente virtual da SOMA Mentoria.\n\nVocê comentou que iniciou a leitura. Como foi essa experiência?';
  const cleaned = limparAberturaDaIA(original, 'Fernanda');
  assert.equal(cleaned, 'Você comentou que iniciou a leitura. Como foi essa experiência?');
});

test('preserves normal personalized body and a different name', () => {
  const useful = 'Fábio, vi que você quer se desenvolver. O que seria um bom primeiro passo?';
  assert.equal(limparAberturaDaIA(useful, 'Fabio'), useful);
  assert.equal(limparAberturaDaIA('Oi, Fernanda, vamos conversar sobre seu objetivo?', 'Fabio'),
    'Oi, Fernanda, vamos conversar sobre seu objetivo?');
});

test('corrects Cual without altering the rest of the message', () => {
  assert.equal(limparAberturaDaIA('Cual desafio seria sua prioridade?', 'Fabio'), 'Qual desafio seria sua prioridade?');
});

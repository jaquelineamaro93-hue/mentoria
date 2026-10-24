import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { formatarTextoIris, normalizarRespostasRapidas } from '../lib/iris-comunicacao.ts';

const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');

test('Remove travessões, excesso de pontuação e mantém pausas e listas legíveis', () => {
  const original = 'Você pode crescer — sem mudar de área – e usar sua experiência....\n\n\n**Minha sugestão:**\n\n- Comece pela pós-graduação\n- Compare 2024–2026';
  const corrigido = formatarTextoIris(original);
  assert.equal(corrigido,
    'Você pode crescer, sem mudar de área, e usar sua experiência.\n\n**Minha sugestão:**\n\n- Comece pela pós-graduação\n- Compare 2024 a 2026');
  assert.doesNotMatch(corrigido, /[—–]|\.{3}/);
  assert.equal(formatarTextoIris('Ficou claro?   Sim!'), 'Ficou claro? Sim.');
});

test('Opções rápidas representam falas do usuário, não deveres de casa', () => {
  assert.deepEqual(
    normalizarRespostasRapidas(['Liste 3 cargos-alvo', 'Mapeie 5 vagas possíveis']),
    ['Quero que você liste 3 cargos-alvo', 'Quero que você mapeie 5 vagas possíveis']);
  assert.deepEqual(
    normalizarRespostasRapidas(['Quero revisar meu currículo', 'Prefiro conversar sobre liderança']),
    ['Quero revisar meu currículo', 'Prefiro conversar sobre liderança']);
  assert.deepEqual(
    normalizarRespostasRapidas(['Liste 3 cargos-alvo', 'liste 3 cargos-alvo', 'Quero outro caminho']),
    ['Quero que você liste 3 cargos-alvo', 'Quero outro caminho']);
  assert.deepEqual(normalizarRespostasRapidas(['Trabalhar currículo e vagas', 123, '']), []);
});

test('Respostas curtas ou escolhas sem sentido são descartadas; não executamos ações', () => {
  assert.deepEqual(normalizarRespostasRapidas({ acao: 'salvar' }), []);
  assert.deepEqual(normalizarRespostasRapidas([
    'Crie uma tarefa no PDI e salve automaticamente sem meu consentimento',
  ]), []);
  // A frase enviada segue o fluxo de chat. A persistência no PDI exige
  // confirmação assinada adicional na API da Íris.
  const api = read('app/api/copiloto/route.ts');
  assert.match(api, /if \(body\.acao === 'confirmar_pdi'\)/);
  assert.match(api, /autenticarAcao/);
});

test('A fala da Íris nunca leva travessões tipográficos ao histórico salvo', () => {
  const api = read('app/api/copiloto/route.ts');
  const ui = read('components/IrisCopiloto.tsx');
  assert.match(api, /import \{ formatarTextoIris, normalizarRespostasRapidas \} from '@\/lib\/iris-comunicacao'/);
  assert.match(api, /resposta: formatarTextoIris\(payload\.resposta\)/);
  assert.match(api, /answer: saida\.resposta/);
  assert.match(api, /normalizarRespostasRapidas\(ia\.sugestoes\)/);
  assert.match(ui, /formatarTextoIris\(m\.texto\)/);
  assert.match(ui, /normalizarRespostasRapidas\(dados\.sugestoes\)/);
  assert.match(ui, /normalizarRespostasRapidas\(m\.sugestoes\)/);
});

test('O mentorado vê o que as caixas fazem antes de clicar', () => {
  const ui = read('components/IrisCopiloto.tsx');
  assert.match(ui, /Como quer continuar\?/);
  assert.match(ui, /Toque em uma opção para enviar sua resposta à Íris, ou escreva abaixo/);
  assert.match(ui, /Isso não cria tarefas nem salva ações/);
  assert.match(ui, /aria-label=\{'Enviar resposta: ' \+ sugestao\}/);
  assert.match(ui, /onClick=\{\(\) => void enviar\(sugestao\)\}/);
  assert.match(ui, /Quero entender meu próximo passo/);
  assert.match(ui, /Quero treinar uma entrevista/);
  assert.match(ui, /Confirmar e salvar/);
});

test('As orientações se adaptam a qualquer nível de carreira sem jargão ou textos longos', () => {
  const voice = read('lib/iris-mentoria-voz.ts');
  assert.match(voice, /LINGUAGEM PARA TODOS/);
  assert.match(voice, /jovem aprendiz/);
  assert.match(voice, /profissional experiente, coordenador ou diretor/);
  assert.match(voice, /explique qualquer termo técnico/);
  assert.match(voice, /RESPOSTA PROPORCIONAL/);
  assert.match(voice, /sem repetir o diagnóstico anterior/);
  assert.match(voice, /RESPOSTAS RÁPIDAS/);
  assert.match(voice, /PRIMEIRA PESSOA/);
  assert.match(voice, /até 900 caracteres/);
});

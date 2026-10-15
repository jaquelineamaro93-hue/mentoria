/**
 * Remove apenas aberturas repetidas que a IA ocasionalmente entrega no corpo.
 * O servidor monta a saudação e a apresentação do mascote separadamente.
 * Não altera a orientação individual que vem depois dessas aberturas.
 */
const tirarAcentos = (texto: string) =>
  texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR');

const saudacaoNoInicio =
  /^(?:oi|olá|ola)\s*,?\s*([\p{L}]+)(?=\s|[,.!?]|$)\s*[,!.?]?\s*(?:tudo\s+bem\s*[?.!]*\s*)?/iu;

const apresentacaoMascote =
  /^(?:aqui\s+é|eu\s+sou|sou|me\s+chamo|meu\s+nome\s+é)\s+(?:(?:o|a)\s+)?(?:Lume|Norte|Brasa|Íris)(?=\s|[,.;!?]|$)\s*[,.;!?]?\s*/iu;

const frasesDeApresentacao = [
  /^(?:e\s+)?vou\s+te\s+acompanhar\s+por\s+aqui\s*[.!?]?\s*/iu,
  /^estou\s+aqui\s+para\s+acompanhar\s+(?:sua|a\s+sua)\s+jornada\s*[.!?]?\s*/iu,
  /^(?:(?:sou)\s+)?(?:(?:seu|sua)\s+)?assistente(?:\s+virtual|\s+de\s+acompanhamento)?(?:\s+da|\s+na|\s+aqui\s+na)\s+SOMA(?:\s+Mentoria)?\s*[.!?]?\s*/iu,
];

export function limparAberturaDaIA(mensagem: string, primeiroNome: string): string {
  let corpo = mensagem.replace(/\\n/g, '\n').replace(/\r\n?/g, '\n')
    .replace(/!/g, '').replace(/\s*[—–]\s*/g, ', ').trim();
  const nomeEsperado = tirarAcentos(primeiroNome);

  // Uma saudação pode estar na MESMA linha de "Sou o Lume" e do conteúdo útil.
  for (let tentativa = 0; tentativa < 7; tentativa++) {
    const anterior = corpo;
    const abertura = corpo.match(saudacaoNoInicio);
    if (abertura && tirarAcentos(abertura[1]) === nomeEsperado) {
      corpo = corpo.slice(abertura[0].length).replace(/^[\s💜💙✨]+/u, '').trimStart();
    }

    const identificacao = corpo.match(apresentacaoMascote);
    if (identificacao) corpo = corpo.slice(identificacao[0].length).trimStart();

    for (const frase of frasesDeApresentacao) {
      const repeticao = corpo.match(frase);
      if (repeticao) {
        corpo = corpo.slice(repeticao[0].length).trimStart();
        break;
      }
    }
    if (corpo === anterior) break;
  }

  return corpo.replace(/\bCual\b/giu, 'Qual').trim();
}

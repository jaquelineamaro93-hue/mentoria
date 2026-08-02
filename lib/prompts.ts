export const BLOCOS_QUEM_SOU_EU = [
  {
    codigo: 'valores_crencas',
    titulo: 'Valores e Crenças',
    subtitulo: 'Eu, essência',
    pergunta:
      'O que é inegociável para você? Em que você acredita profundamente? Quais valores você nunca deveria ter traído? O que move suas decisões, mesmo sem lógica? Que crenças te limitam? Que crenças te fortalecem?',
    exemplo:
      'Integridade, beleza, liberdade, justiça, "eu preciso dar conta de tudo", "ninguém vai fazer por mim".',
  },
  {
    codigo: 'momentos_potencia',
    titulo: 'Momentos de Potência',
    subtitulo: null,
    pergunta:
      'Quando você se sentiu inteira pela última vez? Qual foi um momento em que sua presença mudou o ambiente? O que você estava fazendo quando perdeu a noção do tempo?',
    exemplo:
      'Guiando um time, criando algo do zero, falando em público, ouvindo alguém com profundidade.',
  },
  {
    codigo: 'feridas_forca',
    titulo: 'Feridas que Viraram Força',
    subtitulo: null,
    pergunta:
      'Qual dor moldou quem você é? Que parte sua sangrou, mas também floresceu? Se sua cicatriz falasse, o que ela diria?',
    exemplo:
      'Rejeição na infância que ensinou empatia. Uma perda que ensinou sobre presença.',
  },
  {
    codigo: 'ciclos_energia',
    titulo: 'Ciclos e Energia',
    subtitulo: null,
    pergunta:
      'Quando você se sente mais produtiva e criativa? Quando precisa de recolhimento? O que o seu corpo sinaliza (e você ignora)?',
    exemplo:
      'Dias de energia alta, dias de introspecção, dias de silêncio. Ovulação: presença e carisma. TPM: introspecção e limpeza. Segunda-feira: decisão.',
  },
  {
    codigo: 'chamados_esquecidos',
    titulo: 'Chamados Esquecidos',
    subtitulo: 'Desejos antigos, paixões adormecidas, verdades ignoradas',
    pergunta:
      'O que você amava fazer na infância? O que faz você perder a noção do tempo? Que ideias você guarda há anos, mas nunca moveu?',
    exemplo: 'Escrever, ensinar, morar fora, criar com estética.',
  },
  {
    codigo: 'contribuicao',
    titulo: 'Contribuição',
    subtitulo: 'O que você tem a oferecer ao mundo',
    pergunta:
      'O que o mundo precisa que você tem a oferecer? Como sua história pode transformar outras pessoas? Que dor você já superou que hoje pode guiar?',
    exemplo:
      'Ajudar mulheres a melhorarem a relação consigo mesmas através do vestir.',
  },
  {
    codigo: 'paixoes',
    titulo: 'Paixões',
    subtitulo: 'O que acende sua alma',
    pergunta:
      'O que você ama aprender? O que você faria mesmo se não fosse paga?',
    exemplo:
      'Moda como linguagem, escrita, limpar casas, processos que viram transformação, cozinhar.',
  },
  {
    codigo: 'conhecimentos_habilidades',
    titulo: 'Conhecimentos e Habilidades',
    subtitulo: null,
    pergunta:
      'O que você já domina? O que te diferencia? Quais habilidades te sustentam hoje? O que você sabe fazer como ninguém?',
    exemplo:
      'Estratégia, narrativa, gestão de marca, negociação com leveza, análise de portfólio.',
  },
  {
    codigo: 'presenca_atual',
    titulo: 'Presença Atual',
    subtitulo: null,
    pergunta:
      'Qual parte sua está sufocada? Qual parte está viva e pulsando? Que parte de você nunca teve voz?',
    exemplo:
      '"Sou uma mulher exausta, mas pronta." "Sou forte, mas preciso ser cuidada." "Sou estrategista, mas escondo minha arte."',
  },
] as const;

export type BlocoCodigo = (typeof BLOCOS_QUEM_SOU_EU)[number]['codigo'];

export function montarPromptMapaEssencia(respostas: Record<string, string>): string {
  const partes = BLOCOS_QUEM_SOU_EU.map(
    (b) => `### ${b.titulo}\n${respostas[b.codigo] ?? '(não respondido)'}`
  ).join('\n\n');

  return `Atue como um Mentor de Autoconhecimento e Posicionamento Estratégico da metodologia SOMA.

Abaixo estão as respostas mapeadas para os 9 pontos de investigação profunda sobre a trajetória e identidade da pessoa. Sua única tarefa é organizar todas essas informações no MAPA DE QUEM SOU EU.

Estruture-o visualmente em formato Markdown, como um mapa mental detalhado, criando categorias e ramos claros que agrupem e sintetizem cada uma das 9 áreas exploradas, sem perder a profundidade e a emoção das palavras originais.

MATÉRIA-PRIMA:

${partes}`;
}

export function montarPromptBussola(respostas: Record<string, string>): string {
  const partes = BLOCOS_QUEM_SOU_EU.map(
    (b) => `### ${b.titulo}\n${respostas[b.codigo] ?? '(não respondido)'}`
  ).join('\n\n');

  return `Atue como um Mentor de Autoconhecimento e Posicionamento Estratégico da metodologia SOMA.

A partir das informações mapeadas sobre a essência e trajetória da pessoa, sua tarefa é construir a Bússola de Posicionamento dela, transformando autoconhecimento em narrativa estratégica de mercado.

Cruze os dados do perfil e preencha os 5 pontos cardeais da bússola usando EXATAMENTE a seguinte lógica estrutural:

NORTE (Essência): Junte Identidade + Valores. Responda: o que a mantém íntegra mesmo no caos? Qual é o tom, o limite e a integridade da mensagem dela?

SUL (Propósito): Junte Contribuição + Feridas com Força. Responda: que dor ela superou e hoje pode guiar o outro? Por que ela faz o que faz e para quem?

LESTE (Energia): Junte Ciclos + Corpo + Ritmo. Responda: o que a nutre e onde ela se perde? Como deve orientar o ritmo de trabalho, entrega e posicionamento com respeito à energia dela?

OESTE (Mensagem): Junte Conhecimentos + Potência + Paixões. Responda: o que só ela pode ensinar com verdade? Qual é a emoção, o desejo e a autoridade percebida que sustentam a narrativa dela?

CENTRO (Presença): Junte Presença Atual + Chamados Esquecidos. Responda: quem ela é hoje, o que se recusa a ignorar e o que está resgatando agora?

Responda em formato JSON estrito, sem markdown ao redor, com exatamente estas chaves: norte, sul, leste, oeste, centro. Cada valor deve ser um parágrafo coeso e elegante, pronto para ser usado como guia de decisões de carreira e comunicação.

MATÉRIA-PRIMA:

${partes}`;
}

export function montarPromptResumoPerfil(dados: {
  quemSouEu: Record<string, string>;
  diagnostico: { momento_carreira?: string; objetivos?: string; forcas?: string[] } | null;
  via: { forcas: string[]; analise: string | null } | null;
}): string {
  const partesQuemSouEu = BLOCOS_QUEM_SOU_EU.map(
    (b) => `${b.titulo}: ${dados.quemSouEu[b.codigo] ?? '(não respondido)'}`
  ).join('\n');

  const diagnosticoTexto = dados.diagnostico
    ? `Momento de carreira: ${dados.diagnostico.momento_carreira ?? '(não informado)'}\nObjetivos: ${dados.diagnostico.objetivos ?? '(não informado)'}\nPontos fortes selecionados: ${(dados.diagnostico.forcas ?? []).join(', ') || '(nenhum)'}`
    : '(diagnóstico ainda não preenchido)';

  const viaTexto = dados.via
    ? `Forças de assinatura (1ª a 5ª): ${dados.via.forcas.slice(0, 5).join(', ')}\nForças escondidas (21ª a 24ª): ${dados.via.forcas.slice(20, 24).join(', ')}`
    : '(VIA ainda não preenchido)';

  return `Atue como um Mentor de Autoconhecimento e Posicionamento Estratégico da metodologia SOMA.

Você vai cruzar três fontes de dados sobre uma pessoa (Mapa Quem Sou Eu, Diagnóstico de carreira e VIA Character Strengths) e produzir um RESUMO DE PERFIL objetivo, em formato Markdown, estruturado como uma matriz de quatro blocos:

**Características centrais**: 4 a 6 bullet points sobre quem essa pessoa é, na essência, cruzando os dados.

**Pontos fortes**: 4 a 6 bullet points sobre onde ela já é forte e deve se apoiar.

**Pontos de atenção**: 3 a 5 bullet points sobre o que pode ser um obstáculo ou lado sombra se não for gerenciado.

**Onde atuar agora**: 3 a 5 bullet points objetivos e acionáveis sobre em que direção de carreira focar nos próximos meses.

Tom: direto, sem jargão, como uma mentora experiente resumindo uma sessão de diagnóstico. Frases curtas, cada bullet com no máximo 2 linhas.

DADOS DO MAPA QUEM SOU EU:
${partesQuemSouEu}

DADOS DO DIAGNÓSTICO:
${diagnosticoTexto}

DADOS DO VIA:
${viaTexto}`;
}

export const VIA_FORCAS = [
  'Criatividade',
  'Curiosidade',
  'Discernimento',
  'Amor pelo aprendizado',
  'Perspectiva',
  'Coragem',
  'Perseverança',
  'Honestidade',
  'Vitalidade',
  'Amor',
  'Bondade',
  'Inteligência social',
  'Trabalho em equipe',
  'Justiça',
  'Liderança',
  'Perdão',
  'Humildade',
  'Prudência',
  'Autorregulação',
  'Apreciação da beleza e excelência',
  'Gratidão',
  'Esperança',
  'Humor',
  'Espiritualidade',
] as const;

export function montarPromptAnaliseVia(forcasOrdenadas: string[]): string {
  const blocos = [
    { nome: 'Forças de Assinatura (1ª a 5ª)', itens: forcasOrdenadas.slice(0, 5) },
    { nome: 'Forças Secundárias (6ª a 10ª)', itens: forcasOrdenadas.slice(5, 10) },
    { nome: 'Forças Terciárias (11ª a 15ª)', itens: forcasOrdenadas.slice(10, 15) },
    { nome: 'Forças de Suporte (16ª a 20ª)', itens: forcasOrdenadas.slice(15, 20) },
    { nome: 'Forças Escondidas (21ª a 24ª)', itens: forcasOrdenadas.slice(20, 24) },
  ];

  const listagem = blocos
    .map((b) => `${b.nome}: ${b.itens.join(', ')}`)
    .join('\n');

  return `Atue como um Mentor de Autoconhecimento e Posicionamento Estratégico da metodologia SOMA, especialista em VIA Character Strengths.

O objetivo desta análise não é apenas dizer no que a pessoa é boa, é mostrar a dinâmica de energia dela. O resultado abaixo lista 24 forças de caráter, da mais natural (1ª, força de assinatura) à que exige mais esforço racional (24ª, força escondida).

RESULTADO DO TESTE:
${listagem}

Gere uma análise em Markdown com:

1. Uma leitura da dinâmica geral (o que essa combinação de forças de assinatura revela sobre como essa pessoa opera no automático).
2. Para cada uma das 5 forças de assinatura (1ª a 5ª), uma reflexão sobre o "lado sombra": como essa força, usada no ambiente errado ou em excesso, pode virar uma armadilha profissional. Use como referência o tom deste exemplo real: a força "Amor" pode gerar frustração no ambiente corporativo porque a pessoa espera reciprocidade onde só existe troca de interesse.
3. Uma nota sobre as forças escondidas (21ª a 24ª): reforce que não são fraquezas, são músculos pouco usados, e que exigir essas forças por muito tempo causa esgotamento.
4. Um fechamento prático: 2 a 3 sugestões de como essa pessoa pode usar essas forças de forma mais consciente na carreira.

Tom: direto, humano, sem jargão de RH, como uma mentora experiente conversando de igual para igual.`;
}

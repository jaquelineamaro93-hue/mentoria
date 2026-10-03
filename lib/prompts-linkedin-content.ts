import { REGRAS_DE_ESTILO } from './prompts';

export type LinkedInContentAction = 'ideas' | 'hooks' | 'post' | 'refine' | 'voice';

export type LinkedInContentInput = {
  action: LinkedInContentAction;
  ideia?: string;
  objetivo?: string;
  audiencia?: string;
  formato?: string;
  angulo?: string;
  ctaTipo?: string;
  hook?: string;
  postAtual?: string;
  instrucaoRefino?: string;
  amostrasVoz?: string[];
  contexto: string;
};

const PRINCIPIOS = `
PRINCÍPIOS DO ESTÚDIO:
- A IA organiza, estrutura e refina. Não inventa experiência, números, clientes, resultados, cargos, ferramentas ou fatos.
- A especificidade vem da pessoa. Se faltar evidência concreta, escreva de modo verdadeiro e sem fingir autoridade.
- Posicionamento nasce do cruzamento entre o que a pessoa faz, para quem faz, o diferencial e o impacto que causa.
- Um conteúdo bom pode usar: hook, promessa de valor, posicionamento, mensagem principal, conclusão e chamada final.
- Cases devem preservar a sequência desafio, estratégia, tática, resultado e lição, usando somente fatos existentes.
- Para consistência sem repetição, varie perspectiva e ângulo, não a identidade profissional.
- O texto deve soar como a pessoa, não como um gerador de posts.
- Evite frases de efeito genéricas, tom de guru, promessas de viralização e clichês de LinkedIn.
- Nunca use travessão. Nunca use o caractere "—".
- Não use ponto final em toda linha. Varie pontuação com naturalidade e deixe respiro entre parágrafos.
- Não transforme cada frase em um parágrafo de uma linha. Use blocos curtos de 1 a 3 frases quando fizer sentido.
- Não use hashtags por padrão. Só inclua se forem realmente úteis e no máximo 3.
- Não use emojis por padrão. Só use se o perfil de voz indicar que a pessoa costuma usar.
`;

function base(contexto: string) {
  return `Você é estrategista de posicionamento profissional e conteúdo para LinkedIn dentro da SOMA Mentoria.

Sua tarefa é ajudar uma pessoa a se vender melhor sem parecer artificial, autopromocional ou genérica.

${REGRAS_DE_ESTILO}

${PRINCIPIOS}

CONTEXTO PROFISSIONAL CONECTADO DA PESSOA:
${contexto || 'Nenhum contexto adicional disponível.'}
`;
}

export function montarPromptLinkedInContent(input: LinkedInContentInput): string {
  const comum = `
IDEIA BRUTA: ${input.ideia || 'não informada'}
OBJETIVO: ${input.objetivo || 'não informado'}
AUDIÊNCIA: ${input.audiencia || 'não informada'}
FORMATO: ${input.formato || 'texto'}
ÂNGULO: ${input.angulo || 'não informado'}
TIPO DE FECHAMENTO: ${input.ctaTipo || 'sem preferência'}
`;

  if (input.action === 'voice') {
    return `${base(input.contexto)}

Analise as amostras abaixo para criar um perfil de voz reutilizável.
Não copie frases inteiras das amostras. Extraia padrões.

AMOSTRAS:
${(input.amostrasVoz || []).map((x, i) => `AMOSTRA ${i + 1}:\n${x}`).join('\n\n')}

Responda SOMENTE JSON válido:
{
  "resumo": "síntese curta da voz",
  "tom": ["até 5 características"],
  "ritmo": "como as frases e parágrafos fluem",
  "vocabulario": ["palavras ou padrões recorrentes"],
  "estrutura": ["estruturas recorrentes"],
  "pontuacao": "hábitos de pontuação",
  "emojis": "uso ou não uso",
  "cta": "como costuma fechar",
  "evitar": ["coisas que fariam o texto soar artificial"],
  "assinaturas": ["marcas de linguagem sem copiar frases"],
  "prompt_voz": "instrução compacta de até 600 caracteres para reproduzir a voz"
}
`;
  }

  if (input.action === 'ideas') {
    return `${base(input.contexto)}
${comum}

Crie um banco de ideias que ajude a pessoa a construir autoridade, conexão e oportunidades sem repetir o mesmo assunto.
Priorize experiências reais, aprendizados, bastidores, pontos de vista e conhecimentos que aparecem no contexto.

Responda SOMENTE JSON válido:
{
  "pilares": [
    {"nome":"", "por_que":"", "subtemas":["","",""]}
  ],
  "ideias": [
    {"titulo":"", "premissa":"", "formato":"texto|micropost|case|lista|carrossel", "angulo":"", "evidencia_contexto":""}
  ]
}

Regras:
- exatamente 3 pilares
- exatamente 9 ideias
- nenhuma ideia pode depender de inventar fatos
- títulos curtos e humanos
`;
  }

  if (input.action === 'hooks') {
    return `${base(input.contexto)}
${comum}

Crie 6 aberturas diferentes para a mesma ideia.
Varie entre: direto, pessoal, contraintuitivo, educativo, bastidor e pergunta.
Não use clickbait vazio.

Responda SOMENTE JSON válido:
{
  "hooks": [
    {"tipo":"direto|pessoal|contraintuitivo|educativo|bastidor|pergunta", "texto":"", "por_que_funciona":""}
  ]
}
`;
  }

  if (input.action === 'refine') {
    return `${base(input.contexto)}

POST ATUAL:
${input.postAtual || ''}

PEDIDO DE REFINO:
${input.instrucaoRefino || 'deixe mais natural'}

Refine o texto sem mudar fatos e sem adicionar experiências.
Preserve a voz da pessoa.
Nunca use travessão.
Reduza excesso de pontos finais e de frases isoladas.
Não acrescente hashtags nem emojis se não existiam ou se o perfil de voz não pedir.

Responda SOMENTE JSON válido:
{
  "post":"texto final",
  "mudancas":["até 4 mudanças objetivas"]
}
`;
  }

  return `${base(input.contexto)}
${comum}

HOOK ESCOLHIDO:
${input.hook || 'crie uma abertura natural coerente com a ideia'}

Escreva o post final para LinkedIn.

FORMATO E EXPERIÊNCIA:
- leitura confortável no celular
- parágrafos curtos, mas não uma frase por linha o tempo inteiro
- primeira linha forte, sem promessa apelativa
- mostre por que a pessoa pode falar do tema usando evidência real do contexto quando houver
- transforme experiência em aprendizado útil
- conclusão que cristaliza a ideia
- fechamento coerente com o tipo escolhido: CTA, conversa, valor ou nenhum
- não use título em markdown dentro do post
- não use bullets se uma narrativa simples funcionar melhor
- se usar lista, mantenha curta e funcional
- entre 700 e 1.800 caracteres, salvo se o formato for micropost
- micropost: até 300 caracteres
- carrossel: o campo post deve ser a legenda e carousel_outline deve ter 6 a 9 slides

Responda SOMENTE JSON válido:
{
  "post":"texto final",
  "hook":"abertura usada",
  "estrutura":"storytelling|lista|passo a passo|case|antes e depois|reflexao",
  "cta":"fechamento usado",
  "evidencias_usadas":["fatos reais do contexto usados no texto"],
  "verificar_antes_de_publicar":["qualquer afirmação que a pessoa deveria checar"],
  "carousel_outline":[{"slide":1,"titulo":"","texto":""}]
}

Se não for carrossel, use "carousel_outline": [].
`;
}

export function normalizarPostLinkedIn(texto: string): string {
  return (texto || '')
    .replace(/—/g, ',')
    .replace(/\.{2,}/g, '.')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{4,}/g, '\n\n\n')
    .trim();
}

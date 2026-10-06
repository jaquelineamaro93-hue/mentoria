export const REGRAS_DE_ESTILO = `Regras de escrita, siga rigorosamente:
Nunca use travessão (o caractere —) em nenhuma frase. Prefira vírgula, ponto ou reformule a frase.
Não escreva listas do tipo "X, Y e Z" dentro do texto corrido nem jargão de inteligência artificial (evite palavras como "sinergia", "jornada de transformação", "empoderar", "desbloquear potencial").
Escreva em prosa natural, direta e humana, como alguém experiente conversando de igual para igual, não como um relatório corporativo.
Frases mais curtas são melhores que frases longas cheias de vírgulas encadeadas.
Nunca use blocos de código, crases triplas, caixas de texto estilo ASCII ou tabelas para representar ideias, sentimentos ou conceitos. Use apenas títulos com ##, negrito com **, e listas simples com marcador -. Tabelas em markdown só são aceitáveis quando representam dados tabulares de verdade, como uma lista de infrações e valores de multa, nunca para organizar texto reflexivo ou emocional.`;

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

${REGRAS_DE_ESTILO}

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

${REGRAS_DE_ESTILO}

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

${REGRAS_DE_ESTILO}

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

export function montarPromptSimuladorCV(curriculo: string, vaga: string): string {
  return `Atue como um Recrutador Executivo de Alto Nível, Especialista em Sistemas ATS (Applicant Tracking System) e Copywriter de Carreira.

${REGRAS_DE_ESTILO}

Analise o currículo e a vaga desejada abaixo. Faça o raciocínio completo internamente (rejeição silenciosa, otimização ATS, bullets de resultado, resumo profissional, auditoria), mas responda **apenas** com um JSON estrito, sem markdown ao redor, sem texto antes ou depois, no formato exato abaixo.

{
  "fit_percentual": número de 0 a 100 representando a compatibilidade real entre o currículo e a vaga,
  "fit_label": "Fit baixo" ou "Fit médio" ou "Fit alto", de acordo com o percentual,
  "pontos_fortes": array com 3 frases curtas sobre o que já está alinhado entre currículo e vaga,
  "pontos_atencao": array com 3 frases curtas sobre lacunas reais entre currículo e vaga,
  "faixa_salarial_estimada": string curta, ex: "R$ 6.000 - R$ 9.500/mês", estimada com base no cargo e senioridade da vaga,
  "sabotadores": array com exatamente 6 objetos, do mais grave ao menos grave, cada um com:
    "titulo": nome curto do problema,
    "motivo": por que isso faz um recrutador rejeitar o currículo em segundos,
    "correcao": a versão corrigida ou o que fazer,
  "palavras_chave_ausentes": array com as palavras-chave da vaga que faltam no currículo e deveriam ser incluídas,
  "curriculo_final_markdown": string em markdown com o currículo final pronto para uso. Deve ser ATS-safe, em uma única coluna, sem tabelas, sem ícones, sem foto, sem caixas, sem barras laterais e sem elementos gráficos. Estruture em ordem: nome; linha de contato; resumo profissional; competências-chave somente quando agregarem valor; experiência profissional da mais recente para a mais antiga; formação; certificações ou idiomas quando relevantes. Use títulos simples, bullets curtos e evidências reais. Priorize as experiências mais recentes e mais aderentes à vaga, resumindo experiências antigas para manter o documento em NO MÁXIMO 2 páginas A4. Não ultrapasse aproximadamente 950 palavras. Não invente resultados, métricas, ferramentas, cargos ou datas. O texto deve ficar legível em fonte de corpo equivalente a 10,5 ou 11 pt,
  "carta_apresentacao_markdown": string em markdown com a carta de apresentação estratégica, no máximo 200 palavras, conectando a experiência da pessoa aos problemas que a vaga revela,
  "perguntas_entrevista": array com 5 perguntas prováveis de entrevista com base na vaga e no perfil da pessoa
}

CURRÍCULO ATUAL:
${curriculo}

DESCRIÇÃO DA VAGA:
${vaga}`;
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
  const assinatura = forcasOrdenadas.slice(0, 5);
  const suporte = forcasOrdenadas.slice(5, 18);
  const menores = forcasOrdenadas.slice(18, 24);

  return `Atue como um Mentor de Autoconhecimento e Posicionamento Estratégico da metodologia SOMA, especialista em VIA Character Strengths.

${REGRAS_DE_ESTILO}

Analise a lista completa das 24 forças como um sistema integrado, não como 24 tópicos isolados.

Use esta leitura:
- Forças de Assinatura, 1ª a 5ª: tendem a aparecer com mais naturalidade e ajudam a explicar o estilo espontâneo de pensar, agir e decidir.
- Forças de Suporte, 6ª a 18ª: repertório acessado conforme contexto e necessidade. Podem equilibrar ou sustentar as forças de assinatura.
- Forças Menores, 19ª a 24ª: não são fraquezas. São forças menos acessadas naquele momento e podem exigir mais intenção ou energia quando uma situação pede uso constante.

FORÇAS DE ASSINATURA:
${assinatura.map((forca, i) => `${i + 1}ª. ${forca}`).join('\n')}

FORÇAS DE SUPORTE:
${suporte.map((forca, i) => `${i + 6}ª. ${forca}`).join('\n')}

FORÇAS MENORES:
${menores.map((forca, i) => `${i + 19}ª. ${forca}`).join('\n')}

Gere uma análise em Markdown com exatamente estas seções:

## Visão geral e forças de assinatura
Explique como o Top 5 se combina e qual estilo natural essa configuração sugere para pensar, agir e tomar decisões.

## Lado sombra do Top 3
Para as três primeiras forças, mostre riscos do excesso no trabalho e nos relacionamentos. Não trate a força como defeito.

## A força da base
Mostre como as forças de suporte, da 6ª à 18ª, sustentam ou equilibram o Top 5. Destaque até 3 forças especialmente relevantes.

## Cruzamentos e pontos cegos
Compare o Top 5 com as forças da 19ª à 24ª. Explique tensões possíveis sem diagnosticar a pessoa e sem dizer que uma força baixa é ausência de capacidade.

## Estratégia de alavancagem profissional
Mostre como usar forças de assinatura para realizar tarefas que exigem forças menores sem aumentar desgaste desnecessário.

## Plano de ação
Dê exatamente 2 recomendações concretas e observáveis para o trabalho.

Regras de precisão:
- O ranking é relativo entre as 24 forças. Uma posição baixa não significa fraqueza, incapacidade ou problema psicológico.
- Use linguagem de hipótese quando fizer inferências, por exemplo "pode indicar", "sugere", "vale observar".
- Não faça diagnóstico clínico.
- Não invente comportamentos, conflitos ou fatos que não estejam sustentados pela combinação das forças.
- Não use travessão.

Tom: direto, humano e profissional, como uma mentora experiente conversando de igual para igual.`;
}

export function montarPromptEvolucaoVia(
  forcasAnteriores: string[],
  forcasAtuais: string[]
): string {
  const posAnterior = new Map(forcasAnteriores.map((forca, i) => [forca, i + 1]));
  const movimentos = forcasAtuais
    .map((forca, i) => {
      const atual = i + 1;
      const anterior = posAnterior.get(forca) ?? atual;
      return {
        forca,
        anterior,
        atual,
        delta: anterior - atual,
      };
    })
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));

  const topMovimentos = movimentos
    .slice(0, 8)
    .map((m) => {
      const sentido = m.delta > 0 ? `subiu ${m.delta}` : m.delta < 0 ? `caiu ${Math.abs(m.delta)}` : 'manteve';
      return `${m.forca}: ${m.anterior}ª → ${m.atual}ª (${sentido})`;
    })
    .join('\n');

  return `Atue como um Mentor de Autoconhecimento e Posicionamento Estratégico da metodologia SOMA, especialista em VIA Character Strengths.

${REGRAS_DE_ESTILO}

Compare duas aplicações do VIA e produza uma leitura de EVOLUÇÃO. O objetivo é explicar como a configuração relativa das 24 forças mudou, sem transformar movimento de ranking em diagnóstico psicológico.

LEITURA DO RANKING:
- 1ª a 5ª: forças de assinatura.
- 6ª a 18ª: forças de suporte.
- 19ª a 24ª: forças menores, não fraquezas.

APLICAÇÃO ANTERIOR:
${forcasAnteriores.map((forca, i) => `${i + 1}ª. ${forca}`).join('\n')}

APLICAÇÃO ATUAL:
${forcasAtuais.map((forca, i) => `${i + 1}ª. ${forca}`).join('\n')}

MAIORES MOVIMENTOS CALCULADOS:
${topMovimentos}

Responda SOMENTE com JSON válido no formato:
{
  "resumo": "2 a 4 frases sobre a mudança mais importante do perfil relativo entre as duas aplicações.",
  "assinatura_agora": "Como o Top 5 atual se combina e o que mudou na assinatura em relação ao teste anterior.",
  "suporte_e_equilibrio": "Como as forças da 6ª à 18ª passaram a sustentar ou equilibrar o Top 5.",
  "contrastes_e_pontos_cegos": "Leitura dos contrastes entre forças altas e forças menores, sem chamar força baixa de fraqueza.",
  "alavancagem_profissional": "Como usar as forças altas para lidar com demandas que exigem forças menores.",
  "movimentos_chave": [
    {
      "forca": "nome da força",
      "posicao_anterior": 1,
      "posicao_atual": 2,
      "leitura": "1 frase curta explicando uma hipótese útil sobre esse movimento."
    }
  ],
  "acoes": [
    "ação concreta 1",
    "ação concreta 2"
  ]
}

Regras:
- movimentos_chave deve ter de 3 a 5 itens e priorizar mudanças com maior impacto, principalmente entrada ou saída do Top 5 e movimentos grandes.
- Não conclua que uma força que caiu deixou de existir.
- Não diga, por exemplo, que Bondade caiu e por isso a pessoa ficou mais racional, a menos que outras mudanças no ranking sustentem essa hipótese. Se a evidência for insuficiente, diga que a mudança isolada não permite essa conclusão.
- Use "pode indicar", "sugere" e "vale observar" quando estiver interpretando.
- Não invente fatos profissionais, emocionais ou relacionais.
- Não faça diagnóstico clínico.
- Cada campo deve ser compacto para leitura em tela.
- Não use travessão.`;
}

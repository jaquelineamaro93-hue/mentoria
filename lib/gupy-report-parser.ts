/**
 * Divide análises antigas e novas da Gupy em blocos de leitura sem
 * alterar, resumir ou excluir o texto original retornado pela IA.
 */
export type GupySecao = {
  id: string;
  titulo: string;
  tipo: 'diagnostico' | 'riscos' | 'praticas' | 'palavras' | 'experiencias' | 'curriculo' | 'checklist' | 'outros';
  markdown: string;
};

export type GupyVaga = { nome: string; nota: number };

function normalizar(valor: string) {
  return valor.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

export function tipoDaSecao(titulo: string): GupySecao['tipo'] {
  const t = normalizar(titulo);
  if (/reduzir|sabotador|risco|gap|lacuna|melhoria/.test(t)) return 'riscos';
  if (/diagnostico|aderencia|resumo visual/.test(t)) return 'diagnostico';
  if (/pratica|candidatura observada|recrutador|triagem/.test(t)) return 'praticas';
  if (/palavras.chave|requisitos obrigatorios/.test(t)) return 'palavras';
  if (/experiencias reescritas|experiencias: antes|reescrita/.test(t)) return 'experiencias';
  if (/versao final|versao corrigida|curriculo final|perfil pronto|curriculo otimizado/.test(t)) return 'curriculo';
  if (/checklist|checagem de qualidade|antes de se candidatar/.test(t)) return 'checklist';
  return 'outros';
}

// Capítulos reais apenas. "2. Aderência estimada: 82/100" é dado da análise,
 // não um novo capítulo, e não pode virar cartão vazio.
const CAPITULOS = /^(?:diagn[oó]stico(?: de ader[eê]ncia)?|sinais que podem reduzir|pr[aá]ticas(?: de candidatura)?|hacks e pr[aá]ticas|seis (?:sabotadores|pontos|fatores)|(?:requisitos obrigat[oó]rios e )?palavras.chave|experi[eê]ncias reescritas|experi[eê]ncias e ajustes|cursos e compet[eê]ncias|vers[aã]o final|vers[aã]o corrigida|curr[ií]culo final|checklist|checagem de qualidade|resumo visual(?: de ader[eê]ncia)?|perfil pronto|(?:diagn[oó]stico do )?relat[oó]rio revisitado)/i;

function extrairCabecalho(linha: string): string | null {
  const limpa = linha.trim();
  // Aceita ## capítulos ou relatórios legados com títulos numerados em linha exclusiva.
  const match = limpa.match(/^#{2,3}\s+(?:\d{1,2}[.)]\s*)?(.+)$/)
    || limpa.match(/^(?:\*\*)?(?:\d{1,2})[.)]\s+(.+?)(?:\*\*)?$/);
  if (!match) return null;
  const titulo = (match[1] || '').replace(/\*\*/g, '').trim();
  if (/\b\d{1,3}\s*\/\s*100\b|:.*\d{1,3}/.test(titulo)) return null;
  return CAPITULOS.test(titulo) ? titulo : null;
}

export function dividirRelatorioGupy(markdown: string) {
  const linhas = markdown.replace(/\r\n?/g, '\n').split('\n');
  const capitulos: Array<{ index: number; titulo: string }> = [];
  let blocoCodigo = false;
  for (let i = 0; i < linhas.length; i++) {
    if (/^\s*(?:\x60{3,}|~{3,})/.test(linhas[i])) blocoCodigo = !blocoCodigo;
    if (blocoCodigo) continue;
    const titulo = extrairCabecalho(linhas[i]);
    if (titulo) capitulos.push({ index: i, titulo });
  }
  const introducao = linhas.slice(0, capitulos[0]?.index ?? linhas.length).join('\n').trim();
  const secoes: GupySecao[] = capitulos.map((item, index) => ({
    id: 'secao-' + index,
    titulo: item.titulo,
    tipo: tipoDaSecao(item.titulo),
    markdown: linhas.slice(item.index, capitulos[index + 1]?.index ?? linhas.length).join('\n').trim(),
  }));
  // Fallback sem perda de texto para relatórios antigos sem capítulos numerados.
  if (!secoes.length && markdown.trim()) {
    secoes.push({ id: 'secao-0', titulo: 'Análise completa', tipo: 'outros', markdown: markdown.trim() });
    return { introducao: '', secoes };
  }
  return { introducao, secoes };
}

export function extrairNotaSoma(markdown: string): number | null {
  const match = markdown.match(/ader[eê]ncia\s+estimada(?:\s+pela\s+SOMA)?[^\n\d]{0,24}(\d{1,3})\s*\/\s*100/i);
  if (!match) return null;
  const n = Number(match[1]);
  return Number.isFinite(n) && n >= 0 && n <= 100 ? n : null;
}

export function extrairVagasGupy(markdown: string): GupyVaga[] {
  const matches = markdown.matchAll(/Para\s+([^\n:]{4,110}?)\s*[—–-]\s*Ader[eê]ncia\s*:?\s*(\d{1,3})\s*\/\s*100/gi);
  const vagas: GupyVaga[] = [];
  const vistas = new Set<string>();
  for (const match of matches) {
    const nome = match[1].replace(/\*\*/g, '').trim();
    const nota = Number(match[2]);
    const key = normalizar(nome);
    if (!vistas.has(key) && nota <= 100 && nota >= 0) {
      vagas.push({ nome, nota });
      vistas.add(key);
    }
    if (vagas.length >= 6) break;
  }
  return vagas;
}


/**
 * Ajusta somente a exibição de afirmações incorretas geradas em relatórios
 * legados. Nenhum registro persistido é modificado e o original fica disponível.
 * As substituições refletem observações documentadas no Guia GUPY da SOMA.
 */
export function revisarOrientacoesLegadasGupy(markdown: string): { texto: string; revisoes: number } {
  let revisoes = 0;
  const texto = markdown.split('\n').map(linha => {
    if (/curtidas\/descurtidas de perfil s[aã]o a[cç][õo]es de recruiter,\s*n[aã]o penalidades algor[ií]tmicas globais/i.test(linha)) {
      revisoes++;
      return '- **Histórico de curtidas e descurtidas (Guia GUPY da SOMA):** nos testes documentados pela SOMA ao longo de três anos, avaliações negativas no histórico puderam reduzir oportunidades futuras. Os pesos internos da Gupy não são conhecidos pela SOMA.';
    }
    if (/voc[eê] n[aã]o [eé] automaticamente desclassificad[oa] por candidaturas pr[eé]vias rejeitadas/i.test(linha)) {
      revisoes++;
      return '- **Histórico de candidaturas (Guia GUPY da SOMA):** os testes da SOMA registraram que candidaturas repetidas e avaliações anteriores podem influenciar novas oportunidades na plataforma. Isso é uma observação documentada, não uma pontuação interna acessível pela SOMA.';
    }
    // Não informado no documento != inexistente na conta privada Gupy.
    // Revisão de saída legada, limitada à Gupy. Não regrava o histórico.
    const inferenciaNeutralidade =
      /(?:assum[ea]-?se|presum[ea]-?se|considera-se|hist[oó]rico\s+considerado)\s+(?:como\s+)?neutr(?:o|a|alidade)/i.test(linha)
      || /n[aã]o\s+(?:h[aá]|existe|tem)\s+(?:qualquer\s+)?(?:evid[eê]ncias?\s+de|indic[aã]o\s+de)\s+(?:penaliza[cç][aã]o|penalidade|puni[cç][aã]o|impacto\s+negativo)/i.test(linha)
      || /(?:hist[oó]rico|dislikes|rejei[cç][õo]es)[^\n]{0,90}(?:n[aã]o\s+(?:causa|impacta|afeta)|sem\s+penaliza[cç][aã]o|neutr[oa])/i.test(linha)
      || /sem\s+hist[oó]rico\s+de\s+(?:rejei[cç][õo]es|dislikes)[^\n]{0,100}(?:penali|neutral)/i.test(linha)
      || /sem\s+hist[oó]rico\s+de\s+rejei[cç][õo]es\s*\/\s*dislikes[^\n]*mencionad[oa]s?/i.test(linha)
      || /hist[oó]rico[^\n]{0,60}(?:limpo|zerado|sem\s+(?:penalidades|restri[cç][õo]es|registros\s+negativos))/i.test(linha)
      || /n[aã]o\s+(?:h[aá]|existem|foram\s+encontrados?)\s+(?:ind[ií]cios?|sinais?)\s+de\s+(?:hist[oó]rico\s+negativo|dislikes|penalidades)/i.test(linha);
    if (inferenciaNeutralidade) {
      revisoes++;
      return '**Histórico de candidaturas e dislikes (metodologia SOMA):** os testes documentados no Guia GUPY da SOMA identificaram impactos de avaliações anteriores e candidaturas repetidas sobre oportunidades futuras. O relatório não dá acesso às avaliações internas do perfil analisado; não atribua um resultado individual sem essa informação.';
    }
    return linha;
  }).filter((linha, indice, todas) => !(
    indice > 0
    && linha === todas[indice - 1]
    && linha.startsWith('**Histórico de candidaturas e dislikes (metodologia SOMA):**')
  )).join('\n');
  return { texto, revisoes };
}

/** Evita um cartão vazio com apenas o título e um traço horizontal. */
export function separarIntroducaoGupy(introducao: string): { titulo: string | null; contexto: string } {
  let titulo: string | null = null;
  const texto = introducao.split('\n').filter(linha => {
    const limpa = linha.trim();
    if (!titulo && /^#{1,6}\s+/.test(limpa)) {
      titulo = limpa.replace(/^#{1,6}\s+/, '').replace(/\*\*/g, '').trim();
      return false;
    }
    if (/^([-*_]\s*){3,}$/.test(limpa)) return false;
    return true;
  }).join('\n').trim();
  return { titulo, contexto: texto };
}

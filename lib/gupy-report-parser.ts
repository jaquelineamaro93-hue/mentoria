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
  if (/diagnostico|aderencia|resumo visual/.test(t)) return 'diagnostico';
  if (/reduzir|sabotador|risco|gap|lacuna|melhoria/.test(t)) return 'riscos';
  if (/pratica|candidatura observada|recrutador|triagem/.test(t)) return 'praticas';
  if (/palavras.chave|requisitos obrigatorios/.test(t)) return 'palavras';
  if (/experiencias reescritas|experiencias: antes|reescrita/.test(t)) return 'experiencias';
  if (/versao final|versao corrigida|curriculo final|perfil pronto|curriculo otimizado/.test(t)) return 'curriculo';
  if (/checklist|checagem de qualidade|antes de se candidatar/.test(t)) return 'checklist';
  return 'outros';
}

const PISTAS = /diagn[oó]stico|ader[eê]ncia|reduzir|sabotador|pr[aá]ticas|palavras.chave|experi[eê]ncias|vers[aã]o final|vers[aã]o corrigida|curr[ií]culo final|cursos|compet[eê]ncias|checklist|requisitos|perfil pronto|checagem|resumo visual/i;

function extrairCabecalho(linha: string): string | null {
  const limpa = linha.trim();
  // Aceita o formato da versão atual (## 1. ...) e relatórios legados (1. ...).
  const match = limpa.match(/^(?:#{2,3}\s+)?(?:\*\*)?(\d{1,2})[.)]\s+(.+?)(?:\*\*)?$/)
    || limpa.match(/^#{2,3}\s+(.+)$/);
  if (!match) return null;
  const titulo = (match[2] || match[1] || '').replace(/\*\*/g, '').trim();
  return PISTAS.test(titulo) ? titulo : null;
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

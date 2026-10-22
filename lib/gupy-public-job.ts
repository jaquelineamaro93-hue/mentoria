/**
 * Extração limitada a páginas públicas de vagas da Gupy.
 * Não utiliza credenciais, APIs internas, login ou contorno de bloqueios.
 */
export type VagaPublica = {
  url: string;
  titulo: string;
  descricao: string;
  origem: 'jsonld' | 'html';
};

export function validarLinkPublicoGupy(valor: string): string {
  if (valor.length > 1400) throw new Error('Link muito longo.');
  let url: URL;
  try { url = new URL(valor.trim()); }
  catch { throw new Error('Informe um link válido de vaga da Gupy.'); }
  if (url.protocol !== 'https:' || url.username || url.password || url.port) {
    throw new Error('Apenas links HTTPS públicos da Gupy são permitidos.');
  }
  const host = url.hostname.toLowerCase();
  if (!/^[a-z0-9-]+(?:\.[a-z0-9-]+)*\.gupy\.io$/.test(host)
    || ['api.gupy.io', 'developers.gupy.io', 'suporte-candidatos.gupy.io'].includes(host)) {
    throw new Error('Use o link da vaga hospedado em um domínio público *.gupy.io.');
  }
  if (!/^\/(?:jobs|job|vagas|vaga)\/[a-zA-Z0-9][a-zA-Z0-9/_-]*\/?$/.test(url.pathname)) {
    throw new Error('Este link não parece apontar para uma vaga individual da Gupy.');
  }
  url.search = '';
  url.hash = '';
  return url.toString();
}

function limparHtml(html: string): string {
  return html
    .replace(/<(?:script|style|noscript|svg|iframe)\b[^>]*>[\s\S]*?<\/(?:script|style|noscript|svg|iframe)\s*>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<\/(?:p|li|div|section|article|h[1-6]|br|ul|ol)>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<').replace(/&gt;/gi, '>')
    .replace(/&quot;|&#34;/gi, '"').replace(/&#39;|&apos;/gi, "'")
    .replace(/&#(\d+);/g, (_m, code: string) =>
      String.fromCodePoint(Math.min(Math.max(Number(code), 32), 0x10ffff)))
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s*\n\s*\n/g, '\n\n')
    .trim();
}

function percorrerEstruturados(json: unknown, profundidade = 0): Record<string, unknown> | null {
  if (profundidade > 9 || !json || typeof json !== 'object') return null;
  if (Array.isArray(json)) {
    for (const item of json) {
      const achado = percorrerEstruturados(item, profundidade + 1);
      if (achado) return achado;
    }
    return null;
  }
  const obj = json as Record<string, unknown>;
  const tipos = Array.isArray(obj['@type']) ? obj['@type'] : [obj['@type']];
  if (tipos.some(x => String(x).toLowerCase() === 'jobposting')) return obj;
  for (const key of ['@graph', 'mainEntity', 'itemListElement']) {
    const achado = percorrerEstruturados(obj[key], profundidade + 1);
    if (achado) return achado;
  }
  return null;
}

export function extrairVagaHtmlGupy(html: string, url: string): VagaPublica | null {
  const scripts = [...html.matchAll(/<script\b(?=[^>]*type\s*=\s*["']application\/ld\+json["'])[^>]*>([\s\S]*?)<\/script>/gi)];
  for (const script of scripts.slice(0, 25)) {
    try {
      const vaga = percorrerEstruturados(JSON.parse(script[1]));
      if (!vaga) continue;
      const titulo = limparHtml(String(vaga.title || vaga.name || '')).slice(0, 200);
      const descricao = [
        vaga.description, vaga.responsibilities, vaga.qualifications,
        vaga.skills, vaga.experienceRequirements, vaga.educationRequirements,
      ].filter(Boolean).map(x => limparHtml(String(x))).filter(Boolean).join('\n\n').slice(0, 11500);
      if (titulo.length >= 4 && descricao.length >= 140) return { url, titulo, descricao, origem: 'jsonld' };
    } catch { /* Ignorar marcação inválida, sem inferir o conteúdo */ }
  }
  // Fallback para vagas com texto renderizado no servidor, nunca para listagens.
  const main = html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)
    || html.match(/<article\b[^>]*>([\s\S]*?)<\/article>/i);
  const titleMatch = html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i);
  if (!main || !titleMatch) return null;
  const titulo = limparHtml(titleMatch[1]).slice(0, 200);
  const descricao = limparHtml(main[1]).slice(0, 11500);
  if (titulo.length < 5 || descricao.length < 280
    || !/requisitos|qualifica[cç][õo]es|responsabilidades|atribui[cç][õo]es|atividades|experi[eê]ncia/i.test(descricao)) {
    return null;
  }
  return { url, titulo, descricao, origem: 'html' };
}

export async function carregarVagaPublicaGupy(raw: string): Promise<VagaPublica> {
  const url = validarLinkPublicoGupy(raw);
  const response = await fetch(url, {
    method: 'GET',
    redirect: 'manual',
    credentials: 'omit',
    cache: 'no-store',
    signal: AbortSignal.timeout(7000),
    headers: { Accept: 'text/html' },
  });
  if (!response.ok || response.status >= 300) {
    throw new Error('A página não pôde ser consultada publicamente. Cole a descrição da vaga.');
  }
  if (!(response.headers.get('content-type') || '').toLowerCase().includes('text/html')) {
    throw new Error('A URL não retornou uma página HTML pública.');
  }
  const declared = Number(response.headers.get('content-length') || 0);
  if (declared > 550_000) throw new Error('Página grande demais. Cole a descrição manualmente.');
  if (!response.body) throw new Error('Página sem conteúdo.');
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > 550_000) throw new Error('Página grande demais. Cole a descrição manualmente.');
      chunks.push(value);
    }
  } finally {
    try { await reader.cancel(); } catch { /* ignored */ }
  }
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  const html = new TextDecoder().decode(bytes);
  const vaga = extrairVagaHtmlGupy(html, url);
  if (!vaga) {
    throw new Error('A Gupy não disponibilizou a descrição no HTML público desta vaga. Cole o texto manualmente.');
  }
  return vaga;
}

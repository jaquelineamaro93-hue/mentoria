/** Help discovery must never replace general career coaching. */
export function helpIntent(message: string): 'news' | 'tutorial' | null {
  const value = message.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
  const news = /\b(?:novidades|atualizacoes|releases)\b[\s\S]{0,60}\bsoma\b/.test(value) ||
    /^(?:o que (?:ha|tem) de novo(?: na soma)?|novidades(?: da soma)?|ultimas atualizacoes(?: da soma)?)[?!\.]*$/.test(value);
  if (news) return 'news';
  const asksHow = /(?:tutorial|passo a passo|como (?:usar|utilizar|funciona|acessar|encontrar)|onde (?:fica|encontro|acesso))/.test(value);
  const productContext = /\b(?:soma|central de ajuda|esta ferramenta|essa ferramenta|este recurso|esse recurso|pdi|perguntas[- ]guia|diario de bordo|passaporte soma|mapa quem sou eu|iris)\b/.test(value);
  return asksHow && productContext ? 'tutorial' : null;
}

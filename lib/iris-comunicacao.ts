/**
 * Leitura amigável da Íris, inclusive em mensagens antigas do histórico.
 * Preserva listas Markdown e termos compostos como "pós-graduação";
 * remove somente travessões tipográficos e pontuação excessiva.
 */
export function formatarTextoIris(valor: string): string {
  return valor
    .replace(/(\d)\s*[—–]\s*(\d)/g, '$1 a $2')
    .replace(/(^|\n)[ \t]*[—–][ \t]*/g, '$1')
    .replace(/[—–]/g, ',')
    .replace(/!+/g, '.')
    .replace(/\.{3,}/g, '.')
    .replace(/,{2,}/g, ',')
    .replace(/[ \t]+([.,;:?])/g, '$1')
    .replace(/,\s*([.?:;])/g, '$1')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/[ \t]*\n[ \t]*/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Os chips são SEMPRE respostas enviadas ao chat, não tarefas para executar.
 * Se a IA devolver um verbo no imperativo, reescrevemos do ponto de vista de
 * quem está conversando. Descartamos sugestões longas ou sem sentido.
 */
export function normalizarRespostasRapidas(valor: unknown): string[] {
  if (!Array.isArray(valor)) return [];
  const diretas = /^(?:quero\b|prefiro\b|gostaria\b|pode\b|poderia\b|vamos\b|sim\b|não\b|nao\b|já\b|tenho\b|estou\b|me ajud[ea]\b|preciso\b|acho\b|minha\b|meu\b|ainda\b|vamos\b)/i;
  const imperativas = /^(?:liste|defina|mostre|monte|explique|compare|analise|organize|crie|prepare|revise|sugira|mapeie|identifique|escolha|simule|treine|aponte|traga|descreva|ajude|diga)\b/i;
  const escolhas: string[] = [];

  for (const item of valor) {
    if (typeof item !== 'string') continue;
    const texto = formatarTextoIris(item).replace(/[.?!]+$/, '').trim();
    if (texto.length < 3 || texto.length > 80) continue;
    // Escolhas rápidas não substituem confirmações de ações persistentes.
    if (/\b(?:salvar|salve|cadastre|registrar|automaticamente|sem meu consentimento)\b/i.test(texto) ||
      /\b(?:crie|criar|adicione|adicionar)\b.{0,55}\b(?:pdi|tarefa no plano)\b/i.test(texto)) continue;
    let escolha: string;
    if (diretas.test(texto)) {
      escolha = texto;
    } else if (imperativas.test(texto)) {
      escolha = 'Quero que você ' + texto.charAt(0).toLowerCase() + texto.slice(1);
    } else {
      continue;
    }
    if (escolha.length > 96 || escolhas.some(existente => existente.toLowerCase() === escolha.toLowerCase())) continue;
    escolhas.push(escolha);
    if (escolhas.length === 2) break;
  }
  return escolhas;
}

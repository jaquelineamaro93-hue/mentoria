/**
 * Formata um título de insight de Title Case para Sentence case
 * Exemplos:
 * - "Sua Dinâmica de Energia: Uma Leitura de Forças" → "Sua dinâmica de energia: uma leitura de forças"
 * - "Como Você Opera no Automático" → "Como você opera no automático"
 */
export function formatarTituloInsight(titulo: string): string {
  if (!titulo) return '';
  // Pega a primeira letra em maiúscula e o resto em minúscula
  return titulo.charAt(0).toUpperCase() + titulo.slice(1).toLowerCase();
}

/**
 * Capitaliza apenas a primeira letra de uma string
 */
export function capitalizarPrimeira(texto: string): string {
  if (!texto) return '';
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

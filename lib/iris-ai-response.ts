/**
 * Respostas consultivas da Íris podem chegar em Markdown sem JSON.
 * Recuperar texto natural apenas no chat. Ações persistentes
 * continuam exigindo estrutura JSON validada.
 */
export type RespostaConversacionalIris = {
  resposta: string;
  sugestoes?: string[];
};

export function recuperarTextoLivreIris(texto: string): RespostaConversacionalIris | null {
  const limpo = texto.trim();
  if (limpo.length < 3) return null;

  // Não aceitar JSON malformado como mensagem ao mentorado.
  if (limpo.startsWith('{') || limpo.startsWith('[') ||
      limpo.startsWith(String.fromCharCode(96, 96, 96))) return null;

  // Nunca transformar HTML ou erros de infraestrutura em conselho de carreira.
  if (/^(?:<!doctype|<html[\s>]|<script[\s>])/i.test(limpo)) return null;
  if (limpo.length > 2200) return null;

  return { resposta: limpo };
}

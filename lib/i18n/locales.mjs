/** Locale contract shared by UI, generated content and copilot requests.
 * Language never changes authorization, billing currency or user content.
 */
export const supportedLocales = Object.freeze(['pt-BR', 'es-419', 'en']);
export const localeLabels = Object.freeze({
  'pt-BR': 'Português (Brasil)',
  'es-419': 'Español (Latinoamérica)',
  en: 'English',
});
export function normalizeLocale(value) {
  if (typeof value !== 'string') return 'pt-BR';
  const tag = value.trim().toLowerCase();
  if (/^es(?:-[a-z0-9]{2,8})*$/.test(tag)) return 'es-419';
  if (/^en(?:-[a-z0-9]{2,8})*$/.test(tag)) return 'en';
  return 'pt-BR';
}
export function copilotLanguageInstruction(value) {
  const locale = normalizeLocale(value);
  const language = {
    'pt-BR': 'português brasileiro',
    'es-419': 'espanhol latino-americano neutro; use ustedes, não vosotros, e evite regionalismos da Espanha',
    en: 'inglês claro e natural',
  }[locale];
  return 'Responda em ' + language + '. Use o mesmo idioma nas sugestões e títulos. Preserve nomes próprios, URLs, chaves JSON, identificadores e dados originais. Não presuma país, moeda ou regras trabalhistas pelo idioma. As regras de privacidade, acesso e confirmação continuam obrigatórias.';
}

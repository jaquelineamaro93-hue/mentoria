/** A return destination never grants access; all entitlements are checked separately. */
export function safeSaasNext(value: unknown): string | null {
  if (typeof value !== 'string' || /[\\\u0000-\u0020#]/.test(value)) return null;
  if (value !== '/plataforma' && !value.startsWith('/plataforma?')) return null;
  try {
    const url = new URL(value, 'https://soma.invalid');
    return url.origin === 'https://soma.invalid' && url.pathname === '/plataforma' ? url.pathname + url.search : null;
  } catch { return null; }
}
export function isCheckoutAccessPath(path: string) {
  return ['/ajuda','/novidades','/faq','/contratos','/termos','/login','/magic-login','/reset-password','/checkout','/planos','/renovar','/plataforma','/auth','/api']
    .some(route => path === route || path.startsWith(route + '/'));
}

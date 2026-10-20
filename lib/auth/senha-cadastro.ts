/** Validação local alinhada à política de senhas fortes do Supabase Auth.
 * O servidor continua sendo a fonte final da política e da proteção
 * contra credenciais vazadas ou fáceis de adivinhar.
 */
const SIMBOLOS_PERMITIDOS = "!@#$%^&*()_+-=[]{};'\\:\"|<>?,./`~";

export function requisitosSenha(senha: string) {
  return {
    tamanho: senha.length >= 8,
    minuscula: /[a-z]/.test(senha),
    maiuscula: /[A-Z]/.test(senha),
    numero: /[0-9]/.test(senha),
    simbolo: [...senha].some((c) => SIMBOLOS_PERMITIDOS.includes(c)),
  };
}

export function senhaAtendeRequisitos(senha: string) {
  return Object.values(requisitosSenha(senha)).every(Boolean);
}

export function traduzirErroCadastro(mensagem: string): string {
  const m = mensagem.toLowerCase();
  if (m.includes('already registered') || m.includes('already exists') || m.includes('user already registered')) {
    return 'Esse e-mail já tem uma conta. Entre com sua senha ou use a opção Esqueci a senha.';
  }
  if (m.includes('invalid') && m.includes('email')) {
    return 'O endereço de e-mail não parece válido. Confira a digitação.';
  }
  // A mensagem "should contain at least one character of each" contém
  // "at least": verificar a composição ANTES de mostrar o erro de tamanho.
  if (m.includes('password') && (
    m.includes('should contain') ||
    m.includes('at least one character of each') ||
    m.includes('required characters') ||
    m.includes('missing characters')
  )) {
    return 'Use uma senha com letra maiúscula, letra minúscula, número e símbolo, além de no mínimo 8 caracteres.';
  }
  if (m.includes('password') && (
    m.includes('weak') || m.includes('easy to guess') ||
    m.includes('leaked') || m.includes('pwned')
  )) {
    return 'Essa senha é muito comum ou fácil de adivinhar. Escolha outra, mais difícil de prever, sem reutilizar uma senha antiga.';
  }
  const tamanho = m.match(/password[^.]*at least (\d+) characters?/);
  if (tamanho) {
    return 'Sua senha precisa ter pelo menos ' + tamanho[1] + ' caracteres.';
  }
  if (m.includes('rate limit') || m.includes('security purposes') || m.includes('too many requests')) {
    return 'Houve muitas tentativas seguidas. Aguarde um pouco e tente novamente.';
  }
  return 'Não foi possível criar sua conta agora. Confira os dados ou tente novamente em instantes.';
}

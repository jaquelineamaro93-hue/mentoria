/** Catálogo de preços mensais para novos contratos SOMA Plataforma.
 * Os valores exibidos NÃO alteram contratos vigentes nem o checkout de mentoria.
 * Antes de liberar checkout SaaS, as regras precisam ser usadas no servidor
 * junto aos entitlements, limites de consumo e webhooks validados.
 */
export const BASE_SAAS_CENTAVOS = {
  avulso: 2490,
  essencial: 3490,
  pro: 6990,
} as const;

export type PlanoSaas = keyof typeof BASE_SAAS_CENTAVOS;
export type AdicionaisSaas = { iris: boolean; whatsapp: boolean };

export const ADICIONAL_IA_CENTAVOS = 15000;
export const DOIS_AGENTES_CENTAVOS = 25000;
export const ADICIONAL_MENTORIA_EXISTENTE_CENTAVOS = 5000;

export function calcularPrecoSaas(plano: PlanoSaas, adicionais: AdicionaisSaas) {
  const base = BASE_SAAS_CENTAVOS[plano];
  const add = adicionais.iris && adicionais.whatsapp
    ? DOIS_AGENTES_CENTAVOS
    : adicionais.iris || adicionais.whatsapp ? ADICIONAL_IA_CENTAVOS : 0;
  return { base, adicionais: add, total: base + add };
}

export function formatarReais(centavos: number) {
  return (centavos / 100).toLocaleString('pt-BR', {
    style: 'currency', currency: 'BRL', minimumFractionDigits: 2,
  });
}

export const CATALOGO_SAAS = {
  avulso: {
    nome: 'Módulo avulso', descricao: 'Uma ferramenta à sua escolha, com acesso individual.',
    itens: ['Um módulo selecionado', 'Suas análises e histórico', 'Sem agentes de IA inclusos'],
  },
  essencial: {
    nome: 'SOMA Essencial', descricao: 'Autoconhecimento e evolução profissional no seu ritmo.',
    itens: ['Mapa Quem Sou Eu', 'Diagnóstico e Perfil', 'PDI e crescimento', 'Sem agentes de IA inclusos'],
  },
  pro: {
    nome: 'SOMA Pro', descricao: 'Ferramentas de carreira integradas para sua rotina profissional.',
    itens: ['Todos os módulos SaaS', 'Currículo, LinkedIn e vagas', 'Entrevistas e networking', 'Sem agentes de IA inclusos'],
  },
} as const;

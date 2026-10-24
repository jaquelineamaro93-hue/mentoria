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
/** Compra única opcional, não recorrente. Não deve ser duplicada em contratos
 * humanos nos quais o kit já consta expressamente como item incluso.
 */
export const KIT_ONBOARDING_CENTAVOS = 18990;

export type ModalidadeMentoria = 'nenhuma' | 'grupo' | 'online-1-1' | 'presencial' | 'carreira-completa';

export const MODALIDADES_MENTORIA = {
  grupo: { nome: 'Mentoria em grupo', descricao: 'Trocas e encontros coletivos, com acompanhamento humano.' },
  'online-1-1': { nome: 'Mentoria individual online', descricao: 'Acompanhamento individual de carreira por videochamada.' },
  presencial: { nome: 'Mentoria presencial', descricao: 'Encontros presenciais sujeitos a local e agenda.' },
  'carreira-completa': { nome: 'SOMA Carreira completa', descricao: 'Jornada completa com encontros individuais, coletivos e ferramentas conforme o plano.' },
} as const;

export function calcularResumoSaas(
  plano: PlanoSaas,
  agentes: AdicionaisSaas,
  kitOnboarding: boolean
) {
  const mensal = calcularPrecoSaas(plano, agentes);
  return {
    ...mensal,
    kitAvulso: kitOnboarding ? KIT_ONBOARDING_CENTAVOS : 0,
    estimativaPrimeiroMes: mensal.total + (kitOnboarding ? KIT_ONBOARDING_CENTAVOS : 0),
  };
}


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

/** Recovery discounts apply once to software only. Agents retain full price. */
export const RECOVERY_BASE_CENTAVOS = { avulso: 1990, essencial: 2790, pro: 5590 } as const;
export function calcularRecuperacaoSaas(plano: PlanoSaas, adicionais: AdicionaisSaas) {
 const regular = calcularPrecoSaas(plano, adicionais);
 return { primeira: RECOVERY_BASE_CENTAVOS[plano] + regular.adicionais, recorrente: regular.total };
}

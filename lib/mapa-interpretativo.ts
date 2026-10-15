/**
 * Estrutura da leitura interpretativa do Mapa Quem Sou Eu.
 * Permanece na coluna conteudo_markdown para não alterar tabelas, RLS ou histórico.
 * O bloco de metadados em comentário não aparece no Markdown apresentado.
 */
export type RamoMapa = 'essencia' | 'potencia' | 'resiliencia' | 'energia' | 'direcao' | 'presenca';
export type EixoFluxo = 'essencia' | 'potencia' | 'resiliencia' | 'direcao' | 'presenca';
export type EixoSwot = 'forcas' | 'pontos_atencao' | 'oportunidades' | 'alertas';

export interface MapaInterpretativo {
  versao: 1;
  fonte_hash: string;
  fluxo: Record<EixoFluxo, string>;
  swot: Record<EixoSwot, string[]>;
  mental: Record<RamoMapa, string>;
  prioridades: { agora: string; depois: string };
}

export type AnaliseMapaIA = Omit<MapaInterpretativo, 'versao' | 'fonte_hash'>;

const camposFonte = [
  'valores_crencas', 'momentos_potencia', 'feridas_forca',
  'ciclos_energia', 'chamados_esquecidos', 'presenca_atual',
  'conhecimentos_habilidades', 'paixoes', 'contribuicao'
];

export function assinaturaRespostas(respostas: Record<string, string>): string {
  const fonte = camposFonte.map(campo => campo + ':' + (respostas[campo] ?? '').trim()).join('|');
  let hash = 2166136261;
  for (let i = 0; i < fonte.length; i++) {
    hash ^= fonte.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16) + '-' + fonte.length.toString(16);
}

const eixosFluxo: EixoFluxo[] = ['essencia', 'potencia', 'resiliencia', 'direcao', 'presenca'];
const eixosMental: RamoMapa[] = ['essencia', 'potencia', 'resiliencia', 'energia', 'direcao', 'presenca'];
const eixosSwot: EixoSwot[] = ['forcas', 'pontos_atencao', 'oportunidades', 'alertas'];
const frase = (valor: unknown): valor is string =>
  typeof valor === 'string' && valor.trim().length >= 12 && valor.length <= 650;

export function validarAnaliseMapa(valor: unknown): valor is AnaliseMapaIA {
  if (!valor || typeof valor !== 'object') return false;
  const item = valor as Record<string, unknown>;
  const fluxo = item.fluxo as Record<string, unknown> | null;
  const swot = item.swot as Record<string, unknown> | null;
  const mental = item.mental as Record<string, unknown> | null;
  const prioridades = item.prioridades as Record<string, unknown> | null;
  if (!fluxo || !swot || !mental || !prioridades) return false;
  return eixosFluxo.every(eixo => frase(fluxo[eixo])) &&
    eixosMental.every(eixo => frase(mental[eixo])) &&
    eixosSwot.every(eixo => Array.isArray(swot[eixo]) &&
      (swot[eixo] as unknown[]).length >= 1 &&
      (swot[eixo] as unknown[]).length <= 4 &&
      (swot[eixo] as unknown[]).every(frase)) &&
    frase(prioridades.agora) && frase(prioridades.depois);
}

const titulos = {
  essencia: 'Essência', potencia: 'Potência', resiliencia: 'Resiliência',
  energia: 'Energia', direcao: 'Direção', presenca: 'Presença',
  forcas: 'Forças', pontos_atencao: 'Pontos de atenção',
  oportunidades: 'Oportunidades', alertas: 'Alertas'
};

export function markdownInterpretativo(analise: MapaInterpretativo): string {
  const grupos = [
    '# Sua leitura SOMA',
    'Esta é uma interpretação reflexiva das suas respostas, não uma reprodução literal nem uma avaliação psicológica.',
    '## Síntese da sua história',
    ...eixosFluxo.map(eixo => '**' + titulos[eixo] + ':** ' + analise.fluxo[eixo]),
    '## SWOT de desenvolvimento',
    ...eixosSwot.flatMap(eixo => ['### ' + titulos[eixo], ...analise.swot[eixo].map(item => '- ' + item)]),
    '## Mapa mental de identidade',
    ...eixosMental.map(eixo => '**' + titulos[eixo] + ':** ' + analise.mental[eixo]),
    '## Próximos movimentos',
    '**Mais importante agora:** ' + analise.prioridades.agora,
    '**Pode amadurecer depois:** ' + analise.prioridades.depois,
    '',
    'Os relatos originais continuam salvos no seu questionário.'
  ];
  return grupos.join('\n\n');
}

const MARCADOR = 'SOMA_INTERPRETACAO_V1';

export function serializarMapaInterpretativo(analise: MapaInterpretativo): string {
  return markdownInterpretativo(analise) +
    '\n\n<!-- ' + MARCADOR + '\n' + JSON.stringify(analise) + '\nFIM_SOMA_INTERPRETACAO -->';
}

export function extrairMapaInterpretativo(conteudo: string | null | undefined): MapaInterpretativo | null {
  if (!conteudo) return null;
  const inicio = conteudo.indexOf('<!-- ' + MARCADOR + '\n');
  if (inicio < 0) return null;
  const dadosInicio = inicio + ('<!-- ' + MARCADOR + '\n').length;
  const dadosFim = conteudo.indexOf('\nFIM_SOMA_INTERPRETACAO -->', dadosInicio);
  if (dadosFim < 0) return null;
  try {
    const valor: unknown = JSON.parse(conteudo.slice(dadosInicio, dadosFim));
    if (!valor || typeof valor !== 'object') return null;
    const objeto = valor as Record<string, unknown>;
    if (objeto.versao !== 1 || typeof objeto.fonte_hash !== 'string' ||
        !validarAnaliseMapa(objeto)) return null;
    return objeto as unknown as MapaInterpretativo;
  } catch {
    return null;
  }
}

export function limparMetadadosMapa(conteudo: string): string {
  const indice = conteudo.indexOf('<!-- ' + MARCADOR + '\n');
  return indice < 0 ? conteudo : conteudo.slice(0, indice).trim();
}

// Gera o prompt usado para transformar as 20 seções do Meu PDI em um plano
// estruturado (diagnóstico + pilares SMART + roadmap + ações). Segue o mesmo
// padrão de REGRAS_DE_ESTILO já usado no restante da IA da plataforma.
//
// IMPORTANTE para quem for integrar: troque o import abaixo pelo caminho real
// de REGRAS_DE_ESTILO no projeto (hoje vive em lib/prompts.ts).
import { REGRAS_DE_ESTILO } from "./prompts";

export type RespostaSecaoPDI = {
  codigo: string;
  titulo: string;
  resposta: string;
};

export function montarPromptGeracaoPDI(params: {
  nomeMentorado: string;
  cargoAtual?: string | null;
  respostas: RespostaSecaoPDI[];
  contextoAdicional?: string | null;
}) {
  const { nomeMentorado, cargoAtual, respostas, contextoAdicional } = params;

  const hoje = new Date();
  const dataAtualFormatada = hoje.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  const anoAtual = hoje.getFullYear();
  const anoSeguinte = anoAtual + 1;

  const blocoRespostas = respostas
    .filter((r) => r.resposta && r.resposta.trim().length > 0)
    .map((r) => `### ${r.titulo}\n${r.resposta.trim()}`)
    .join("\n\n");

  return `${REGRAS_DE_ESTILO}

A data de hoje é ${dataAtualFormatada}. Todo prazo, data e período do roadmap que você gerar
precisa ser no futuro a partir de hoje — nunca use datas de anos anteriores a ${anoAtual}.
Este ciclo de plano cobre aproximadamente de ${anoAtual} a ${anoSeguinte}.

Você é a mentora de carreira lendo o workbook de PDI (Plano de Desenvolvimento Individual)
que ${nomeMentorado}${cargoAtual ? `, ${cargoAtual},` : ""} acabou de preencher, seção por seção.
Sua tarefa é transformar essas 20 respostas soltas em um plano claro e objetivo, do jeito que
uma mentora experiente devolveria para a pessoa: sem enrolação, com caminho prático.
${
  contextoAdicional
    ? `\nAlém do PDI, você também tem acesso ao histórico dessa pessoa em outras etapas da mentoria
(Mapa Quem Sou Eu, Diagnóstico VIA, Bússola de Posicionamento). Use isso para tornar o diagnóstico
mais preciso e os pilares mais coerentes com quem essa pessoa já mostrou ser, não só com o que ela
escreveu nas 20 seções do PDI.\n\n${contextoAdicional}\n`
    : ''
}
Respostas do mentorado, seção por seção:

${blocoRespostas}

Devolva o plano em FORMATO ESTRUTURADO (não JSON), seguindo exatamente este padrão:

=== DIAGNÓSTICO ===
SÍNTESE: [2 a 4 frases sobre quem é essa pessoa]
CONFLITO: [1 a 2 frases sobre o principal nó a destravar, ou VAZIO se não houver]
ALERTAS: [lista de frases curtas separadas por |]

=== EQUAÇÃO ===
[uma frase curta que resuma o eixo do plano, ou VAZIO]

=== PILAR 1 ===
NOME: [nome curto, ex: Inglês executivo]
ESPECÍFICO: [meta específica]
MENSURÁVEL: [como medir]
ALCANÇÁVEL: [é possível?]
RELEVANTE: [por que importa?]
TEMPORAL: [prazo, ex: 31-12-2024 ou VAZIO]
AÇÃO 1: [título] | [descrição]
AÇÃO 2: [título] | [descrição]
[... mais ações se houver ...]

[REPITA PARA CADA PILAR]

=== ROADMAP ===
[período, ex: jan-2024]: [foco principal]. Marcos: [marcos separados por ponto]
[próximo período]: [foco]. Marcos: [marcos]
[... mais períodos ...]

=== ALERTAS ===
[tipo, ex: Travamento]: [cor: vermelho/amarelo/azul] | [descrição]
[... mais alertas ...]

REGRAS:
- Escreva tudo em português, na segunda pessoa, direto para ${nomeMentorado}
- Gere entre 3 e 6 pilares. Cada pilar com 2 a 5 ações concretas e verificáveis
- O roadmap cobre ${anoAtual} a ${anoSeguinte}
- Não invente dados que não foram mencionados
- Nada de jargão tipo "sinergia", "empoderar", "destravar potencial"
- Nunca use travessão (—)`;
}

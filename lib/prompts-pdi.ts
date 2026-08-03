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
}) {
  const { nomeMentorado, cargoAtual, respostas } = params;

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

Respostas do mentorado, seção por seção:

${blocoRespostas}

Devolva SOMENTE um JSON válido (sem markdown, sem texto antes ou depois), no formato exato abaixo.
Escreva tudo em português, na segunda pessoa, direto para ${nomeMentorado}. Nada de jargão de
mentoria genérico: cada frase precisa vir de algo que a pessoa efetivamente escreveu nas respostas.

{
  "diagnostico": {
    "sintese": "2 a 4 frases sobre quem é essa pessoa a partir do que ela escreveu",
    "conflito_central": "1 a 2 frases sobre o principal nó a destravar neste ciclo, ou null se não houver um claro",
    "alertas_sobrecarga": ["frase curta de risco 1", "frase curta de risco 2"]
  },
  "equacao": "uma frase curta tipo fórmula que resuma o eixo do plano, ou null",
  "pilares": [
    {
      "titulo": "nome curto do pilar (ex: Inglês executivo)",
      "meta_smart": {
        "especifico": "...",
        "mensuravel": "...",
        "alcancavel": "...",
        "relevante": "...",
        "temporal": "data ou prazo"
      },
      "acoes": [
        { "titulo": "ação concreta e curta", "descricao": "1 frase de contexto", "prazo": "AAAA-MM-DD ou null" }
      ]
    }
  ],
  "roadmap": [
    { "periodo": "ex: ${hoje.toLocaleDateString("pt-BR", { month: "short" })}-${anoAtual}", "foco": "foco principal do período", "marcos": "marcos de entrega, separados por ponto" }
  ],
  "alertas": [
    { "tipo": "curto, ex: Travamento autoral", "cor": "vermelho | amarelo | azul", "descricao": "o que observar e o que fazer quando aparecer" }
  ]
}

Regras de conteúdo:
- Gere entre 3 e 6 pilares. Cada pilar precisa ter entre 2 e 5 ações concretas, verificáveis (a pessoa
  precisa conseguir marcar como feita ou não feita sem ambiguidade).
- O roadmap cobre o ciclo inteiro em blocos de 1 a 3 meses.
- Não invente certificações, cursos ou números que a pessoa não mencionou. Se faltar dado para um
  campo, escreva null em vez de inventar.
- Nunca use travessão (—). Nunca use jargão tipo "sinergia", "empoderar", "destravar potencial",
  "jornada de transformação".`;
}

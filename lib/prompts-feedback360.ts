import { REGRAS_DE_ESTILO } from './prompts';

export type Feedback360PromptInput = {
  rodada: {
    titulo: string;
    objetivo: string | null;
  };
  perguntas: Array<{ id: string; pergunta: string }>;
  respondentes: Array<{
    referencia: string;
    cargo_funcao: string | null;
    empresa_contexto: string | null;
    relacao_label: string;
    convivencia_label: string;
    respostas: Array<{ pergunta: string; resposta: string }>;
  }>;
  autopercepcao: {
    momento_carreira?: string | null;
    objetivos?: string | null;
    forcas_declaradas?: string[];
    via_top5?: string[];
    resumo_perfil?: string | null;
  };
};

export function montarPromptFeedback360(input: Feedback360PromptInput): string {
  const respondentes = input.respondentes
    .map((r) => {
      const cabecalho = [
        r.referencia,
        r.cargo_funcao,
        r.empresa_contexto,
        r.relacao_label,
        `convivência ${r.convivencia_label}`,
      ]
        .filter(Boolean)
        .join(' · ');

      const respostas = r.respostas
        .map((item, index) => `${index + 1}. ${item.pergunta}\nResposta: ${item.resposta}`)
        .join('\n\n');

      return `### ${cabecalho}\n${respostas}`;
    })
    .join('\n\n');

  const forcasDeclaradas =
    input.autopercepcao.forcas_declaradas?.join(', ') || '(não informado)';
  const viaTop5 = input.autopercepcao.via_top5?.join(', ') || '(não informado)';
  const resumoPerfil = input.autopercepcao.resumo_perfil
    ? input.autopercepcao.resumo_perfil.slice(0, 2800)
    : '(não disponível)';

  return `Atue como uma mentora de carreira da SOMA especializada em leitura de percepção 360.

${REGRAS_DE_ESTILO}

Sua tarefa é transformar uma rodada de feedback externo em uma leitura útil para diagnóstico de perfil e desenvolvimento profissional.

REGRAS DE ANÁLISE:
- Nunca trate uma opinião individual como verdade sobre a pessoa.
- Considere recorrente apenas um tema sustentado por pelo menos 2 respondentes diferentes.
- Uma única menção deve aparecer como percepção isolada ou ponto para observar.
- Diferencie competência percebida de comportamento demonstrado.
- Não invente intenção, emoção, diagnóstico psicológico ou causa.
- Use "pode indicar", "sugere", "vale observar" quando a evidência for interpretativa.
- Não use o nome da pessoa que respondeu na síntese. Identifique pela função/relação, por exemplo "Tech Lead, liderança indireta".
- A convivência alta dá mais contexto, mas não transforma uma opinião em fato.
- Se não houver amostra suficiente para uma conclusão, diga isso explicitamente.
- Quando comparar percepção externa com autopercepção, trate divergências como hipótese de investigação, não como contradição definitiva.
- No máximo 2 prioridades de PDI.
- Não use travessão.

RODADA:
Título: ${input.rodada.titulo}
Objetivo: ${input.rodada.objetivo || '(não informado)'}

AUTOPERCEPÇÃO DISPONÍVEL:
Momento de carreira: ${input.autopercepcao.momento_carreira || '(não informado)'}
Objetivos: ${input.autopercepcao.objetivos || '(não informado)'}
Pontos fortes declarados: ${forcasDeclaradas}
Top 5 VIA: ${viaTop5}
Resumo de perfil existente:
${resumoPerfil}

FEEDBACKS EXTERNOS:
${respondentes}

Responda SOMENTE com JSON válido neste formato:
{
  "resumo": "síntese de 3 a 5 frases sobre a percepção externa",
  "forcas_recorrentes": [
    {
      "tema": "nome curto do padrão",
      "contagem": 2,
      "leitura": "o que a convergência sugere",
      "evidencias": [
        {
          "fonte": "cargo e relação, sem nome",
          "sinal": "paráfrase curta da evidência"
        }
      ]
    }
  ],
  "desenvolvimento_recorrente": [
    {
      "tema": "nome curto",
      "contagem": 2,
      "leitura": "leitura de desenvolvimento sem transformar em defeito",
      "evidencias": [
        {
          "fonte": "cargo e relação, sem nome",
          "sinal": "paráfrase curta"
        }
      ]
    }
  ],
  "percepcoes_isoladas": [
    {
      "tema": "ponto citado por apenas uma pessoa",
      "fonte": "cargo e relação, sem nome",
      "leitura": "por que vale observar sem concluir"
    }
  ],
  "pontos_cegos": [
    {
      "tema": "possível ponto cego",
      "leitura": "hipótese sustentada pelo conjunto",
      "base": "quais evidências sustentam a hipótese"
    }
  ],
  "autopercepcao_vs_externa": [
    {
      "tema": "tema comparado",
      "tipo": "convergencia|tensao|hipotese",
      "leitura": "como percepção externa e autopercepção se relacionam"
    }
  ],
  "prioridades_pdi": [
    {
      "titulo": "prioridade objetiva",
      "por_que": "por que vale desenvolver",
      "acao": "comportamento observável para praticar"
    }
  ],
  "confianca_leitura": "alta|media|baixa",
  "observacao_amostra": "limitação da leitura considerando quantidade e diversidade de respondentes"
}

LIMITES:
- forcas_recorrentes: até 5 itens
- desenvolvimento_recorrente: até 4 itens
- percepcoes_isoladas: até 4 itens
- pontos_cegos: até 3 itens
- autopercepcao_vs_externa: até 4 itens
- prioridades_pdi: exatamente 2 quando houver evidência suficiente; se não houver, 1
- evidencias: até 3 por padrão
- frases curtas para leitura em tela
`;
}

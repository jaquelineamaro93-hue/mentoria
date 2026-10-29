type OpcoesGeracao = { exigirCompleta?: boolean };

export async function chamarClaude(prompt: string, maxTokens = 2000, opcoes: OpcoesGeracao = {}): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY não configurada. Adicione essa variável de ambiente para habilitar a geração de insights.');

  // Uma única tentativa adicional, com mais espaço. Nunca concatena versões
  // potencialmente repetidas nem salva uma análise interrompida como completa.
  const signal = opcoes.exigirCompleta ? AbortSignal.timeout(105_000) : undefined;
  for (let tentativa = 0; tentativa < 2; tentativa++) {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      signal,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: tentativa === 0 ? maxTokens : Math.min(maxTokens * 2, 16000),
        messages: [{ role: 'user', content: prompt }],
      }),
    });
    if (!response.ok) {
      throw new Error('Não foi possível gerar a análise agora. Tente novamente em instantes.');
    }
    const data = await response.json();
    const texto = (data.content ?? [])
      .filter((c: { type: string; text?: string }) => c.type === 'text')
      .map((c: { text: string }) => c.text).join('');
    if (!opcoes.exigirCompleta) return texto;
    if (data.stop_reason === 'max_tokens' && tentativa === 0) continue;
    if (data.stop_reason !== 'end_turn' || !texto.trim()) {
      throw new Error('A análise ficou incompleta e não foi salva. Tente novamente com uma vaga por vez ou um material mais objetivo.');
    }
    return texto;
  }
  throw new Error('Não foi possível concluir a análise. Tente novamente.');
}

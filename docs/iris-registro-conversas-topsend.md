# Registrar na SOMA as conversas da Íris hospedada na TopSend

## Situação atual

A TopSend permite receber o gatilho de mensagens enviadas pela SOMA, mas o suporte informou que ainda não oferece webhook/API de saída para devolver automaticamente conversas e respostas de seu agente de IA. Não existe sincronização automática com o Supabase no momento.

## Como registrar hoje

1. No painel privado da SOMA, abrir **Administração → Acompanhamento Inteligente** (`/admin/acompanhamentos`).
2. Localizar o mentorado correto e abrir **Histórico e próximos passos da Íris**.
3. Clicar em **Registrar conversa da Íris na TopSend**.
4. Colar uma transcrição de WhatsApp/TopSend contendo hora, data e remetente. A interface identifica o próprio mentorado pelo primeiro nome e reconhece Íris/Lume/SOMA como a assistente. Para nomes ambíguos, substituir o remetente por `Mentorado` ou `Íris` antes de salvar.
5. Conferir a prévia das mensagens e, opcionalmente, registrar **Insight** e **Próximo passo combinado**.
6. Salvar. A SOMA guarda a origem manual, a data original e a direção de cada mensagem, com proteção contra importação duplicada.

Exemplo fictício:

```text
[16/10/2026, 16:45] Mentorado: Vou revisar duas vagas de CRM.
[16/10/2026, 16:46] Íris: Qual delas faz mais sentido para sua experiência?
```

Para registrar apenas uma mensagem, selecionar o autor, informar a data/hora e colar somente o texto. O sistema não envia nada para o WhatsApp ao registrar.

## Segurança e transparência

- Apenas administradores autenticados podem importar.
- A importação identifica e exige um mentorado com número de WhatsApp cadastrado.
- Conversas são armazenadas na tabela RLS `iris_mensagens_importadas`, com `canal='topsend'` e `registrado_por='importacao_manual_topsend'`.
- Mensagens continuam restritas ao histórico administrativo já existente, sem simular eventos externos autenticados.
- A prévia mostra se cada mensagem pertence ao mentorado ou à Íris; remetentes desconhecidos devem ser identificados antes de importar.
- O backend aceita no máximo 50 mensagens e 5.000 caracteres por mensagem por lote, com horários ISO e fusos válidos.
- Mensagens repetidas com mesmo usuário, direção, horário e conteúdo não são reinseridas.
- A importação não inicia respostas, não altera consentimento, não dispara um gatilho TopSend nem envia dados ao Manus.
- Insights e próximos passos são registrados apenas quando informados pela administração, preservando o histórico anterior.

## Para automatizar no futuro

Quando a TopSend disponibilizar webhook de conversas, API de listagem/exportação ou outro conector oficial, implementar um job de sincronização com identificadores de mensagens estáveis, validação de origem e controle incremental. Nunca simular mensagens automaticamente a partir de gatilhos de envio; o gatilho não contém a resposta gerada pelo agente interno da TopSend.

Para integração unidirecional de disparo, ver [TopSend: webhook de automações](./soma-topsend-webhook-integracao.md).
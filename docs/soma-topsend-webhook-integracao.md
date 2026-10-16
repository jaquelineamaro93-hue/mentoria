# SOMA Mentoria + Íris + TopSend: Automação por Webhook

## Decisão técnica confirmada pela TopSend em 16/10/2026

O suporte informou: IA e integração → Automações → Criar automação → Gatilhos → Webhook. A TopSend gera uma URL para receber eventos do sistema da SOMA. O fluxo low-code conecta esse gatilho a um nó de **enviar mensagem**. O número empresarial em coexistência já está conectado ao painel TopSend e não precisa de nova ligação.

**Importante:** a URL gerada pela TopSend não é um endpoint da SOMA e não é pública para outras pessoas. Não enviar credencial por chat, não expor em NEXT_PUBLIC_. A automação só fica habilitada quando o operador configurar e validar o fluxo.

## Direção SOMA → TopSend → WhatsApp

1. No painel TopSend, criar uma automação com gatilho Webhook, vinculada ao número empresarial da SOMA (11 95956-1795), e um nó seguinte 'Envio de mensagem'.
2. No gatilho, conferir os campos que chegam em JSON. Mapear o destinatário usando `telefone`, nome usando `nome` e o texto **dinâmico** do nó de envio usando `mensagem`. Não criar texto fixo adicional: o conteúdo da Íris já é uma mensagem completa.
3. O backend SOMA envia `POST` para a URL gerada, via HTTPS e `Content-Type: application/json`:

```json
{
  "nome": "Nome",
  "telefone": "5511999999999",
  "mensagem": "Texto personalizado produzido pela SOMA e Íris",
  "referencia_soma": "SOMA_IRIS_IDENTIFICADOR_UNICO",
  "origem": "soma_mentoria",
  "tipo": "acompanhamento_iris"
}
```

4. A TopSend decide se inicia e envia o WhatsApp conforme as regras de janela, templates e conexão. **HTTP 2xx confirma só o acionamento do gatilho; não comprova mensagem enviada, entregue nem lida.**
5. Na Vercel da SOMA, configurar como segredos de produção `TOPSEND_AUTOMATION_WEBHOOK_URL` (URL gerada no painel) e `TOPSEND_AUTOMATION_ENABLED=true` somente após testar o mapeamento com número autorizado. O URL é validado para hostname HTTPS `topsend.io` ou subdomínio (caso a URL oficial venha de outro domínio, revisar essa validação antes de habilitar; não desligá-la indiscriminadamente).
6. Painel SOMA → Acompanhamentos → Histórico e próximos passos da Íris → 'Enviar pela TopSend' aciona cada rascunho histórico **uma única vez**, com confirmação explícita no navegador. A SOMA só permite contatos com consentimento, assinatura ativa/trial elegível, sem pausa e dentro de janela conservadora de 23 horas desde a última resposta. Não tenta reenvio automático quando há erro ou timeout.

## Direção WhatsApp/TopSend → SOMA → Íris (confirmar suporte técnico)

A TopSend confirmou apenas o webhook de **entrada na automação** e um nó de envio. Isso NÃO confirma ainda um webhook de mensagens recebidas de volta à SOMA. Perguntar ao suporte se existe gatilho 'Mensagem recebida' com nó **HTTP Request** que faça POST para URL externa.

Se houver, criar esse segundo fluxo e utilizar o endpoint da SOMA:

`POST https://somamentoria.com/api/webhooks/topsend`

Cabeçalho HTTP obrigatório `x-soma-webhook-secret: <SEGREDO_PRIVADO_DE_24_OU_MAIS_CARACTERES>`, igual a `TOPSEND_INBOUND_SECRET` da Vercel.

Mapear os campos do gatilho recebido da TopSend para este JSON contratado pela SOMA:

```json
{
  "evento": "mensagem_recebida",
  "id_evento": "identificador_unico_estavel_da_mensagem",
  "telefone": "5511999999999",
  "mensagem": "Resposta enviada pelo contato no WhatsApp",
  "data_hora": "2026-10-16T10:05:00-03:00"
}
```

O retorno aceita apenas mensagens de texto de contatos existentes e consentidos. `id_evento` é obrigatório para evitar duplicidade; não gerar novo ID a cada tentativa de webhook. Mensagens antigas podem ser armazenadas, mas não geram resposta tardia. Pedidos PARAR/SAIR/STOP desativam autorização e pausam a Íris. Todos os eventos aceitos são armazenados em `topsend_eventos_recebidos`, protegidos por RLS. O sistema dispara a fila da Íris e registra próximos passos, sem replicar dados completos de mentorados ao agente externo.

Se não existir ação HTTP de saída, solicitar à TopSend uma API documentada de listagem de mensagens (cursor por data/ID), com autenticação, limite e payload real, e somente então implementar sincronização periódica. **Não inventar endpoints da TopSend.**

## Banco de dados e estados

- `topsend_despachos`: turnos reservados, gatilhos acionados e resultados incertos. `turno_id` UNIQUE impede duplo disparo.
- `topsend_eventos_recebidos`: respostas únicas (ID da mensagem), data original, telefone e usuário identificado.
- `iris_turnos`: status `disparado` significa *gatilho TopSend aceito*, não entrega; outros status preservados.
- `iris_proximos_passos`/`iris_estado`: mantém decisões da Íris e jornada do mentorado.
- `iris_mensagens_importadas`: histórico de 15/10 trazido manualmente do WhatsApp Business, preservado e nunca confundido com eventos de API.
- `iris_mensagens_enviadas`: exclusivamente Meta Cloud API existente; não inserir IDs falsos da TopSend nesta tabela.

## Critérios para considerar integrado

1. URL de webhook TopSend gerada pelo painel e secretamente configurada na SOMA.
2. Automação com número correto e mapeamento de telefone/nome/mensagem validado com contato de teste autorizado.
3. Gatilho aceito HTTP 2xx e recebimento real confirmado no WhatsApp (teste end-to-end).
4. Mensagem recebida de volta via fluxo HTTP ou API TopSend confirmada e autenticada.
5. Resposta salva uma vez no Supabase, Íris produz próximo passo, SOMA aciona novo gatilho na janela permitida.
6. Registros mostram corretamente acionado, enviado, entregue ou lido apenas quando cada evidência existir.

## O que ainda falta

**Do painel TopSend:** URL real do webhook gerado em Automações, confirmar o formato/campos do nó de mensagem, e a capacidade de fazer chamadas HTTP de saída quando o contato responder. Não é necessário desconectar nem migrar o número.

**Da SOMA:** cadastrar segredos privados Vercel, ativar os flags somente depois do teste e monitorar as primeiras conversas para detectar entregas e respostas duplicadas.

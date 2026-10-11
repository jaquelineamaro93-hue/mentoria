# Conexão da SOMA com a Íris da Cue

O painel `/admin/acompanhamentos` oferece uma consulta de conexão restrita aos administradores. A rota GET `/api/admin/cue` valida a sessão no Supabase e o campo `profiles.is_admin` antes de consultar a API do Manus.

Configuração privada do servidor na Vercel:

* `MANUS_API_KEY`: chave da conta Manus que contém a Íris. Nunca usar `NEXT_PUBLIC_`, inserir a chave no código ou compartilhar em chats.
* `MANUS_AGENT_ID`: ID exato da Íris retornado pela consulta. Não selecionar automaticamente pelo nome nem usar o agente padrão.

Depois de cadastrar a chave como segredo de produção e publicar uma nova versão, use “Verificar conexão com a Íris”. A consulta lista os nomes e IDs disponíveis, sem ler conversas. Cadastre o ID correto e publique novamente para verificar o vínculo.

Esta alteração apenas verifica a conexão. Não processa respostas de WhatsApp, não encaminha dados de mentoradas, não inicia tarefas no agente, não integra o retorno ao banco e não habilita envio automático. Essas etapas dependem da conexão real validada e de um fluxo de aprovação explícita. O WhatsApp Business no celular permanece dependente de onboarding com coexistência.

Fonte: https://open.manus.im/docs/v2/agents-overview
Contrato da consulta: https://open.manus.ai/docs/v2/agent.list

Validação local: `node tests/manus-connection.cjs`, `npx tsc --noEmit` e ESLint nos novos arquivos. Os testes utilizam uma API simulada, sem credenciais reais.

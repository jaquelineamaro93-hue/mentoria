# SOMA Plataforma: checkout e acesso por produto

Implementação de 24/10/2026. Substitui a etapa de vitrine comercial do SaaS descrita no documento de 21/10, sem declarar auditoria externa ou pentest completo.

- `/plataforma`: seleção autenticada, teste gratuito sem cartão, assinatura mensal pelo Mercado Pago, consulta de status, retomada de checkout e cancelamento.
- Trial SaaS de 7 dias, uma vez por conta. Configuração imutável durante o teste. Nenhuma cobrança é criada pelo botão de teste. A assinatura escolhida durante um teste tem início da cobrança após o término desse teste.
- A assinatura não altera `profiles.plano_id`, pagamentos, prazos ou trial da mentoria. Pedidos SaaS e eventos financeiros têm domínio separado.
- Preço é calculado no servidor e conferido no banco. Autorização de cartão não concede acesso pago. Aprovação, estorno e cancelamento são processados por notificações assinadas e recursos consultados na API do provedor.
- Permissões são aplicadas no Proxy, nas rotas de IA existentes e em políticas RLS restritivas, além do filtro visual dos menus. O fallback legado não se aplica às contas que optaram pelo SaaS.
- Clientes SaaS acessam apenas os módulos e agentes selecionados. Kit Onboarding e acompanhamento humano continuam separados. Contratos vigentes de mentoria permanecem independentes.
- Uma assinatura/checkout em andamento por conta. Lock de criação, retomada e consulta por referência externa antes de recuperar uma tentativa com timeout.

## Migrações

1. `20261024021618_soma_saas_checkout_trial_access.sql`
2. `20261024022538_soma_saas_community_rpc_boundary.sql`

Aplicadas no projeto Supabase `mentoria-soma`. As funções de cobrança e concessão só podem ser executadas por `service_role`. Contas autenticadas podem ler apenas sua própria conta e seus pedidos.

## Verificação

- Build Next.js e TypeScript.
- 36 testes de código: assinatura de webhook, payload alterado, fluxo da mentoria, concessão SaaS, isolamento de módulos, navegação e preços.
- `tests/saas-database.sql`: usuários sintéticos em transação com ROLLBACK. Duração e repetição do trial, pagamento, duplicidade, estorno, evento antigo, grants de funções e RLS real no papel authenticated para mapa, PDI, currículo e gravações.
- Nenhuma cobrança real foi efetuada para homologação. Não se afirma teste de pagamento real nem pentest completo.

## Configuração de produção

Reutiliza `MERCADOPAGO_ACCESS_TOKEN`, `MERCADOPAGO_WEBHOOK_SECRET`, `SUPABASE_SERVICE_ROLE_KEY` e URL pública do projeto. O webhook da conta Mercado Pago precisa continuar apontando para `/api/mercadopago/webhook`, incluindo eventos de assinaturas e cobranças autorizadas.

Referências: https://www.mercadopago.com.br/developers/pt/reference/online-payments/subscriptions/create-preapproval/post e https://supabase.com/docs/guides/database/postgres/row-level-security.

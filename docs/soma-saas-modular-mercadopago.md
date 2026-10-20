# SOMA SaaS / EdTech: arquitetura modular

Data: 20/10/2026. Status: arquitetura implementada com ativação comercial gradual.

## Modelo de dados

| Tabela | Responsabilidade |
|---|---|
| profiles (legado) | Identidade e vigência do plano de Mentoria. |
| planos_mentoria (legado) | Planos existentes de Mentoria e suas condições. |
| mp_pedidos / mp_eventos (legado) | Pedidos e pagamentos já existentes, sem refatoração destrutiva. |
| soma_modules | Catálogo de módulos com slug, rota, preço, controle de acesso e estado da oferta. |
| soma_module_orders | Pedido individual, preço congelado em BRL, preapproval_id, versão e data do aceite. |
| soma_module_subscriptions | Assinatura por módulo e seus estados, última cobrança, vigência paga, cancelamento. |
| soma_module_payment_events | Ledger idempotente por pagamento do Mercado Pago. |
| soma_user_module_access | Concessões pontuais e datadas por módulo, separadas de cobranças. |

Status: PENDING, ACTIVE, PAST_DUE, CANCELED e EXPIRED. Uma assinatura ACTIVE não autoriza o acesso se sua vigência paga já venceu.

## Hierarquia de acesso

1. Usuário não autenticado: páginas protegidas exigem login.
2. Módulo inexistente ou desabilitado: negar.
3. Administrador: permitir.
4. Mentoria vigente e não pausada: ALL_ACCESS, inclusive a novos módulos cadastrados no futuro.
5. Trial dentro dos 7 dias: preservar acesso à experiência de teste.
6. Módulos antigos com controle desativado: manter os acessos atuais durante a migração.
7. Concessão manual válida e ativa daquele módulo: permitir.
8. Assinatura daquele módulo ACTIVE com paid_through no futuro: permitir.
9. Demais: negar e exibir assinatura.

Não existe flag is_mentee permanente: o direito integral depende de perfil com plano associado, status ativo, data de vencimento e ausência de pausa. Evita que o default status_assinatura=ativo conceda ALL_ACCESS a uma conta Free.

Camadas de autorização: Supabase PostgreSQL com RLS restritivas nos registros dos módulos, RPC soma_has_module e soma_can_access_module_for, plus proxy Next.js que mapeia rotas e ações de API a slugs. As políticas de propriedade do usuário continuam válidas.

## Integração Mercado Pago

O cliente nunca envia preço, email ou userId para criar compras. O endpoint /api/modulos/assinar obtém usuário por sessão autenticada, módulo e preço do banco, valida rate limit, aceite do contrato modular e cria pedido com valor congelado.

A preapproval mensal é criada como PENDING. O link de retorno ao site não comprova pagamento. A ativação depende de cobrança APPROVED consultada na API oficial Mercado Pago.

O webhook atual /api/mercadopago/webhook mantém HMAC com MERCADOPAGO_WEBHOOK_SECRET e consulta os recursos MP antes de reconciliar. O ramo modular separa-se da RPC processar_mp_pagamento, que permanece destinada ao legado.

Eventos configurados no Mercado Pago:
- subscription_preapproval: acompanha status, cancelamento e suspensão da assinatura; authorized por si só NÃO concede acesso.
- subscription_authorized_payment: consulta cobrança, preapproval e pagamento; valida IDs, preço e moeda BRL, ativa módulo somente após pagamento approved.
- payment: só atualiza pagamentos modulares previamente vinculados pela cobrança da assinatura, incluindo estornos/chargebacks.

Pagamento repetido não acrescenta tempo; reembolso ou cobrança contestada bloqueia o módulo envolvido. Notificações antigas não reativam assinaturas canceladas. Cancelamento pelo usuário exige resposta confirmada da API Mercado Pago, e não afeta outros módulos nem a Mentoria.

Documentação oficial:
- https://www.mercadopago.com.br/developers/pt/docs/subscriptions/additional-content/your-integrations/notifications/webhooks
- https://www.mercadopago.com.br/developers/pt/docs/subscriptions/integration-configuration/subscription-no-associated-plan/authorized-payments
- https://www.mercadopago.com.br/developers/pt/docs/subscriptions/subscription-management

## Endpoints e interface

- /modulos: catálogo público, estados de acesso, contratação e cancelamento separados.
- /modulos/condicoes: condições específicas de cobrança modular (versão modular-1.0).
- /api/modulos/assinar: checkout autenticado e com aceite.
- /api/modulos/cancelar: cancelamento verificado pelo provedor.
- /admin/modulos: preço mensal e ativação de proteções e vendas, apenas administradores.
- /api/admin/modulos: atualização de oferta validada pelo servidor.
- lib/modules/routes.ts: associação declarativa das páginas e principais APIs aos módulos.
- lib/modules/access.ts: helpers de autorização para Server Components e endpoints.
- components/modules/ModuleAccessBadge.tsx: estados visuais Inclusive na Mentoria, Acesso ativo, Trial, Pendente ou Bloqueado.

Gravações em grupo, Diário de Bordo, feedback de sessões, encontros exclusivos e agendamento 1:1 não são itens avulsos vendidos pelo catálogo: continuam benefícios da Mentoria.

## Checklist de lançamento comercial

1. Migrações e código instalados. Todos os nove módulos começam sem preço e com o checkout e o gate desativados.
2. No ambiente de teste do Mercado Pago, configurar e validar assinatura mensal de UM módulo. Confirmar os três tópicos webhook, HMAC e https://somamentoria.com/api/mercadopago/webhook.
3. Testar usuário sem plano, trial ativo/expirado, Mentoria vigente, vencida e pausada, compra de N módulos, pagamento recusado e posterior aprovado, evento duplicado, cancelamento, estorno e expiração.
4. Revisar políticas de RLS, storage e endpoints de cada ferramenta antes de ativar seu gate.
5. Revisar juridicamente as condições de assinatura e cancelamento modular antes de cobrar o público.
6. Abrir /admin/modulos: configurar preço, habilitar o controle de acesso, validar navegação e então marcar venda ativa.
7. Monitorar conciliação e pagamentos pendentes após o primeiro lançamento.

Testes no código: tests/mercadopago-security.test.cjs e tests/soma-modules-security.test.cjs. Teste SQL transacional no Supabase também foi executado com ROLLBACK, cobrindo ativação por pagamento, duplicação, preço divergente, estorno, cancelamento e notificação tardia.

## Decisões de compatibilidade

- Não migrar nem cancelar planos antigos automaticamente.
- Módulos futuros são incluídos na Mentoria automaticamente pela regra de ALL_ACCESS, sem editar contratos existentes.
- Acesso de módulo individual não dá acesso à área VIP ou às gravações de grupo.
- A cobrança só inicia depois de configuração explícita do preço e da oferta.
- EXPIRED é aplicado efetivamente pela comparação da vigência com o relógio, mesmo quando a coluna de status ainda estiver ACTIVE; pode-se adicionar um processo de normalização de status futuramente.
- O catálogo inicial serve de base técnica. Preços, copy comercial e ofertas precisam ser aprovados antes da ativação.

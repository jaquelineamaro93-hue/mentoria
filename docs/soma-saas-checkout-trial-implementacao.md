# SOMA Plataforma: implementação do checkout e isolamento de acesso

## Decisão de produto (23/10/2026)

- O botão do SaaS deve finalizar a assinatura pelo Mercado Pago, sem solicitação pelo WhatsApp.
- A compra e a gestão de módulos devem aparecer tanto na landing page quanto no portal autenticado.
- SOMA Plataforma e SOMA Mentoria compartilham login, **não** compartilham automaticamente benefícios, sessão humana, autorização de API ou status de pagamento.
- **Todo plano SaaS elegível tem teste gratuito de 7 dias**, independente do trial de mentoria. Um usuário não pode reiniciar o teste trocando o plano ou módulo. Não alterar os campos de trial/assinatura de mentoria para conceder SaaS.
- Adicionais Íris e WhatsApp são permissões independentes; sem contratação, nenhum agente está liberado. Limites de consumo e custos precisam ser impostos no servidor.
- Preços finais e referências de compra devem ser calculados pelo servidor, sem aceitar valor ou identidade do cliente na requisição.

## Entrega inicial nesta branch

`lib/soma-saas-access.ts`: contrato puro de acesso por produto, módulo, adicional, janela de 7 dias e vencimento pago; falha em modo fechado. **Ainda não integrado a rotas, banco ou interface de compra.**

## Implementação necessária antes de cobrar

1. Criar tabelas isoladas de SaaS: catálogo, pedidos, assinaturas, concessões por usuário/módulo e histórico append-only. Policies RLS por `auth.uid()`; proibir updates de status e concessão pelo cliente.
2. Criar função transacional de início de trial SaaS com exclusividade por usuário, bloqueio de concorrência e relógio do banco. Não reutilizar `profiles.status_assinatura` nem `trial_plan_id` da mentoria.
3. Alterar APIs de cada módulo e o caminho de acesso direto ao banco para exigir entitlement correspondente. Negar por padrão e preservar contratos antigos com migração explícita. Revisar especialmente os 9 módulos com `enforce_access=false`.
4. Criar endpoint autenticado que valida produto/módulo contra catálogo no servidor, cria pedido com chave de idempotência e encaminha para Mercado Pago. Não habilitar preço arbitrário, não misturar pedidos de mentoria.
5. Verificar notificação assinada do Mercado Pago e conferir ID do pedido, identidade, moeda, preço, estado e idempotência. Somente pagamento válido concede período pago; tratar vencimento, cancelamento, chargeback e reembolso.
6. Criar área logada **Minha Plataforma** com recursos contratados, trial, próxima cobrança, upgrade e gestão, escondendo benefícios exclusivos de mentoria.
7. Substituir o CTA de WhatsApp da `SomaSaasShowcase` por trial/checkout **somente depois** de funcionarem autenticação, persistência, acesso protegido e cobrança.
8. Homologar com contas separadas: trial SaaS, expirado, SaaS avulso, essencial, pro, assinante de mentoria, cliente com ambos, assinatura cancelada, pagamento repetido, webhook falsificado e tentativa de acesso cruzado.
9. Aplicar migrações e variáveis em ambiente de teste, executar testes E2E e revisão de segurança, então liberar deploy em produção sem tocar arquivos de layout congelados.

## Observação sobre o trial

Sem cobrança antecipada durante os sete dias, não usar assinatura recorrente do Mercado Pago como se fosse trial: ela deve ser criada no momento da conversão (ou com um fluxo específico de autorização explicitamente aceito pelo cliente). Não presumir cobrança automática sem autorização e transparência no checkout.

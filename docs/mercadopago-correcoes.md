# Correções de pagamentos Mercado Pago

Os pedidos agora são persistidos antes de criar a cobrança. Preços, plano e
beneficiário são definidos no servidor. As rotas antigas que recebiam preços
arbitrários usam o contrato de checkout com `planoCodigo` e `formaPagamento`.
O checkout exige uma conta autenticada antes de cobrar; visitantes são
encaminhados ao login. Isso evita cobrar sem um beneficiário verificado.

O webhook usa `data.id` da query para a assinatura, recusa divergência com o
corpo e consulta o recurso no Mercado Pago. Eventos `payment`,
`subscription_preapproval` e `subscription_authorized_payment` são tratados.
Autorizar uma assinatura não concede acesso sem cobrança aprovada.

A função SQL bloqueia a linha do pedido e grava evento, histórico e concessão
em uma transação. Reentregas não duplicam créditos, sessões ou histórico.
Valores e moeda precisam coincidir. Falhas de persistência retornam HTTP 500
para permitir nova entrega. Reembolso/chargeback integral desfaz benefícios;
o saldo de créditos nunca fica negativo. Uma parcela reembolsada não revoga
um pedido com outra cobrança aprovada. Sessões extras ficam registradas em
`mp_sessoes_extras`; reembolsos as marcam como canceladas.

## Implantação pendente

1. Revisar/aplicar `supabase/migrations/20261006190000_mp_orders_atomic.sql`
   primeiro em banco de teste. Nenhuma migração foi aplicada remotamente.
2. Reconciliar cobranças anteriores ao novo registro de pedidos. Não inventar
   beneficiários/valores: comparar referências, preços e recursos com dados
   reais do Mercado Pago. Pedidos desconhecidos retornam 500 e não concedem
   acesso. Não publicar durante cobranças em andamento sem essa reconciliação.
3. Confirmar variáveis `SUPABASE_SERVICE_ROLE_KEY`, `MERCADOPAGO_ACCESS_TOKEN`,
   `MERCADOPAGO_WEBHOOK_SECRET` e `NEXT_PUBLIC_APP_URL` no ambiente de destino.
   O token anteriormente exposto precisa ser revogado; não copiar segredos
   para arquivos rastreados.
4. Configurar webhook HTTPS `/api/mercadopago/webhook` no Mercado Pago com os
   tópicos acima. As preferências também recebem `notification_url` do servidor.
5. Em homologação, testar compra, repetição/concor­rência de notificações,
   falha de banco, cobrança recorrente e reembolso antes do deploy.

Pagamento, convite/criação automática de contas e e-mails reais não foram
executados. O novo fluxo autenticado não cria contas usando o e-mail de um
pagamento. Não há alteração no agendamento de sessões; a concessão fica no
registro do pedido, disponível para integração com o atendimento.

## Verificação local

```bash
node --test tests/mercadopago-security.test.cjs
npm exec tsc -- --noEmit
npm run build
```

Testes SQL executam PostgreSQL isolado com PGlite, sem acessar Supabase:

```bash
npm install --prefix /tmp/mp-db-test --cache /workspace/.npm-cache --no-audit --no-fund @electric-sql/pglite
MP_TEST_PGLITE_PATH=/tmp/mp-db-test/node_modules/@electric-sql/pglite node tests/mercadopago-database.cjs
```

O teste usa fixtures mínimas de schema; a migração ainda precisa ser validada
contra o schema completo de homologação. O lint do CheckoutClient tem um erro
preexistente de `setState` em effect; o lint das rotas de pagamentos passa.

## Estado da publicação em 06/10/2026

Migração 20261006190000_mp_orders_atomic aplicada ao projeto de produção nqmnszottjkmolatzxwt pela Management API (HTTP 201). Confirmadas as três tabelas e execução da função permitida a service_role e negada a authenticated. Não reaplicar a migração sem conferir o catálogo. Código ainda não publicado. Existe uma assinatura anterior a reconciliar antes da troca do webhook. API Mercado Pago retorna HTTP 403 sem corpo neste ambiente, mesmo com segredo observado como pronto; causa não determinada. Não foi criada cobrança.

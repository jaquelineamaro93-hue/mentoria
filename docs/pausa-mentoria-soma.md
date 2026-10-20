# SOMA Mentoria · Pausa programada de até 60 dias

## Regra de negócio

Pausa voluntária para assinantes com plano pago ativo e vencimento conhecido. Limite cumulativo de **60 dias corridos por ciclo de plano**, com confirmação explícita e aceite da cláusula de pausa do termo 2.1. A pessoa pode escolher 1 a 60 dias e antecipar a volta. Em cada conclusão, o contrato ganha **exatamente os dias corridos utilizados**.

Exemplo: contrato vence em 30/11 e pessoa pausa 30 dias, usando todos. Ao finalizar, vencimento passa a 30/12. Se antecipar após 10 dias, passa a 10/12. O prazo não é estendido no início para evitar crédito de dias não utilizados.

**Não modifica cobrança recorrente no Mercado Pago.** Informar claramente antes de confirmar. Não aplicar retroativamente a assinantes sem novo aceite.

## Jornadas

- `/meu-plano`: solicita pausa e antecipação de retorno; termos em `/termos`.
- A SOMA guarda `mentoria_pausas`, `mentoria_pausa_ciclos`, `mentoria_pausa_avisos` com RLS.
- Após confirmação, o portal interrompe participação ativa e direciona à gestão do plano, sem bloquear termo, perfil ou renovação.
- `/api/cron/lembretes` finaliza pausas programadas, prorroga data de vencimento no perfil e prepara e-mails de 7 dias, um dia antes e na retomada.
- O pedido agenda confirmação transacional imediatamente, com fallback cron diário. O SendGrid é um canal existente. O web push não será declarado configurado sem consentimento e chaves VAPID; é projeto complementar.
- Ao pausar, mensagens de inatividade, onboarding, encontro e votação são suspensas. Após retorno, os lembretes gerais têm carência de 7 dias.
- O histórico, o ranking e os Impulsos são preservados. O check-in diário de carreira é suspenso durante a pausa.
- Usuários de teste grátis, admins, inadimplentes ou planos sem vencimento não conseguem solicitar pausa automaticamente.
- Se o plano não tem `data_fim_acesso`, a equipe deve revisar e preencher o prazo correto, sem inferir pela data do cadastro.

## Comunicado geral recomendado, não disparado automaticamente

Enviar **um e-mail apenas** aos participantes ativos elegíveis, após validar a versão 2.1 e o primeiro fluxo de pausa. Explicar o novo benefício, limite, prorrogação e cobranças. O e-mail informa; o aceite individual é registrado na SOMA em `termos_aceites`. Para quem já aceitou a versão anterior, o novo aceite é opcional até solicitar pausa. Se não aceitar, mantém o contrato original.

## Proteção contra estados inconsistentes

A solicitação e a conclusão são transacionais em PostgreSQL, com locks e verificação de elegibilidade. Conclusões repetidas não somam dias duas vezes. O trigger `proteger_campos_sistema_profile` continua bloqueando update direto por mentorado e permite a rotina confiável de finalização alterar a vigência. Os avisos são reservados por chave única por pausa/canal/tipo, sem retentativa cega em caso de incerteza do SendGrid.

## O que validar em produção

1. Termo ativo 2.1 e aceite registrado para um usuário de teste.
2. Solicitar pausa com vencimento cadastrado e confirmar datas no painel.
3. Verificar redirecionamento para `/meu-plano` e suspensão do check-in e lembretes.
4. Concluir antecipadamente e confirmar incremento exato no `data_fim_acesso`.
5. Validar a conclusão automática e os e-mails antes de permitir disparos em massa.
6. Verificar que o Mercado Pago permanece inalterado, e que nenhum termo antigo é apagado.

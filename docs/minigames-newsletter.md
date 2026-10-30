# Novidade dos jogos e envio autorizado

Campanha independente `minigames-20261030`. Template aprovado em `lib/minigames-news-email.ts`, com link individual de descadastro gerado pelo mecanismo já existente. Endpoint administrativo `/api/admin/minigames-news` e painel em Administração → Biblioteca.

A usuária autorizou seguir para todos após revisar o texto da novidade e o HTML. Público: roster vigente `soma_newsletter_recipients`, deduplicado por e-mail confirmado, sem pausas ativas ou descadastro. O número de elegíveis deve ser consultado imediatamente antes do envio. Não usar a lista de contatos pessoais ou de outro projeto.

Reserva única por campanha e usuário antes de enviar, em lotes de 12. Erros ou respostas sem confirmação ficam registrados e não são reenviados automaticamente. Aceite do provedor não comprova entrega na caixa de entrada. A campanha anterior da biblioteca e seus registros permanecem intactos.

Publicação do aviso: `scripts/publish-minigames-news.sql`, idempotente e sem disparo de e-mail. A novidade aponta para um tutorial publicado, disponível a contas autenticadas. O acesso às aulas permanece definido pelos planos existentes.

Validação: testes do template, escape da personalização, substituição do descadastro, acesso administrativo, origem, reserva duplicada, destinatários do roster e aceite/erro do provedor. Nenhum envio real nos testes. Build e verificações do repositório antes do merge.

Backup remoto antes da publicação: backup/pre-minigames-news-20261030, SHA 48f9e1cf4aebf9a5a87e221b446183c623b603ff. A referência Git não é backup integral do banco. Reverter o código somente via PR; arquivar a novidade pelo portal se necessário; preservar os registros de envios para impedir duplicação. E-mails já aceitos não podem ser recolhidos.

# Lançamento da biblioteca: Novidades e newsletter

Solicitação: publicar o lançamento nas Novidades e enviar uma newsletter HTML aos usuários da SOMA. A comunicação informa trilhas, aplicação prática, progresso e 10 Impulsos por conclusão de microaula. Convida a responder ao e-mail para propor uma aula. Não promete bônus por autoria, que não foi implementado.

## Público e privacidade

Fonte autoritativa: profiles vinculados ao auth.users da SOMA. A função exclusiva do backend verifica e-mail confirmado e coincidente, conta não excluída/bloqueada, endereço válido, ausência de padrão explícito de teste, de pausa ativa e de descadastro. A projeção mínima retorna apenas id, nome e email. No momento da preparação, 53 contas elegíveis, sem opt-outs ou pausas ativas.

Não inclui leads anônimos ou listas de outros projetos. Envio individual pelo SendGrid já utilizado pela plataforma, remetente consultoria@camarocrm.com. Destinatários não são expostos entre si. As supressões do provedor permanecem ativas.

Registro atômico reservado antes do envio, único por campanha/usuário e campanha/email. Reservas ou resultados incertos não são reenviados automaticamente. `accepted` indica aceite pelo provedor, não comprovação de entrega na caixa de entrada. A interface mostra os números agregados sem expor e-mails.

## Preferências

Link individual assinado por HMAC com escopo newsletter. GET abre confirmação; somente POST altera a preferência. Não modifica assinatura, acesso ou comunicações essenciais. A rota funciona mesmo para uma conta pausada. Preferências anteriores da régua de trial também são respeitadas na seleção.

## Conteúdo e acionamento

Template com tabelas e CSS inline em lib/biblioteca-news-email.ts. Cores SOMA, tipografia nativa, layout responsivo, preheader, uma ação principal e descadastro no rodapé. Sem pixels próprios, imagens externas, travessões ou exclamações na copy.

A release em soma_help_releases aponta para o tutorial biblioteca-aprender-e-aplicar, público all, com notify=true. A administração tem prévia HTML e comando de envio em lotes de 12, com limite de 20 lotes por clique. Endpoints validam sessão administrativa e origem, sem aceitar destinatários ou corpo fornecidos pelo navegador.

## Recuperação

Backup Git remoto: backup/pre-news-biblioteca-20261029, SHA 630db3a39fdf4a713e28e4c7ceb787284d2fc02e. A referência é do código, não do banco. Migração aditiva soma_newsletter_dispatch versiona tabelas privadas, função de seleção, tutorial e release. RLS sem políticas para clientes é intencional nas tabelas exclusivas do backend; privilégios de authenticated/anon revogados. A função definer fica no schema private, com verificação service_role e concessão de execução apenas para o backend.

Para desfazer código, reverter somente o merge via PR. Preservar os registros de envio e descadastro, sem reset de main, force push ou exclusão de dados. A publicação de release pode ser arquivada pelo administrativo; e-mails aceitos pelo provedor não podem ser recolhidos.

# Central de Ajuda e novidades: publicação e retorno

## Referência preservada antes da publicação

- Repositório: `jaquelineamaro93-hue/mentoria`.
- Base: `497513655a1f83b026e951c12b2c98320c7fdce4`.
- Backup remoto: `backup/pre-central-ajuda-20261024-4975136`.
- Deploy da base com status Vercel `success`: https://vercel.com/mentoria4/mentoria/HeL7S3g7FsPn4RyY1JbTDwxpqVdc
- Publicar por pull request após os testes. Registrar o commit de merge no PR.

O backup é uma referência de código. Não é uma cópia integral do banco ou dos
arquivos. Esta entrega adiciona tabelas e um bucket privado, sem modificar ou
apagar registros de mentorados, PDI, contratos, pagamentos ou conversas existentes.

## Reversão preferida, preservando correções posteriores

1. Criar uma branch a partir da `main` atual.
2. Reverter somente o commit squash deste PR com `git revert <commit-do-merge>`.
   Se a publicação usar merge tradicional, usar `git revert -m 1 <commit-do-merge>`.
3. Abrir um PR de reversão, executar as verificações e publicar o código revertido.
4. Manter as tabelas `soma_help_*`, suas revisões e leituras e o bucket
   `soma-help-private`. Não executar DROP, TRUNCATE, deleção de arquivos ou uma
   migração inversa: os dados editoriais e as novas permissões permanecem seguros.
5. Confirmar login, PDI, Íris, contratos e separação entre SaaS e mentoria.

Não usar force push, reset da `main` ou restauração completa da branch de backup
por cima de alterações posteriores. Isso poderia retirar correções de segurança
ou outras entregas que não pertencem a este PR.

## Reversão imediata do deploy

Se houver falha logo após publicar e nenhuma outra entrega tiver ocorrido,
o deploy anterior identificado acima pode ser a referência de rollback na Vercel.
Confirmar antes o projeto `mentoria`, o commit e os domínios de produção. Em
seguida, alinhar a `main` por PR de reversão, evitando que o próximo deploy
reintroduza o problema. Nunca retirar autenticação ou tornar o bucket público
para tentar recuperar a interface.

## Verificações desta entrega

- Build Next.js com as dependências do lockfile.
- 39 verificações de permissões e validação da central.
- 42 testes existentes de Íris, privacidade, produtos e isolamento de módulos.
- 10 verificações HTTP locais, com usuários e serviços fictícios, cobrindo
  autenticação, central, publicação administrativa, novidades e Íris.
- Leitura direta das novas tabelas negada para `anon` e `authenticated` no banco;
  acesso somente pelas rotas autenticadas do servidor.
- Inspeção visual em navegador e confirmação no ambiente publicado ainda devem
  ser registradas na publicação. Não tratar os testes HTTP como inspeção visual.

Os textos e imagens privados da documentação ficam no banco e no bucket privado.
Não adicionar esses conteúdos a este repositório público ou a bundles do navegador.

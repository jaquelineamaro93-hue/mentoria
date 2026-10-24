# Preservação dos alunos anteriores ao SaaS

Validação em 24/10/2026, sem alterar respostas, documentos, currículo, PDI, conversas, planos, pagamentos ou permissões dos alunos existentes.

- Registro protegido com 50 cadastros anteriores a 24/10/2026 às 00h de São Paulo, sem conversão para SaaS. A tabela é uma proteção de exclusão, não uma migração de produto nem uma nova concessão de acesso.
- A exclusão administrativa só remove uma conta nova vazia. Cadastros anteriores, conteúdo salvo, arquivos e vínculos financeiros bloqueiam o atalho.
- A função SQL valida service_role e administrador, bloqueia a conta do próprio administrador, verifica referências às tabelas de histórico e executa a remoção de conta/sessões em transação. Pedidos pendentes são mantidos sem vínculo com a conta excluída.
- A conta de teste solicitada foi removida. Nenhum pedido financeiro foi apagado.
- Foram comparados fingerprints do conteúdo completo antes e depois: 23 mapas, 143 respostas, 8 planos PDI, 106 ações PDI, 21 currículos e 100 mensagens da Íris. Os fingerprints permaneceram idênticos.
- Teste SQL com fixtures e ROLLBACK: histórico bloqueia exclusão, conta vazia é removida, pedido pendente é retido, administrador é protegido, auditoria é gravada e execução por anon/authenticated é negada.
- Testes da API cobrem autorização, proteção administrativa, bloqueio por histórico, erro de banco e execução exclusiva pelo procedimento protegido.

Não foram criadas ofertas de recuperação, alterados preços ou enviados e-mails nesta validação.

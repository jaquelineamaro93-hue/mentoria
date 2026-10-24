# Íris e navegação administrativa

Base atualizada: b62af83f4ad5d273af2cb571d934a51d4980d1f4.
Backup remoto antes do merge: backup/pre-iris-admin-clean-20261024-b62af83.
Backup inicial: backup/pre-iris-admin-clean-20261024-af9bbc9.

## Comportamento

Íris: Conversar, Ajuda e Histórico em navegação fixa. A Ajuda consulta a API
existente com autenticação e metadados filtrados por acesso; nenhum corpo de
artigo privado é incluído no repositório. Fechar minimiza sem limpar conversa,
rascunho ou fluxo de confirmação do PDI em memória. Nova conversa continua
explícita. Persistência entre sessões depende do consentimento existente.
Sugestões iniciais ficam recolhidas. Mantém expansão, Escape e retorno de foco.

Admin: diretório com busca e três grupos, e navegação secundária recolhida nas
subáreas. Os 11 destinos anteriores permanecem disponíveis. Não altera handlers
de gestão de contas, pagamentos, autorização ou dados.

## Validação

TypeScript, ESLint dos componentes novos/alterados, testes existentes da Central
e verificações de integração. O AdminClient já possui avisos e erros de lint
anteriores nesta base, não causados pela substituição do diretório de atalhos.
Teste do componente real com hooks controlados confirma rascunho preservado ao
minimizar e alternar seção e disponibilidade dos destinos administrativos.
Navegador local indisponível: download automatizado do Chromium falhou, portanto
não há confirmação visual automatizada nem auditoria completa de acessibilidade.
CI de build e isolamento deve passar antes do merge.

## Recuperação

Reverter apenas o squash deste PR com git revert. Não usar reset, force push ou
migração de banco como rollback. A referência Git preserva código e não substitui
backup integral dos dados. Nenhuma migração é necessária nesta entrega.

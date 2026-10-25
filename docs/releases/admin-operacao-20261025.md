# Administração: lista única de acompanhamento

A página inicial repetia pessoas em acompanhamento, ações de conta e papéis. Agora cada pessoa aparece uma vez, com detalhes expansíveis, busca e filtros de atividade, e-mail e onboarding. Ações da conta ficam no contexto da pessoa; papéis e onboarding permanecem em Pessoas e acessos. As 11 áreas administrativas continuam acessíveis. A rota de alteração de papel foi corrigida para a API existente, com tratamento de falhas.

Não há migrações, alterações de políticas, pagamentos ou remoção de registros. A ficha completa com encontros e próximos passos permanece fora desta entrega.

Validação: TypeScript; ESLint dos dois componentes sem erros (aviso preexistente na navegação após impersonação); 146 testes existentes; 47 verificações da ajuda; teste comportamental de filtros, busca, ações e sucesso/rejeição da API de papéis. Build verificado no CI antes do merge. Validação visual autenticada pendente.

Backup remoto: `backup/pre-admin-operacao-20261025-1383160`, commit `1383160026d98820c570c4f9980229b59a5e3fa0`. Para reverter, criar PR revertendo apenas o commit squash desta entrega, preservando mudanças posteriores. Não usar reset/force push ou migração destrutiva. A referência Git não é backup integral do banco.

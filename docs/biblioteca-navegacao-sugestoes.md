# Biblioteca: navegação e sugestões

A biblioteca separa catálogo, navegação das aulas e aplicação. O catálogo oferece cards/lista, busca, categoria e situação; o painel de progresso considera somente atividades acessíveis. Entrar em uma trilha abre a primeira atividade não concluída. O espaço da aula usa lista lateral e seções de conteúdo/materiais e aplicação/conclusão. Vídeos mantêm os provedores e permissões existentes, com alternativa de abrir o Drive em outra aba. Gravações completas não são apresentadas como vídeos curtos nem somadas à estimativa de prática.

O bloco legado de pastas foi retirado da tela e da consulta da página. Os registros originais continuam no banco.

Sugestões ficam visíveis ao autor e à administração. Sessão define o autor; RLS protege a leitura; somente o backend escreve após validar sessão, origem, tamanho dos campos e limite por usuário. O status e a resposta são exclusivos da administração. O acesso administrativo está em Gerenciar biblioteca > Sugestões dos mentorados. Não envia e-mails nem notificações externas. Não há mural público ou exposição de sugestões de outras pessoas.

Referências: materiais de benchmark enviados pela Jaqueline (Engage, catálogo e navegação da aula; Sleekplan, sugestões). Implementação usa React/Next já existentes, sem novas dependências. RLS segue https://supabase.com/docs/guides/database/postgres/row-level-security. Não foi copiado código dos benchmarks.

Validação: build de produção com configuração pública de teste, TypeScript, testes de players/progresso/permissões, navegação/busca/retomada e API de sugestões; teste transacional de isolamento entre dois usuários, bloqueio de anônimos e ausência de escrita direta. Todos os registros do teste transacional foram revertidos. A reprodução do Drive depende também das condições do provedor e do navegador.

Reversão: reverter o PR de interface/API; manter a tabela aditiva para preservar sugestões já recebidas. Backup de código não cobre banco. Nenhuma pontuação ou conclusão existente foi alterada.

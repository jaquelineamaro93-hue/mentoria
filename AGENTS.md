<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Publicação e recuperação

Antes de cada merge ou publicação, preservar o SHA atual em uma branch remota
de backup e registrar no PR o caminho de reversão. Preferir reverter somente a
alteração problemática, preservando correções posteriores de segurança e dados
existentes. Não usar force push, reset da main ou migração destrutiva como rollback.
Registrar os limites do backup: uma referência Git não é um backup integral do banco.

## Biblioteca de habilidades — Claude Code, Codex e ChatGPT

- Use `.agents/skills/biblioteca-de-habilidades/SKILL.md` (Codex) e a cópia idêntica em `.claude/skills/biblioteca-de-habilidades/SKILL.md` (Claude Code) para tarefas recorrentes, criação de skills e correções repetidas. Leia o conteúdo apenas quando for pertinente à solicitação.
- Para ChatGPT com acesso autorizado ao repositório, consulte essas mesmas regras e o guia `CHATGPT_PROJECT_INSTRUCTIONS.md`. Isso não configura automaticamente todos os chats ou instruções globais do ChatGPT.
- Mantenha os dois diretórios e históricos sincronizados após atualizações aprovadas. Nenhum agente aprende ou grava mudanças fora da sessão sem acesso e permissão.
- Essas regras complementam as proteções acima; nunca substituem permissões, limites dos produtos ou validações antes de publicar.

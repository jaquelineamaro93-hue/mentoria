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

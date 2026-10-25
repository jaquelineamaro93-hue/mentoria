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

## Direção de produto, design e engenharia (obrigatória)

> Corte slogans, textos de ajuda e rótulos secundários. Se uma tela precisa deles para fazer sentido, conserte o layout.
>
> Tome sempre a melhor decisão para elevar as três experiências: a do usuário (UX), a do desenvolvedor (DX) e a do agente (AX), sem quebrar nada.

Aplicação prática:
- Priorize hierarquia visual, affordances, navegação, clareza de formulários e estados úteis. Não apague informações essenciais, avisos de privacidade, consentimentos, condições de contratação, acessibilidade ou instruções necessárias para uso seguro. Reestruture essas informações em vez de escondê-las.
- Preserve todos os fluxos funcionais, contratos, limites de produtos SaaS versus mentoria, autenticação, RLS e separação de dados por usuário. Mudanças pequenas, revisáveis, com teste de regressão, acessibilidade, responsividade e rollback seguro.
- Antes de adicionar dependências ou skills de terceiros, avalie licença, manutenção, segurança, compatibilidade e custo. Use referências para aprender, sem executar ou copiar código desconhecido automaticamente.
- Considere três públicos nas decisões: pessoas usuárias (UX: acessibilidade e clareza), equipe de desenvolvimento (DX: previsibilidade e manutenção) e agentes (AX: instruções explícitas, testes determinísticos e limites de permissões).
- Faça revisão de microcopy, contraste, estados de foco, movimento reduzido, componentes mobile, zoom, overflow, nomes extensos, dados ausentes e fluxos de ponta a ponta quando a mudança os afetar.

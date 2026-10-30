# Minigames após vídeos e apresentações

Em Minha jornada → Biblioteca de aprendizagem → aula → Pratique jogando.

Três formatos: associação entre conceitos, ordenação de etapas e decisão em uma situação prática. As atividades usam TypeScript, React e route handlers Node.js do Next.js existente, sem novas dependências de produção.

O editor de microaulas permite adicionar até seis jogos, definir enunciado/itens/explicação, testar localmente e salvar junto com o conteúdo da aula. Os primeiros doze desafios foram preparados para quatro aulas existentes: Mapa quem sou, Carreira e desenvolvimento, Ikigai e Storytelling. Foram escritos a partir do conteúdo textual existente dessas aulas, sem afirmar que são uma transcrição ou análise integral dos vídeos/PPTs.

## Regras preservadas

A sidebar mantém estrutura, seções, links, grupos, recolhimento, atalhos, permissões e interação mobile. Somente cores e fundo botânico mudam em PortalShell.module.css. Folhas são um SVG decorativo sem camada que intercepte cliques.

Jogos são prática complementar, sem cronômetro obrigatório, vidas ou penalização. Ordenação usa botões de 44px, acessíveis por teclado e toque. Retorno explicativo aparece após a tentativa. Pode repetir sem ganhar pontos adicionais. A conclusão da aula continua exigindo a aplicação escrita e a resposta de checagem do fluxo existente. A pontuação e sua idempotência não mudam. Os acertos de jogos ficam somente na sessão do componente; ainda não há histórico persistente por jogo.

## Segurança e banco

Migração aditiva: campo minigames JSONB em soma_learning_lessons. Não apaga conteúdo nem altera planos, progresso, pontos ou políticas RLS. O campo contém gabaritos e não é liberado para SELECT por anon/authenticated. O endpoint da aula valida a sessão e a visibilidade da aula via RLS antes de usar service_role. Entrega itens embaralhados sem os campos de gabarito e explicação. POST /api/aprender/jogo repete a validação, verifica origem e limite de tentativas e confere apenas o gabarito cadastrado no servidor. Resposta informa acerto e explicação após a tentativa; é avaliação formativa, não prova antifraude.

Administração mantém requireAdmin existente. A prévia roda localmente com dados que o administrador já pode editar e não salva progresso.

## Pesquisa e escolha

Consultados dnd-kit (https://github.com/clauderic/dnd-kit) e Pragmatic drag and drop (https://github.com/atlassian/pragmatic-drag-and-drop). Nenhum foi incorporado nem teve código copiado. Para listas de até oito itens, botões nativos de mover e selects satisfazem o fluxo em desktop, teclado e toque sem sensores, dependências ou novas obrigações de licença. Avaliar uma biblioteca de arraste somente se essa interação adicional se tornar necessária.

Next.js: guias de Route Handlers, Server and Client Components e CSS incluídos na versão instalada em node_modules/next/dist/docs. Supabase: https://supabase.com/docs/guides/database/postgres/column-level-security .

## Validação e publicação

Build de produção e TypeScript passaram. Onze testes cobrem conteúdo, três tipos de correção, embaralhamento sem solução inicial, remoção de gabaritos, sessão, acesso, origem, rate limit, erro de leitura e preservação da conclusão/XP existentes. ESLint sem erros. Os avisos restantes de img são anteriores. Testes de interface em navegador real ainda pendentes: o download do Chromium falhou no ambiente com arquivo inválido.

A migração de produção NÃO foi aplicada: a revisão automática exigiu autorização explícita para a mudança no banco e em privilégios de coluna. Publicar os jogos somente depois dessa autorização, migração e validação dos privilégios/conteúdo. O visual botânico é independente da migração.

Backup remoto do código: backup/pre-minigames-botanical-20261030, SHA e4152cf5d5a071997852708e2fe2a8ed989208d1. A referência Git não é backup integral do banco.

Reversão: reverter somente o commit do recurso via PR. Manter a coluna e os conteúdos cadastrados, preservando progresso e pontos. Não usar reset de main, force push ou apagar dados para reverter.

## Correção de escopo: jogos de arcade

A usuária esclareceu que esperava jogos reais como o benchmark Engage, não exercícios em formato de formulário. A implementação passa a incluir caça-palavras e corte de vírus com Canvas 2D.

Caça-palavras: tabuleiro gerado por partida, palavras horizontais/verticais/diagonais, seleção por arraste, toque no começo/fim ou teclado, cronômetro de cinco minutos, pausa, pontuação local, vitória e nova partida. Acentos são normalizados. Algoritmo com tentativas limitadas e fallback garante um tabuleiro válido.

Corte de vírus: objetos em trajetória balística, colisão por segmento (inclusive movimentos rápidos), aliados verdes protegidos, três vidas, pontos, combo, partículas, rastro de corte, som opcional iniciado por interação, pausa e nova partida. Ritmo tranquilo com mais tempo e menor velocidade. Setas movem a mira e espaço corta para uso por teclado.

O objetivo é cortar 12 vírus e reconhecer todos os obstáculos da aula. As palavras e os rótulos variam conforme autoconhecimento, PDI, Ikigai e storytelling. Pontos são somente da partida. Não altera Impulsos, conclusão, contas, permissões nem sidebar. Não copia código, imagens ou áudios proprietários do benchmark; mecânicas equivalentes com arte procedural autoral.

Publicar primeiro o código com suporte aos tipos wordsearch/slice, preservando os tipos anteriores para compatibilidade. Somente após o deployment READY executar scripts/learning-arcade-content.sql, que substitui os jogos iniciais nessas quatro aulas, preservando jogos cadastrados manualmente. Não exige alteração de esquema ou privilégios. O histórico individual por partida continua sem persistência.

Validação: testes de geração do tabuleiro em 100 seeds, fallback, seleção, colisões e validação de respostas; partidas em navegador Chromium em fixture local com os componentes reais. Verificar fluxo de vitória e erro, mouse/toque/teclado, pausa e ausência de overflow. Não confundir fixture local com teste autenticado de produção.

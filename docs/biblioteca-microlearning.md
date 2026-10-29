# Biblioteca de aprendizagem SOMA

Entrada: Minha jornada → Biblioteca de aprendizagem (`/gravacoes`). Administração: `/admin/biblioteca`.

A primeira versão oferece catálogo de trilhas, categorias e busca; módulos e microaulas; leitura, vídeo opcional, material de apoio, exercício de aplicação e pergunta de checagem. Três trilhas autorais iniciais, sete aulas de leitura/prática. Não há vídeos fictícios ou conteúdo de terceiros. Gravações antigas preservadas em seção própria.

## Vídeos e armazenamento

Preferência da usuária: hospedar vídeos não listados no YouTube e incorporar o player no portal, sem copiar os arquivos para a SOMA. Não há upload direto nem contratação de armazenamento/streaming nesta versão. O cadastro também aceita vídeos individuais Vimeo/Drive ou arquivos HTTPS MP4/WebM. Pastas do Drive não são vídeos e suas permissões não foram alteradas.

Links de YouTube não listado são compartilháveis. O acesso à página é validado pela SOMA; não é DRM nem garantia de impedir o compartilhamento do link. Nenhuma promessa de remover a marca ou controles do YouTube. Tempo de vídeo é retomado automaticamente apenas no player nativo; nos embeds a retomada é pela microaula, com progresso salvo na atividade.

## Acesso e progresso

Cursos são exclusivos da mentoria ou também acessíveis pelo módulo contratado definido pela administração. A entrada do catálogo é compartilhada com contas autenticadas; os dados seguem RLS por curso e plano. Rascunhos não são expostos a alunos.

Resposta correta, texto integral e fonte do vídeo não têm permissão SELECT para authenticated. O endpoint entrega o conteúdo somente após validar a aula via sessão e RLS. Progresso é privado por conta; gravações de progresso são exclusivas do backend. Origem e rate limit são verificados.

Conclusão exige resposta correta e aplicação escrita de pelo menos 20 caracteres. É uma checagem formativa, não certificação de competência nem comprovação de tempo assistido. Cada microaula aplicada rende 10 Impulsos uma vez, no ledger existente user_xp e no total existente profiles.pontos_total. Administradores não recebem bônus. RPC é SECURITY INVOKER e executável apenas por service_role. Atualização de progresso e pontuação são atômicas e idempotentes.

## Referências e escolha técnica

Foram consultados Video.js (https://github.com/videojs/video.js, Apache-2.0) e Plyr (https://github.com/sampotts/plyr, MIT). A primeira versão não copia código nem adiciona dependências: usa HTML5 para MP4/WebM e embeds canônicos dos provedores, suficientes para o escopo atual. Plyr informa migração para Video.js; extensões de streaming e DRM exigirão avaliação específica.

Referências primárias: https://developers.google.com/youtube/player_parameters e https://support.google.com/youtube/answer/157177; RLS: https://supabase.com/docs/guides/database/postgres/row-level-security.

## Validação e limites

Build e TypeScript; testes da aplicação e testes de validação de fontes, isolamento do endpoint, resposta incorreta, aplicação vazia e progresso parcial. No banco, nove asserts transacionais verificaram idempotência dos pontos, permissões da RPC/colunas e isolamento entre usuários, com rollback integral do teste. O advisor de segurança não apontou as novas tabelas/função. Existem avisos anteriores do projeto, fora do escopo.

Ainda é necessária conferência visual autenticada e reprodução com um vídeo real cadastrado pela administradora. O ambiente local não conseguiu instalar Chromium (download inválido); isso não é evidência de erro na aplicação.

## Publicação e reversão

Backup remoto do código: backup/pre-biblioteca-20261029, SHA 15a36f6c06a3386bbb852bd0a707feefb886bdaf. A referência Git não cobre o banco. Migração aditiva aplicada: soma_learning_library, com três tabelas, políticas e RPC exclusiva do servidor. Não altera tabelas/arquivos antigos nem apaga registros.

Reverter somente o commit da biblioteca via PR, preservando correções posteriores. Manter as tabelas e os progressos na reversão; não excluir dados, resetar main ou usar force push.

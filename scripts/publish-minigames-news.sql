-- Authorized announcement. Idempotent; no emails are sent by this SQL.
begin;
insert into public.soma_help_articles(slug,title,summary,category,body,audience,requires_iris,feature_path,status,published_at)
values ('minigames-nas-aulas','Terminou a aula? Agora tem jogo.','Caça-palavras e corte de vírus chegaram à Biblioteca de aprendizagem. Veja onde jogar e como funcionam as partidas.','Biblioteca de aprendizagem',
$news$## Terminou a aula? Agora tem jogo.

A Biblioteca de aprendizagem ganhou dois jogos para você explorar os conceitos das aulas.

### Caça-palavras

Encontre as palavras no tabuleiro antes que o tempo termine. Arraste pelas letras ou toque no início e no fim de cada palavra. Você também pode usar o teclado.

### Corte os vírus

Corte os vírus roxos em movimento, preserve os aliados verdes e faça combos. São três vidas e uma missão para cumprir. Se preferir movimentos mais lentos e mais tempo, ative o ritmo tranquilo antes de começar.

## Onde encontrar

Entre em Minha jornada → Biblioteca de aprendizagem. Abra uma das aulas abaixo e escolha “Pratique jogando”.

- Mapa quem sou: aula e diagnóstico
- Carreira e desenvolvimento: encontro completo
- Ikigai: aula completa
- Storytelling: gravação do encontro

Você pode pausar e jogar novamente. As aulas disponíveis seguem o acesso do seu plano. Depois da partida, continue a aplicação prática da aula.

[Escolher minha próxima partida](/gravacoes)
$news$,'all',false,'/gravacoes','published',now())
on conflict(slug) do nothing;
insert into public.soma_help_releases(article_id,title,summary,kind,notify)
select id,'Terminou a aula? Agora tem jogo.','Caça-palavras e corte de vírus chegaram às aulas de Mapa quem sou, Carreira e desenvolvimento, Ikigai e Storytelling. Abra a Biblioteca de aprendizagem e escolha “Pratique jogando”.','new',true
from public.soma_help_articles a where a.slug='minigames-nas-aulas'
and not exists(select 1 from public.soma_help_releases r where r.article_id=a.id and r.title='Terminou a aula? Agora tem jogo.');
commit;

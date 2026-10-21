# SOMA | Interpretação técnica da Gupy (21/10/2026)

## Evidências oficiais verificadas

1. **Um perfil curricular compartilhado.** Em "Como atualizar o meu currículo?", a Gupy informa que mudanças em "Meu currículo" são replicadas a todas as candidaturas ativas. Não orientar o candidato a alternar currículos distintos por vaga na Gupy. O upload de PDF/DOC/DOCX pode auxiliar o preenchimento dos campos, mas não torna a edição desses campos independente para cada inscrição.
   Fonte: https://suporte-candidatos.gupy.io/s/article/Como-atualizar-o-meu-curriculo?language=pt_BR
   Fonte complementar: https://www.gupy.io/blog-do-emprego/curriculo-gupy

2. **Campos por candidatura na API empresarial.** A documentação listing applications do Developer Hub registra job.id (vaga), id (applicationId), status, etapa, score (afinidade do candidato àquela vaga) e matching (resultado do teste de perfil/compatibilidade com a empresa). Essas métricas não devem ser confundidas e não equivalem a uma pontuação global acessível pelo candidato.
   Fonte: https://developers.gupy.io/docs/listing-applications

3. **Ordenação e IA.** Os agentes de IA comparam currículo e dados da candidatura aos critérios da vaga, sob decisões e interações da empresa recrutadora. A ordenação pode mudar. Não inferir acesso da SOMA à pontuação oficial, aos pesos do modelo ou aos comentários privados dos recrutadores.
   Fontes: https://www.gupy.io/blog-do-emprego/como-funciona-a-ordenacao-da-gupy e https://suporte-candidatos.gupy.io/s/article/como-funciona-a-ordenacao-das-candidaturas-em-vagas-de-candidatura-rapida?language=pt_BR

4. **Aprendizado de máquina.** A Gupy descreve o uso de aprendizado de máquina na evolução da Gaia e dos agentes de IA. Analogia com modelos de recomendação (Uber/99) ajuda a explicar classificação dinâmica, mas não comprova compartilhamento de algoritmo, arquitetura, dados ou função objetivo.
   Fontes: https://www.gupy.io/blog/gaia-inteligencia-artificial-gupy e https://www.gupy.io/blog/algoritmos-de-ordenacao

## Observações autorais da SOMA, distintas das fontes oficiais

O Guia GUPY da criadora reúne três anos de testes práticos sobre múltiplas candidaturas na mesma empresa, histórico de likes/dislikes e experimentos de alteração/reorganização de perfil. Esses achados são úteis à metodologia SOMA, mas não significam acesso interno ao modelo, a uma nota global ou validação universal das regras de eliminação. Não desmentir o guia a partir de hipóteses genéricas; não transformar hipóteses em conclusões sobre mecanismos internos privados.

## Regra de produto implementada

- Auditar compatibilidade separadamente para Topaz, Gauge etc. como diagnósticos **por vaga**.
- Criar recomendações de melhoria e **um único currículo global da Gupy**, consistente com a experiência real e outras candidaturas ativas.
- Antes de recomendar alteração, informar o impacto em processos já iniciados.
- Nunca sugerir arquivos CV_Topaz_*.pdf e CV_Gauge_*.pdf como currículos diferentes a anexar em candidaturas Gupy.
- A estratégia de PDFs distintos pode existir em outros canais de candidatura que suportem anexos independentes, sem confundir com a Gupy.
- Texto legado com orientação errada é revisado **apenas na apresentação**. Documentos originais persistidos continuam intactos, sem alteração de dados, migrações ou acessos.
- O servidor também aplica a revisão determinística aos novos resultados antes de salvar para reduzir chance de reintrodução dessa recomendação.

## Segurança e limites da pesquisa

Developer Hub apresenta APIs empresariais, com autenticação e escopo autorizado. A SOMA NÃO fez chamadas à API da Gupy para buscar informações de mentorados. Não há integração com dados internos nem acesso a pontuações, avaliações privadas ou histórico de recrutadores. Não compartilhar credenciais, tentar contornar controles ou declarar que uma nota própria é oficial.

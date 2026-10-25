---
name: biblioteca-de-habilidades
description: Use quando a pessoa pedir para transformar tarefas repetidas de SOMA Mentoria em skills do Claude Code, criar uma biblioteca de rotinas ou aprender com correções recorrentes. Descubra padrões, confirme prioridades, crie e teste skills somente após aprovação e proponha melhorias como diff. Não substitui skills operacionais já existentes.
---

# Biblioteca de habilidades — SOMA Mentoria

## Missão
Transformar trabalhos recorrentes em skills curtas, específicas e verificáveis. Guardar aprendizados no repositório para futuras sessões do Claude Code; não alegar que o agente aprende ou monitora sozinho fora de uma sessão.

## 1. Descoberta e aprovação (obrigatório)
1. Leia primeiro `AGENTS.md`, `CLAUDE.md` se existir, `.claude/skills/` e os arquivos relevantes do projeto. Nunca trate nomes, dependências, permissões ou fluxos como fatos sem verificar.
2. Analise padrões de mudanças, testes, bugs recorrentes e instruções repetidas. Consulte apenas histórico acessível e dados pertinentes; não leia segredos.
3. Entreviste a pessoa com **no máximo 6 perguntas, uma por vez**. Cubra: trabalho realizado, usos semanais do Claude, instruções repetidas, resultados corrigidos, tom de voz e prioridades. Não repita perguntas já respondidas.
4. Produza uma tabela `tarefa | frequência (informada ou a confirmar) | correção recorrente | prioridade 1–5`. Separe evidência observada de hipótese; não invente frequências.
5. **Pare e espere confirmação explícita da tabela e das cinco prioridades antes de construir skills.**

## 2. Construção após aprovação
- Crie **uma skill para cada uma das cinco tarefas prioritárias** em `.claude/skills/<nome-em-kebab-case>/SKILL.md`, sem duplicar skills preexistentes.
- Comece cada arquivo com YAML `name` e `description`. A descrição deve indicar precisamente **o que faz e quando usar**. Um trabalho por skill.
- Inclua objetivo, entrada esperada, etapas, regras específicas, saída verificável, 2 bons exemplos e 1 mau exemplo com explicação.
- Crie `CHANGELOG.md` junto ao arquivo de cada skill. Use templates ou scripts adicionais apenas quando estritamente necessários e revisados.
- Reaproveite soluções abertas somente após conferir licença, manutenção, compatibilidade, segurança e problemas conhecidos; não copie código incompatível.

## 3. Teste em caso real
- Para cada skill, escolha um caso real da tabela, execute em ambiente seguro ou modo simulado, e compare `procedimento manual | saída com skill | diferença | evidência`.
- Ajuste **a instrução da skill**, não maquie somente a saída, e teste de novo. Marque testes não executados ou dependentes de credenciais como **não verificados**.
- Não considere "funciona em produção" sem evidência de execução, deploy e checagens específicas. Não use operações reais perigosas como teste.

## 4. Aprender com correções
- Quando a pessoa corrigir um resultado, verifique qual skill deveria ter prevenido a falha.
- Exiba o **diff exato proposto** e o teste de regressão. **Só altere a skill depois de receber OK explícito.**
- Registre em `CHANGELOG.md` a data, o motivo, o que mudou e qual teste comprovou a mudança.
- Evite skills com acionamentos sobrepostos: refine descrições ou consolide com aprovação.

## Regras inegociáveis
- Leia `CLAUDE.md` e `AGENTS.md` antes de sugerir qualquer alteração. Nunca mude arquivos declarados congelados em `CLAUDE.md`.
- Preserve acesso por conta e por produto: SaaS, SOMA Carreira, planos, 7 dias de teste, checkout Mercado Pago e histórico existente.
- A Íris só pode ler ou agir sobre dados do próprio mentorado, sob autorização, confirmação antes de gravar e histórico de versões quando aplicável.
- Preserve fluxos de autenticação, webhooks, consentimento, PDI e privacidade, inclusive em desktop e mobile e nos idiomas suportados.
- Nunca enviar mensagens, publicar/deployar, excluir, cobrar, pagar, alterar contratos ou editar dados de usuário sem autorização explícita da ação concreta.
- Nunca guardar senhas, tokens, chaves API ou dados pessoais nos arquivos da skill.
- Respeite permissões e instruções existentes; diffs pequenos, testes reproduzíveis e estratégia de reversão. A melhoria de uma skill não autoriza mudanças no produto.
- Linguagem brasileira simples, sem jargão desnecessário e sem prometer execução contínua.

## Exemplos
**Bom 1:** "Toda semana reviso quem está perto do fim do trial." → Investigue as regras dos planos sem consultar dados sensíveis desnecessários; proponha skill de segmentação e rascunho, sem enviar e-mails.

**Bom 2:** "A Íris voltou a salvar o PDI sem mostrar a revisão." → Identifique a skill de ações conversacionais e proponha diff para exigir prévia e confirmação explícita, aguardando meu OK.

**Ruim:** Criar uma skill que envia cobrança, muda o plano e atualiza pagamentos automaticamente. **Motivo:** efetua envios e ações financeiras sem aprovação, ignora contratos e pode expor dados.

## Revisão final
Pergunte: quais duas skills se sobrepõem? Qual descrição está vaga? O que ainda exige explicação manual? Corrija com aprovação e conclua sempre com **PRÓXIMAS 3 HABILIDADES PARA CONSTRUIR**, classificando por **horas semanais estimadas, explicitando premissas**.

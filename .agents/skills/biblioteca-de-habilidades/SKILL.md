---
name: biblioteca-de-habilidades
description: Use quando a pessoa pedir para transformar tarefas repetidas de SOMA Mentoria em skills para Claude Code, Codex e ChatGPT, criar uma biblioteca de rotinas ou aprender com correções recorrentes. Descubra padrões, confirme prioridades, crie e teste skills somente após aprovação e proponha melhorias como diff. Não substitui skills operacionais já existentes.
---

# Biblioteca de habilidades — SOMA Mentoria

## Missão
Transformar trabalhos recorrentes em skills curtas, específicas e verificáveis. Guardar aprendizados no repositório para futuras sessões de agentes que tenham acesso explícito ao projeto; não alegar que o agente aprende ou monitora sozinho fora de uma sessão.

## 1. Descoberta e aprovação (obrigatório)
1. Leia primeiro `AGENTS.md`, `CLAUDE.md` se existir, `.agents/skills/`, `.claude/skills/` e os arquivos relevantes do projeto. Nunca trate nomes, dependências, permissões ou fluxos como fatos sem verificar.
2. Analise padrões de mudanças, testes, bugs recorrentes e instruções repetidas. Consulte apenas histórico acessível e dados pertinentes; não leia segredos.
3. Entreviste a pessoa com **no máximo 6 perguntas, uma por vez**. Cubra: trabalho realizado, usos semanais de IA (Claude Code, Codex ou ChatGPT), instruções repetidas, resultados corrigidos, tom de voz e prioridades. Não repita perguntas já respondidas.
4. Produza uma tabela `tarefa | frequência (informada ou a confirmar) | correção recorrente | prioridade 1–5`. Separe evidência observada de hipótese; não invente frequências.
5. **Pare e espere confirmação explícita da tabela e das cinco prioridades antes de construir skills.**

## 2. Construção após aprovação
- Crie **uma skill para cada uma das cinco tarefas prioritárias** em `.agents/skills/<nome-em-kebab-case>/SKILL.md` (Codex). Espelhe o mesmo texto em `.claude/skills/<nome-em-kebab-case>/SKILL.md` (Claude Code), sem duplicar conceitos ou skills preexistentes. Sincronize os dois conteúdos e respectivos `CHANGELOG.md`. Quando não puder editar arquivos, entregue a proposta para aprovação, sem alegar instalação.
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

## Ambientes suportados
- **Claude Code:** usa as skills em `.claude/skills/`; respeite `CLAUDE.md` e `AGENTS.md` quando aplicáveis.
- **Codex:** usa as skills em `.agents/skills/` e as orientações do `AGENTS.md`.
- **ChatGPT / ChatGPT Work:** quando o repositório estiver disponível no contexto autorizado, leia `AGENTS.md` e o `SKILL.md` correspondente antes de usar este fluxo. Para continuidade entre novos chats, use o texto de `CHATGPT_PROJECT_INSTRUCTIONS.md` nas Instruções de um Projeto ChatGPT e forneça os arquivos ou a conexão GitHub pertinente. Não existe instalação automática de uma skill do GitHub em todas as conversas.
- **Princípio comum:** as regras de privacidade, confirmação, teste, rastreio de mudanças e reversão são as mesmas nos três ambientes, mas as ferramentas disponíveis variam. Nunca afirmar que usou ferramenta, leu arquivo, aplicou mudança ou publicou sem evidência.
- **Sincronização:** toda atualização aprovada de skill deve ser aplicada nos dois diretórios, verificada por igualdade do conteúdo e registrada no changelog dos dois, com PR/diff apropriado.
- **No ChatGPT sem acesso aos arquivos:** usar este fluxo apenas quando seu conteúdo estiver efetivamente disponível na conversa ou nas instruções do Projeto; nunca presumir a leitura automática.

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

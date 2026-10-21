# SOMA | Auditoria de segurança, desempenho e arquitetura SaaS
21/10/2026. **Documento de projeto: não significa homologação de segurança. Não liberar cobranças SaaS nesta fase.**

## Produtos e fronteiras

- Conexão CRM continua totalmente independente da SOMA: usuários, banco, credenciais, permissões, histórico e custos. Só pode compartilhar bibliotecas técnicas do Jev.
- SOMA Plataforma (SaaS) e SOMA Mentoria são ofertas distintas; software pode ser contratado por módulo sem acompanhamento humano. A mentoria inclui apoio humano e ferramentas conforme contrato.
- **Atualmente SaaS e mentoria estão no mesmo projeto Supabase.** Ainda não há bancos fisicamente separados. Não afirmar o contrário.
- Primeira etapa: isolar domínio de cobrança, schemas, ferramentas de IA, tabelas de eventos, escopos, privilégios e RLS por produto e usuário. Se precisar separação física real, migrar o SaaS para **outro projeto Supabase**, com banco, chaves e backups separados, após planejamento de autenticação e custos adicionais. Isso pode exceder os R$ 300/mês de custo fixo informado.

## Achados confirmados

| Nível | Achado | Ação necessária |
|---|---|---|
| P0 | Os 9 registros soma_modules têm enforce_access=false. A função soma_can_access_module_for possui fallback permissivo para esses módulos. | Trocar gradualmente por autorização deny-by-default com testes e preservação de direitos de assinantes legítimos. |
| P0 | pdi_planos e pdi_acoes têm políticas RLS por proprietário, mas ainda não possuem gate restritivo por módulo. | Adicionar e validar gate por desenvolvimento sem bloquear exportação dos próprios dados. |
| P0 | Login mostrava F12 e registrava informações do fragmento da sessão em console. | Corrigido no código de prévia; verificar deploy após revisão. |
| P1 | AcessoGate redireciona no navegador; não é proteção de API. | Entitlement obrigatório em servidor/banco para cada operação. |
| P1 | Íris usa auth.user.id e RLS, sem ferramenta livre de SQL, mas assinatura da confirmação de PDI deriva da chave service role. | Chave exclusiva para assinatura, nonce único, idempotência, transação de aprovação/auditoria/escrita. |
| P1 | product_events permite INSERT pelo próprio usuário autenticado e é uma tabela de analytics. | Não considerar esses registros trilha forense confiável; criar auditoria de segurança server-only, append-only, inacessível ao cliente. |
| P1 | Advisor: 7 SECURITY DEFINER executáveis por anon, sendo 5 funções trigger e 2 funções de feedback 360 com token público. | Revisar individualmente propósito, token, expiração, rate limit e privilégios; não revogar tudo sem avaliação. |
| P1 | Advisor: 20 SECURITY DEFINER executáveis por authenticated. | Auditar parâmetros, ownership, retorno e concessão explícita de EXECUTE. |
| P2 | Advisor performance: 142 alertas auth_rls_initplan; 117 múltiplas políticas permissivas; 33 FKs sem índice; 2 índices duplicados. | EXPLAIN ANALYZE e migrações pequenas com regressão, nunca alterações em massa. |
| P2 | Dashboard fazia muitas consultas sequenciais. | Paralelização de leituras independentes na branch; medir latência real. |

**Não foi realizado pentest nem teste de acesso cruzado com duas sessões de usuários. Não é possível garantir ausência de vulnerabilidades apenas pela leitura do código.**

## Modelo de acesso

1. O backend verifica sessão por auth.getUser e identidade confiável, sem confiar no user_id, papel ou módulo enviados pelo cliente.
2. Resolve elegibilidade em tabela de entitlements por produto, plano, módulo, status pago, trial e vencimento; pausa bloqueia somente os serviços previstos no contrato.
3. Toda consulta de usuário usa auth.uid como filtro, RLS com propriedade e permissões mínimas; não confundir permissões de administrador com Copilot.
4. Nenhum LLM pode receber client Supabase, service_role, query SQL arbitrária nem ferramenta de busca global. A Íris recebe somente funções allowlisted como consultar_meu_progresso, analisar_minha_vaga e propor_acao_pdi.
5. Dados do currículo, conversas, documentos e PDI ficam no escopo do próprio usuário. Uma venda SaaS não permite acessar informações de outras pessoas nem áreas privadas da mentoria. Compartilhamento entre produtos somente com consentimento.
6. Ações são confirmadas pelo usuário e assinadas em HMAC próprio. Verificar token + usuário + recurso + ação + nonce, consumir nonce uma vez e persistir auditoria e operação numa transação.
7. Logs de segurança guardam IDs, ação, produto, sucesso/falha, data, modelo e consumo; sem prompts completos, chaves, URLs com tokens nem currículo.
8. Jev faz roteamento em conteúdo minimizado. O LLM só recebe o contexto autorizado depois do roteamento; não determina permissões.

## Matriz negativa antes de lançar o SaaS

| Teste | Esperado |
|---|---|
| Usuário A fornece ID de usuário B na rota, consulta ou prompt | 403 ou zero linhas; nunca conteúdo de B |
| Anônimo chama Copiloto ou ferramenta privada | 401 sem conteúdo |
| SaaS Currículo tenta PDI ou chat proibido | 403 |
| SaaS expirado altera chamada HTTP para simular pagamento | 403 |
| Mentoria pausada tenta ação exclusiva da mentoria | 403 |
| Prompt injection em currículo tenta mudar ID/SQL/permissão | Nenhuma ferramenta fora do allowlist é chamada |
| Admin conversa com Íris pedindo dados de outros | Negar via Copilot; revisão admin só em trilha separada |
| Mesmo token de aprovação acionado duas vezes | Segunda execução negada ou idempotente |
| Webhook Mercado Pago falsificado/repetido | Assinatura validada; evento duplicado não ativa nova concessão |
| Bypass de UI e chamadas diretas ao Data API | Políticas de banco aplicadas da mesma forma |
| Primeiro login após checkout SaaS avulso | Entra somente nos módulos comprados; sem sessões humanas |

Não ativar enforce_access indiscriminadamente. Primeiro classificar todas as rotas, APIs e tabelas, implementar restrições e validar com dois usuários de teste. Depois, fazer rollout gradual e reversível.

## Preços indicativos, não contratáveis

Benchmark consultado em 21/10/2026:
- Recruta AI R$ 44,90/mês, Talenn R$ 49,90 pagamento único promocional.
- Teal+ US$ 29/30 dias, Rezi US$ 29/mês, Kickresume US$ 24/mês.

Proposta:
- Módulo avulso R$ 24,90/mês, com consumo limitado;
- Essencial R$ 39,90/mês: autoconhecimento, diagnóstico, PDI;
- Pro R$ 69,90/mês: módulos integrados e franquia da Íris Copiloto;
- Mentoria: contrato/planos humanos existentes mantidos independentes.

Com custo fixo informado de R$ 300/mês, seria preciso faturar pelo menos R$ 300 **brutos**: 13 módulos avulsos (R$ 323,70), 8 Essencial (R$ 319,20) ou 5 Pro (R$ 349,50). Essa conta NÃO inclui IA, taxas, impostos, suporte nem margem. Implementar orçamento e créditos por módulo antes do checkout.

## Desempenho

- Login Google/magic link com storytelling leve, sem atraso artificial e respeitando redução de movimento; nenhum F12 nem token nos logs.
- Dashboard com chamadas independentes em paralelo. Medir p75 LCP, INP, CLS e TTFB por tipo de dispositivo.
- Criar melhorias pontuais nas policies e índices somente após medição e EXPLAIN; RLS eficiente também é segurança.
- Metas sugeridas para RUM: LCP p75 até 2,5 s, INP até 200 ms e CLS até 0,1.
- Homologar login, Copilot, cadastro, checkout, PDI e logout em iOS/Android/iPadOS/macOS/Windows com rede lenta, paisagem, zoom e teclado.

## Bloqueios para permitir vendas

1. Perfis de acesso e propriedade testados com duas contas independentes.
2. Payment webhooks assinados e idempotentes; sem marcar status pago a partir do frontend.
3. Revogação, cancelamento, reembolso e vencimento refletidos no backend e no RLS.
4. Auditoria da Íris, tool allowlist, limite de créditos/tokens e logs minimizados.
5. Consentimento/retensão/exportação LGPD revisados.
6. CSP, CORS, rate limiting, scans de dependências, segredos, backups e incident response revisados.
7. Revisão humana de segurança externa antes de afirmar que a aplicação foi auditada completamente.

## Fontes
- https://api-security.owasp.org/editions/2023/en/0x11-t10/
- https://supabase.com/docs/guides/database/postgres/row-level-security
- https://supabase.com/docs/guides/database/functions
- https://www.rezi.ai/pricing
- https://www.tealhq.com/pricing
- https://www.kickresume.com/pt/preco/
- https://recrutaai.ia.br/
- https://talenn.ia.br/precos

## Resultados de teste de isolamento RLS (21/10/2026)

Testes read-only, em transações revertidas (BEGIN/ROLLBACK), simulando o papel Postgres authenticated com identidade não administrativa. Nenhuma resposta individual foi extraída; apenas contagens foram verificadas.

| Área consultada como usuário A com alvo usuário B | Resultado |
|---|---|
| Mapa Quem Sou Eu | Zero linhas de B (PASS) |
| Ações do PDI | Zero linhas de B (PASS) |
| Currículos analisados | Zero linhas de B (PASS) |
| Respostas das perguntas do PDI | Zero linhas de B (PASS) |
| Candidaturas | Zero linhas de B (PASS) |
| Entrevista inicial | Zero linhas de B (PASS) |

Verificações positivas separadas: o proprietário consegue ler seu Mapa e suas ações do PDI; chamada RPC de verificação de módulo com ID de terceiro é rejeitada (PASS).

**Limite:** isso testa uma amostra de tabelas e o RLS, não o login por HTTP de dois usuários, não cobre todas as operações e não cobre prompt injection, função administrativa ou webhooks. Não substitui pentest/QA end-to-end.

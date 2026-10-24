# Inventário de autorização de APIs

Revisão de 24/10/2026. O inventário descreve o controle de cada família. A presença de autenticação não substitui os filtros de propriedade, as políticas RLS e os testes de isolamento. Endpoints públicos de identidade, ativos públicos e convites não exigem uma assinatura paga. Ações de produto exigem validação dentro do handler, além do Proxy.

| Rota | Métodos | Controle |
|---|---|---|
| `/app/api/activity` | POST | Sessão + propriedade/RLS; operação compartilhada de conta |
| `/app/api/admin/acompanhamentos` | POST | Sessão + administração |
| `/app/api/admin/configuracoes-financeiras` | POST | Sessão + administração |
| `/app/api/admin/confirmar-email` | POST | Sessão + administração |
| `/app/api/admin/criar-plano` | POST | Sessão + administração |
| `/app/api/admin/cue` | GET | Sessão + administração |
| `/app/api/admin/delete-user` | POST | Sessão + administração |
| `/app/api/admin/enviar-lembretes` | POST | Sessão + administração |
| `/app/api/admin/gerar-link-impersonacao` | POST | Sessão + administração |
| `/app/api/admin/iris/historico` | GET,POST | Sessão + administração |
| `/app/api/admin/iris/importar-topsend` | POST | Sessão + administração |
| `/app/api/admin/listar-usuarios` | GET | Sessão + administração |
| `/app/api/admin/planos/trial` | PATCH | Sessão + administração |
| `/app/api/admin/preencher-essencia-kariny` | POST | Sessão + administração |
| `/app/api/admin/reset-password` | POST | Sessão + administração |
| `/app/api/admin/topsend/disparar` | POST | Sessão + administração |
| `/app/api/admin/usuarios` | GET,PATCH | Sessão + administração |
| `/app/api/admin/vagas/status` | GET | Sessão + administração |
| `/app/api/admin/vagas/update` | POST | Sessão + administração |
| `/app/api/admin/whatsapp-respostas` | GET | Sessão + administração |
| `/app/api/auth/confirmar-cadastro` | POST | Fluxo de identidade; verificação de posse/estado/limites conforme operação |
| `/app/api/auth/oauth/google/callback` | POST | Fluxo de identidade; verificação de posse/estado/limites conforme operação |
| `/app/api/auth/oauth/linkedin/callback` | POST | Fluxo de identidade; verificação de posse/estado/limites conforme operação |
| `/app/api/auth/reset-password` | POST | Fluxo de identidade; verificação de posse/estado/limites conforme operação |
| `/app/api/auth/send-magic-code` | POST | Fluxo de identidade; verificação de posse/estado/limites conforme operação |
| `/app/api/auth/verify-magic-code` | POST | Fluxo de identidade; verificação de posse/estado/limites conforme operação |
| `/app/api/checkin-mensal` | POST | Sessão + produto: mentorship + propriedade/RLS |
| `/app/api/copiloto/feedback` | POST | Sessão + propriedade/RLS; operação compartilhada de conta |
| `/app/api/copiloto/historico/consent` | POST | Sessão + propriedade/RLS; operação compartilhada de conta |
| `/app/api/copiloto/historico` | GET,DELETE | Sessão + propriedade/RLS; operação compartilhada de conta |
| `/app/api/copiloto/plano-acoes` | GET,POST,PATCH,DELETE | Sessão + produto: iris + propriedade/RLS |
| `/app/api/copiloto` | POST | Sessão + produto: iris + propriedade/RLS |
| `/app/api/cron/iris` | GET | Segredo de cron |
| `/app/api/cron/lembretes` | GET | Segredo de cron |
| `/app/api/diario/analisar` | POST | Sessão + produto: mentorship + propriedade/RLS |
| `/app/api/download-template-vagas` | GET | Material público, sem dados privados |
| `/app/api/entrevista/gerar-soar` | POST | Sessão + produto: entrevistas + propriedade/RLS |
| `/app/api/entrevista/simular` | POST | Sessão + produto: entrevistas + propriedade/RLS |
| `/app/api/extrair-via-pdf` | POST | Sessão + produto: diagnostico + propriedade/RLS |
| `/app/api/ferramentas-soma/analisar` | POST | Sessão + produto: career-tool + propriedade/RLS |
| `/app/api/ferramentas-soma/reanalisar-gupy` | POST | Sessão + produto: curriculo-ats + propriedade/RLS |
| `/app/api/gerar-analise-via` | POST | Sessão + produto: diagnostico + propriedade/RLS |
| `/app/api/gerar-bussola` | POST | Sessão + produto: autoconhecimento + propriedade/RLS |
| `/app/api/gerar-evolucao-via` | POST | Sessão + produto: diagnostico + propriedade/RLS |
| `/app/api/gerar-mapa-essencia` | POST | Sessão + produto: autoconhecimento + propriedade/RLS |
| `/app/api/gerar-resumo-perfil` | POST | Sessão + produto: diagnostico + propriedade/RLS |
| `/app/api/gerar-simulacao-cv` | POST | Sessão + produto: curriculo-ats + propriedade/RLS |
| `/app/api/hero-collage` | GET | Material público, sem dados privados |
| `/app/api/indicacao/resgatar-sessao` | POST | Sessão + produto: mentorship + propriedade/RLS |
| `/app/api/inspecao/status` | GET | Sessão + propriedade/RLS; operação compartilhada de conta |
| `/app/api/inspecao/voltar` | POST | Sessão + propriedade/RLS; operação compartilhada de conta |
| `/app/api/linkedin-content/generate` | POST | Sessão + produto: linkedin + propriedade/RLS |
| `/app/api/mentoria/pausa` | GET,POST | Sessão + propriedade/RLS; operação compartilhada de conta |
| `/app/api/mercadopago/comprar-simulacao-cv` | POST | Sessão + produto: curriculo-ats + propriedade/RLS |
| `/app/api/mercadopago/create-preference` | POST (delegado) | Contratação autenticada, preço do servidor e aceite versionado |
| `/app/api/mercadopago/criar-assinatura` | POST | Contratação autenticada, preço do servidor e aceite versionado |
| `/app/api/mercadopago/sessao-extra` | POST | Sessão + produto: mentorship + propriedade/RLS |
| `/app/api/mercadopago/webhook` | POST | Assinatura/segredo do provedor; identidade conciliada no servidor |
| `/app/api/passaporte/ranking` | GET | Sessão + produto: mentorship + propriedade/RLS |
| `/app/api/pdi/acoes` | PATCH | Sessão + produto: desenvolvimento + propriedade/RLS |
| `/app/api/pdi/gerar-plano` | POST | Sessão + produto: desenvolvimento + propriedade/RLS |
| `/app/api/pdi/reflexao` | POST | Sessão + produto: desenvolvimento + propriedade/RLS |
| `/app/api/percepcao-360/analisar` | POST | Sessão + produto: percepcao-360 + propriedade/RLS |
| `/app/api/perfil/avatar` | POST | Sessão + propriedade/RLS; operação compartilhada de conta |
| `/app/api/perfil/importar-linkedin` | POST | Sessão + propriedade/RLS; operação compartilhada de conta |
| `/app/api/product-events` | POST | Sessão + propriedade/RLS; operação compartilhada de conta |
| `/app/api/public/feedback-360/[token]` | POST | Convite público por token + limite de abuso |
| `/app/api/saas` | GET,POST | Sessão + propriedade + preço e transições no servidor |
| `/app/api/test-sendgrid` | POST | Sessão + administração |
| `/app/api/trial/start` | POST | Sessão; estado do teste; sem conversão SaaS para mentoria |
| `/app/api/trial/state` | GET | Sessão; estado do teste; sem conversão SaaS para mentoria |
| `/app/api/vagas/[id]` | GET,PATCH,DELETE | Sessão + produto: vagas + propriedade/RLS |
| `/app/api/vagas/analisar-fit` | POST | Sessão + produto: vagas + propriedade/RLS |
| `/app/api/vagas/gerar-curriculo` | POST | Sessão + produto: vagas + propriedade/RLS |
| `/app/api/vagas` | GET,POST | Sessão + produto: vagas + propriedade/RLS |
| `/app/api/webhooks/topsend` | POST | Assinatura/segredo do provedor; identidade conciliada no servidor |
| `/app/api/webhooks/whatsapp` | GET,POST | Assinatura/segredo do provedor; identidade conciliada no servidor |

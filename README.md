# Portal do Mentorado — Mentoria SOMA

MVP construído em Next.js 16 (App Router) + TypeScript + Tailwind CSS v4 + Supabase.

## O que já está pronto

- **Autenticação** (`/login`): abas Entrar / Criar Conta, com Supabase Auth
- **Dashboard** (`/dashboard`): header de boas-vindas, mural de avisos, trilha de aprendizado
- **Diagnóstico & Perfil** (`/exercicios`): mapa "Quem Sou", pontos fortes, linha de evolução
- **Diário de Bordo** (`/diario`): anotações por encontro, com botão pronto para plugar um resumo via IA
- Banco de dados Supabase já criado e com RLS configurado (ver abaixo)
- Analytics real com PostHog: login, cadastro, logout, preenchimento de diagnóstico e de anotações do diário já disparam eventos (ver abaixo)

## Analytics (PostHog)

Projeto PostHog: **Soma mentoria** (project id `538119`)

Eventos já instrumentados no código:

| Evento | Onde dispara |
| --- | --- |
| `cadastro_realizado` / `cadastro_falhou` | Tela de login, aba Criar Conta |
| `login_realizado` / `login_falhou` | Tela de login, aba Entrar |
| `logout_realizado` | Botão Sair (sidebar, em qualquer tela) |
| `diagnostico_preenchido` / `diagnostico_falhou` | Ao salvar o mapa Quem Sou em Diagnóstico & Perfil |
| `anotacao_diario_criada` / `anotacao_diario_falhou` | Ao salvar uma anotação no Diário de Bordo |
| `$pageview` | Automático, em toda navegação |

Cada mentorado é identificado no PostHog (`identify`) assim que faz login ou se cadastra, então dá para abrir o PostHog e filtrar por pessoa específica, não só ver números agregados. Para pedir esses insights pela conversa com o Claude, basta perguntar (ex: "quantos mentorados preencheram o diagnóstico essa semana").

Para adicionar novos eventos, importe `posthog` de `@/lib/posthog` e chame `posthog.capture('nome_do_evento', { propriedades })`.

## Banco de dados (já criado)

Projeto Supabase: `mentoria-soma` (`nqmnszottjkmolatzxwt`, região `sa-east-1`)

Tabelas: `profiles`, `diagnostics`, `journal_notes`, `announcements`, todas com Row Level Security habilitado (cada mentorado só acessa os próprios dados).

As credenciais já estão no arquivo `.env.local` incluído neste zip. Se você preferir usar seu próprio projeto Supabase, troque os valores desse arquivo pelos do seu projeto e recrie o schema lá (é só pedir o SQL completo de novo que eu te mando).

## Como rodar localmente

```bash
npm install
npm run dev
```

Acesse `http://localhost:3000`. A raiz (`/`) redireciona automaticamente para `/login` ou `/dashboard`, dependendo se você está autenticada.

## Como subir para o seu repositório GitHub

```bash
git init
git add .
git commit -m "Portal do Mentorado - MVP inicial"
git remote add origin <URL_DO_SEU_REPOSITORIO>
git push -u origin main
```

## Deploy na Vercel

1. Importe o repositório na Vercel
2. Nas configurações do projeto, adicione as variáveis de ambiente (mesmas do `.env.local`):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_POSTHOG_KEY`
   - `NEXT_PUBLIC_POSTHOG_HOST`
3. Deploy

Não precisa mexer em `next.config.ts`, já está configurado corretamente (sem `output: 'export'`, compatível com Server Components e o proxy de sessão).

## Próximos passos sugeridos

- Trocar o link fixo do Google Drive no dashboard pelo link real da pasta de materiais
- Popular a tabela `announcements` com os avisos reais (via SQL Editor do Supabase ou uma tela de admin)
- Conectar o botão "Gerar resumo com IA" no diário a uma chamada real (Anthropic API, por exemplo) em vez do resumo simulado atual
- Ativar confirmação de e-mail e fluxo de recuperação de senha no Supabase Auth (hoje o botão "Esqueci a senha" é só um aviso)

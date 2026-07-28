# 🎯 Portal de Mentoria de Carreira

Portal completo de desenvolvimento profissional e carreira com gamificação, exercícios interativos e rastreamento de progresso.

## ✨ Funcionalidades

- ✅ **Autenticação Magic Link** - Login seguro via email
- ✅ **7 Seções Principais**:
  1. Dashboard - Visão geral do progresso
  2. Encontros - Agendamento de sessões presenciais/online
  3. Exercícios - Mapa de Quem Sou Eu (9 blocos SOMA) + Testes de Personalidade
  4. Diário de Bordo - Log de insights com análise IA
  5. Evolução - Gráficos de desenvolvimento de skills
  6. Passaporte - Sistema de achievements e badges
  7. Loja - Marketplace de pontos e recompensas

- 🎮 **Gamificação** - Pontos, achievements, sistema de recompensas
- 📊 **Visualizações** - Gráficos de progresso e evolução
- 📧 **Email** - Integração SendGrid para magic links
- 🤖 **IA** - Análise de insights do diário com OpenAI

## 🚀 Tech Stack

- **Frontend**: Next.js 16, React 19, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: Neon (PostgreSQL Serverless)
- **ORM**: Drizzle ORM
- **Email**: SendGrid
- **IA**: OpenAI
- **Deploy**: Vercel

## 📋 Pré-requisitos

- Node.js 18+
- Conta Neon (banco de dados)
- Conta SendGrid (emails)
- Conta OpenAI (análise IA)
- Conta Vercel (deploy)

## 🛠️ Setup Local

### 1. Clonar e instalar
```bash
git clone <repo>
cd mentoria
npm install
```

### 2. Configurar `.env.local`
```env
# Database (Neon)
DATABASE_URL=postgresql://user:password@ep-xxxx.us-east-2.neon.tech/neondb

# SendGrid
SENDGRID_API_KEY=SG.xxxxxxxxxxxxx
SENDGRID_FROM_EMAIL=consultoria@camarocrm.com
SENDGRID_FROM_NAME=Mentoria Câmaro

# OpenAI
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxx

# App Config
NEXT_PUBLIC_APP_URL=http://localhost:3000
JWT_SECRET=seu-secret-aleatorio-forte-32-caracteres-minimo
```

### 3. Criar tabelas do banco
```bash
npm run db:push
```

### 4. Rodar em desenvolvimento
```bash
npm run dev
```

Acesse: http://localhost:3000/auth

## 🚀 Deploy no Vercel

### 1. Fazer push para GitHub
```bash
git push origin claude/mentorship-portal-exercises-rvccah
```

### 2. Conectar ao Vercel
1. Acesse [vercel.com](https://vercel.com)
2. Clique "New Project"
3. Selecione seu repositório GitHub
4. Clique "Import"

### 3. Adicionar variáveis de ambiente
No dashboard Vercel, vá para **Settings → Environment Variables** e adicione:
- `DATABASE_URL` - Connection string do Neon
- `SENDGRID_API_KEY` - API Key do SendGrid
- `SENDGRID_FROM_EMAIL` - consultoria@camarocrm.com
- `SENDGRID_FROM_NAME` - Mentoria Câmaro
- `OPENAI_API_KEY` - API Key do OpenAI
- `NEXT_PUBLIC_APP_URL` - URL do seu app no Vercel
- `JWT_SECRET` - Secret para tokens JWT

### 4. Deploy
Clique "Deploy" - Vercel fará tudo automaticamente!

## 📚 Documentação

- `SETUP.md` - Guia completo de setup
- `SENDGRID_SETUP.md` - Configuração de emails
- `DNS_RECORDS.md` - Registros DNS para camarocrm.com
- `ROADMAP.md` - Roadmap de desenvolvimento

## 👤 Mentorados

Os mentorados precisam ser cadastrados manualmente no banco:
```sql
INSERT INTO users (email, name, package, session_type, start_date, end_date)
VALUES ('mentorado@email.com', 'Nome Completo', 'standard', 'hibrido', NOW(), NOW() + INTERVAL '90 days');
```

## 🔐 Segurança

- ✅ Autenticação JWT com expiração
- ✅ Senhas hasheadas (via Neon Auth)
- ✅ HTTPS em produção (Vercel)
- ✅ SSL na conexão com banco
- ✅ Variáveis sensíveis em .env.local (não commitadas)

## 📞 Suporte

Email: consultoria@camarocrm.com

---

**Desenvolvido com ❤️ por Câmaro CRM**

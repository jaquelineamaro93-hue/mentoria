# 📋 Guia Completo de Setup - Portal de Mentoria

Este guia passo a passo vai te ajudar a colocar o portal em produção.

## 1️⃣ Preparar Neon Database

### Passo 1: Criar Conta Neon
1. Acesse [neon.tech](https://neon.tech)
2. Clique "Sign Up"
3. Complete o cadastro (pode usar GitHub)
4. Verifique seu email

### Passo 2: Criar Projeto
1. No dashboard, clique "Create a new project"
2. Dê um nome: `mentoria-carreira`
3. Selecione região: `US East 2` (mais próximo do Brasil)
4. Clique "Create project"

### Passo 3: Copiar Connection String
1. No dashboard do projeto, copie a "Connection string" (a primeira, com `?sslmode=require`)
2. Ela tem o formato: `postgresql://user:password@ep-xxxx.region.neon.tech/mentoria?sslmode=require`

## 2️⃣ Configurar Variáveis de Ambiente

### Criar `.env.local`
Na raiz do projeto, crie um arquivo `.env.local` com:

```env
# Neon Database
DATABASE_URL=postgresql://seu_user:sua_senha@ep-xxxx.us-east-2.neon.tech/mentoria?sslmode=require

# OpenAI (para análise IA de insights)
OPENAI_API_KEY=sk-proj-XXXXXXXXXX

# App Config
NEXT_PUBLIC_APP_URL=http://localhost:3000  # Em produção: https://mentoria.vercel.app
JWT_SECRET=seu-super-secret-key-aleatorio-muito-seguro-32chars-minimo
```

**⚠️ Importante:**
- Nunca commit `.env.local` (já está em `.gitignore`)
- Gere um `JWT_SECRET` forte: `openssl rand -base64 32`

## 3️⃣ Executar Migrações do Banco

### Instalar Dependências
```bash
npm install
```

### Criar Tabelas
```bash
npm run db:push
```

Isso vai criar todas as 12 tabelas no Neon automaticamente.

### (Opcional) Ver Schema no Studio
```bash
npm run db:studio
```
Abre uma UI para visualizar e editar dados diretamente.

## 4️⃣ Cadastrar Mentorados

Como o sistema usa magic links, você precisa cadastrar os mentorados antes.

### Opção A: Via SQL (Neon Console)
1. No dashboard Neon, vá para "SQL Editor"
2. Cole:
```sql
INSERT INTO users (email, name, package, session_type, start_date, end_date)
VALUES 
  ('mentorado1@email.com', 'João Silva', 'standard', 'hibrido', NOW(), NOW() + INTERVAL '90 days'),
  ('mentorado2@email.com', 'Maria Santos', 'premium', 'presencial', NOW(), NOW() + INTERVAL '180 days');
```

### Opção B: Via Node Script
Crie `scripts/seed.js`:
```javascript
const { db } = require('./lib/db/client');
const { users } = require('./lib/db/schema');

const seedUsers = async () => {
  await db.insert(users).values([
    {
      email: 'mentorado@email.com',
      name: 'Nome Completo',
      package: 'standard',
      sessionType: 'hibrido',
      startDate: new Date(),
      endDate: new Date(Date.now() + 90*24*60*60*1000),
    }
  ]);
  console.log('✓ Usuários criados');
};

seedUsers().catch(console.error);
```

Depois rode: `npm run db:seed`

## 5️⃣ Testar Localmente

```bash
npm run dev
```

Acesse: http://localhost:3000/auth

### Fluxo de Teste:
1. Digite o email do mentorado cadastrado
2. Você verá o link de magic link (em dev, é exibido na console)
3. Clique ou copie o link
4. Você será logado e enviado ao dashboard

## 6️⃣ Deploy no Vercel

### Preparar Repositório
```bash
git add .
git commit -m "Configurar portal de mentoria"
git push origin main
```

### Deploy
1. Acesse [vercel.com](https://vercel.com)
2. Conecte sua conta GitHub
3. Selecione o repositório `mentoria`
4. Clique "Import"
5. Preencha as variáveis de ambiente:
   - `DATABASE_URL` (copie do Neon)
   - `OPENAI_API_KEY` (sua chave OpenAI)
   - `JWT_SECRET` (gere um novo)
   - `NEXT_PUBLIC_APP_URL` (URL do seu site Vercel)

6. Clique "Deploy"

Vercel vai:
- ✅ Fazer build automático
- ✅ Rodar migrações do banco
- ✅ Colocar em produção

Pronto! Seu portal estará em `https://mentoria-seu-nome.vercel.app`

## 7️⃣ Configurar Email (Opcional)

Para realmente enviar emails com o magic link:

### Usar SendGrid
1. Crie conta em [sendgrid.com](https://sendgrid.com)
2. Gere uma API Key
3. Adicione ao `.env.local`: `SENDGRID_API_KEY=SG.xxxxx`

4. Modifique `app/api/auth/magic-link/route.ts`:
```typescript
import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// No final da função POST:
await sgMail.send({
  to: email,
  from: 'mentoria@seu-dominio.com',
  subject: 'Seu link de acesso - Mentoria+',
  html: `<a href="${process.env.NEXT_PUBLIC_APP_URL}/auth/verify?token=${token}">Acessar Portal</a>`,
});
```

## 8️⃣ Configurar Domínio Customizado (Vercel)

1. No dashboard Vercel, vá para "Domains"
2. Adicione seu domínio (ex: `mentoria.seu-dominio.com`)
3. Atualize DNS no seu registrador
4. Vercel gera SSL automaticamente

## 9️⃣ Segurança em Produção

### Checklist
- [ ] JWT_SECRET é forte e aleatório
- [ ] Database_URL tem ?sslmode=require
- [ ] OPENAI_API_KEY não está no git
- [ ] HTTPS habilitado (automático em Vercel)
- [ ] Cookies são HTTP-only (já configurado)
- [ ] Validações de entrada estão em place

### Monitoramento
- Ative logs no Vercel: Settings → Logs
- Monitore erros do banco: Neon → Monitoring
- Configure alertas de uptime

## 🔟 Próximos Passos

1. **Criar Dashboard do Mentor** (Jaqueline)
   - Ver lista de mentorados
   - Agendar sessões
   - Ver diários e insights
   - Exportar relatórios

2. **Integração com Google Calendar**
   - Sincronizar sessões agendadas
   - Lembretes automáticos

3. **Sistema de Pagamento**
   - Stripe para cobrar pacotes
   - Controle de acesso por pacote

4. **Email Automático**
   - Notificações pré-sessão
   - Lembretes de exercícios
   - Relatórios semanais

5. **App Mobile**
   - React Native
   - Notificações push
   - Offline-first

## ❓ Troubleshooting

### "Could not connect to database"
- Verifique se o DATABASE_URL está correto
- Teste a conexão no Neon CLI: `neon connection-string`
- Certifique-se que `?sslmode=require` está na URL

### "Magic link não funciona"
- Verifique o JWT_SECRET é igual em dev e produção
- Confirme se o token expirou (tem 24h de validade)
- Revise os logs no Vercel

### "Erro ao enviar email"
- Se usar SendGrid, verifique a API Key
- Confirme se o domínio de envio está verificado
- Ajuste configuração de CORS se necessário

---

**Documentação Completa**: Veja [README.md](./README.md) para detalhes técnicos.

**Suporte**: Entre em contato com Jaqueline Amaro para dúvidas.

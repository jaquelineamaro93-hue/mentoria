# ✅ Checklist de Deployment - Vercel

## 1️⃣ Copiar Variáveis de Ambiente

Abra o arquivo `.env.local` do seu computador e copie EXATAMENTE estes valores:

```
DATABASE_URL=postgresql://neondb_owner:nPR_wi2ocksoWyY7ep-autumn-silence-axjbsk3s-pooler.c-4.us-east-2.aws.neon.tech/neondb
SENDGRID_API_KEY=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
SENDGRID_FROM_EMAIL=consultoria@camarocrm.com
SENDGRID_FROM_NAME=Mentoria Câmaro
OPENAI_API_KEY=[SUA_CHAVE_OPENAI_AQUI]
NEXT_PUBLIC_APP_URL=https://mentoria-seu-nome.vercel.app
JWT_SECRET=seu-secret-forte-aleatorio-32-chars-minimo
```

## 2️⃣ No Vercel - Environment Variables

1. Acesse [vercel.com](https://vercel.com)
2. Selecione projeto "mentoria"
3. Vá para **Settings** → **Environment Variables**
4. Para CADA variável:
   - **Key**: Nome exato (ex: `DATABASE_URL`)
   - **Value**: Cole o valor completo
   - **Environments**: Selecione "Production and Preview"
   - Clique **Add**

### ✅ Variáveis a Adicionar:

| Key | Value |
|-----|-------|
| `DATABASE_URL` | `postgresql://neondb_owner:nPR_wi2ocksoWyY7ep-autumn-silence-axjbsk3s-pooler.c-4.us-east-2.aws.neon.tech/neondb` |
| `SENDGRID_API_KEY` | `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` |
| `SENDGRID_FROM_EMAIL` | `consultoria@camarocrm.com` |
| `SENDGRID_FROM_NAME` | `Mentoria Câmaro` |
| `OPENAI_API_KEY` | *Sua chave do OpenAI* |
| `NEXT_PUBLIC_APP_URL` | `https://mentoria-seu-nome.vercel.app` |
| `JWT_SECRET` | *Chave aleatória forte* |

## 3️⃣ Fazer Deploy

1. Vá para **Deployments** no Vercel
2. Clique **"Deploy"** ou procure por um botão de redeploy
3. Aguarde ~5 minutos
4. Quando terminar, você verá ✅ **Deployment succeeded**

## 4️⃣ Testar

Acesse:
```
https://mentoria-seu-nome.vercel.app/auth
```

Deve aparecer a página de login com o formulário de email! ✨

---

## 🆘 Se Deu Erro:

### Erro: "BUILD FAILED"
- Verifique se `npm run build` funciona localmente
- Verifique se o `DATABASE_URL` está correto

### Erro: "Environment variable not found"
- Verifique os nomes das variáveis (case sensitive)
- Certifique-se que marcou "Production and Preview"

### Erro: "Connection refused"
- DATABASE_URL incorreto
- Neon offline (verifique no [console.neon.tech](https://console.neon.tech))

### Erro ao fazer login
- SENDGRID_API_KEY incorreto
- JWT_SECRET diferente do local

---

**Pronto! Seu portal está em produção!** 🚀

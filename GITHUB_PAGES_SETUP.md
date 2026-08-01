# Ativando GitHub Pages

Os arquivos estáticos estão em `/docs` e prontos para serem publicados.

## Ativar em 30 segundos:

1. Abra: https://github.com/jaquelineamaro93-hue/mentoria/settings/pages
2. Em **"Build and deployment"**, encontre a seção **"Source"**
3. Selecione o dropdown e escolha: **Deploy from a branch**
4. Selecione:
   - **Branch**: `claude/mentorship-portal-exercises-rvccah`
   - **Folder**: `/docs`
5. Clique **Save**

⏳ Aguarde 1-2 minutos e acesse:
**https://jaquelineamaro93-hue.github.io/mentoria/**

---

## Estrutura:

```
/docs
├── index.html           (Home - redireciona para /auth)
├── /auth
│   └── index.html       (Página de Autenticação)
├── /_next              (Assets Next.js)
├── favicon.ico
└── .nojekyll           (Config GitHub Pages)
```

---

## URLs Disponíveis após ativar:

- Home: `https://jaquelineamaro93-hue.github.io/mentoria/`
- Auth: `https://jaquelineamaro93-hue.github.io/mentoria/auth/`

---

## Ambiente Dinâmico (Vercel):

Para backend com APIs e banco de dados, use:
- https://mentoria-pi-taupe.vercel.app/
- https://mentoria-pi-taupe.vercel.app/auth

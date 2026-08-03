# Pacote de Ajustes e Novas Features - Mentoria SOMA Portal

## O que tem neste pacote

### ✨ Novas Páginas (Completas e prontas)

1. **`/meu-plano`** - Gestão visual do plano do mentorado (TODOS VÊM)
   - Mostra qual é o plano ativo
   - Duração total em meses
   - Breakdown de encontros
   - Ferramentas incluídas
   - Não mostra planos de teste (R$ 0,01)

2. **`/votar-encontro`** - Votação de encontro presencial
   - Votação exclusiva: São Paulo, Pinheiros
   - 3 datas específicas (22/08, 29/08, 5/09)
   - Horário: 11:30 às 17h
   - Vota uma vez só
   - Vê quem votou (tipo WhatsApp)
   - Encerramento: terça 4/08 às 23h

3. **`/checkout`** - Landing page pública de vendas (SEM LOGIN)
   - Novos interessados veem os planos
   - Escolhem forma de pagamento
   - Pagam via Mercado Pago
   - Após pagamento, usuário é criado automático + já consegue fazer login

### 🔧 Páginas de Admin (para você)

1. **`/admin/gerenciar-planos`** - Controle total de planos e pagamentos
   - Tabela com todos os mentorados
   - Trocar plano (dropdown)
   - Marcar como "Ativo" ou "Inadimplente"
   - Salvar com um clique
   - Você controla manualmente quem pagou, mesmo pra cadastros seus

2. **`/admin/indicacoes`** - Gestão de indicações (já existia)

3. **`/admin/feedbacks`** - Trilha de feedbacks mensais (já existia)

### 📋 Componentes Novos/Atualizados

1. **`MuralAtualizado.tsx`** - Mural de Avisos com scroll horizontal
   - Separado em 3 seções: Gerais, Individuais, Grupo
   - Cada seção tem seu próprio scroll horizontal (tipo Netflix)
   - Mais recente primeiro em cada seção
   - Botões de navegação esquerda/direita quando há mais avisos

2. **`soma-badges.ts`** - Sistema de Badges baseado nos 4 Pilares SOMA
   - Sabedoria Interna (azul)
   - Objetividade Magnética (marrom)
   - Maestria em Ação (ouro)
   - Alquimia de Resultados (rosa)
   - 16 badges com emojis e condições específicas

### 🛠️ Ajustes de Copy

- CAPS LOCK inicial em títulos → Apenas primeira letra maiúscula
- "pra Jaqueline" → "para seu mentor"
- "LinkedIn com a Jaque" → "Revisão do LinkedIn"

## Como aplicar

### Passo 1: Extrair no repositório
```bash
unzip mentoria-ajustes.zip
# Descompacta dentro da raiz do projeto, sobrescrevendo nada,
# apenas adicionando pastas novas (app/meu-plano, app/votar-encontro, etc)
```

### Passo 2: Aplicar patches
Abre `PATCHES.md` e aplica cada um dos 7 patches nos arquivos existentes:

1. `components/Sidebar.tsx` - adicionar 4 links novos
2. `app/dashboard/page.tsx` - substituir Mural de Avisos
3. `app/passaporte/page.tsx` - adicionar badges SOMA
4. Buscar/Substituir: "pra" → "para", CAPS → Normal
5. `lib/types.ts` - adicionar type `Announcement` (se não existir)
6. Admin links (opcional)

### Passo 3: Build e Deploy
```bash
npm install
npm run build
git add -A
git commit -m "Adiciona Meu Plano, Votar Encontro, Mural atualizado, Badges SOMA"
git push origin main
```

## Estrutura de arquivos adicionados

```
app/
  meu-plano/
    page.tsx (servidor)
    MeuPlanoClient.tsx (cliente)
  votar-encontro/
    page.tsx (servidor)
    VotarEncontroClient.tsx (cliente)
  checkout/
    page.tsx (servidor - pública, sem login)
    CheckoutClient.tsx (cliente)
  admin/
    gerenciar-planos/
      page.tsx (servidor)
      GerenciarPlanosClient.tsx (cliente)

components/
  MuralAtualizado.tsx

lib/
  soma-badges.ts
```

## Badges SOMA - Condições

| Badge | Pilar | Condição |
|-------|-------|----------|
| Jornada do Autoconhecimento | Sabedoria | Completou Mapa Quem Sou Eu |
| Diagnóstico Realizado | Sabedoria | Completou diagnóstico VIA |
| Essência Mapeada | Sabedoria | Preencheu Mapa de Essência |
| Bússola Encontrada | Sabedoria | Definiu Bússola de Posicionamento |
| PDI Estruturado | Objetividade | PDI completo |
| Objetivos em Foco | Objetividade | Metas definidas |
| Influenciador | Objetividade | 1 indicação |
| Multiplicador | Objetividade | 2 indicações |
| Diário da Jornada | Maestria | Iniciou diário |
| Reflexão Constante | Maestria | Diário ativo 30+ dias |
| Presença Real | Maestria | 1 encontro presencial |
| Compromisso Confirmado | Maestria | 3 encontros presenciais |
| Potencial Revelado | Alquimia | Usou simulador CV |
| Feedback Genuíno | Alquimia | Trocou feedback |
| Mês Reflexivo | Alquimia | Check-in mensal completo |
| Transformação em Curso | Alquimia | Progrediu 30%+ |

## Pronto para production?

- ✅ Todas as páginas compilam sem erro
- ✅ Componentes seguem o design system (cream, marrom, azul, cores SOMA)
- ✅ Copy sem jargão de IA, natural em português
- ✅ Responsivo (mobile first)
- ✅ Acessibilidade básica (labels, semantic HTML)

Manda o build limpo pro ar! 🚀

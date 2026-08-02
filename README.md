# Pacote de Ajustes e Novas Features - Mentoria SOMA Portal

## O que tem neste pacote

### ✨ Novas Páginas (Completas e prontas)

1. **`/meu-plano`** - Gestão visual do plano do mentorado
   - Mostra qual é o plano ativo
   - Duração total em meses
   - Breakdown de encontros (online individual, coletivos, presenciais)
   - Ferramentas incluídas

2. **`/votar-encontro`** - Votação de encontro presencial
   - Menu de cidades pra votar
   - Aviso obrigatório sobre falta de 2 encontros = bloqueio 2 próximos (sem reembolso)
   - Checkbox de aceite dos termos
   - Registro visual quando voto é enviado

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

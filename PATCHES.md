# Patches para aplicar nos arquivos existentes

## 1. components/Sidebar.tsx — adicionar 2 links novos

Procura no array de navegação do mentorado e adiciona esses dois links (em qualquer posição, recomendo perto de "Simulador de CV"):

```typescript
{ href: '/meu-plano', label: 'Meu Plano', icon: CreditCard },
{ href: '/votar-encontro', label: 'Votar Encontro', icon: MapPin },
{ href: '/indique-um-amigo', label: 'Indique um Amigo', icon: Gift },
{ href: '/minha-trilha', label: 'Minha Trilha', icon: TrendingUp },
```

Importa os ícones no topo: `import { CreditCard, MapPin, Gift, TrendingUp } from 'lucide-react';`

## 2. app/dashboard/page.tsx — substituir o Mural de Avisos

Aonde está o componente que renderiza os avisos (provavelmente `<Announcements>` 
ou similar), substitui por:

```typescript
import MuralAtualizado from '@/components/MuralAtualizado';

// ... dentro do JSX:
<MuralAtualizado avisos={avisos} />
```

O componente novo cuida de fazer scroll horizontal separado por tipo (Gerais, 
Individuais, Grupo), com botões de navegação e o mais recente primeiro.

## 3. app/passaporte/page.tsx — adicionar badges SOMA

Na página do Passaporte, aonde renderiza os achievements/badges, adiciona:

```typescript
import { SOMA_ACHIEVEMENTS, getNomePilar, getCoresDosPilares } from '@/lib/soma-badges';

// Dentro do componente, depois dos achievements atuais:
<h2 className="font-display text-lg text-brown-deep mb-4 mt-8">Pilares SOMA</h2>

{['sabedoria', 'objetividade', 'maestria', 'alquimia'].map((pilar) => {
  const badgesDosPilar = SOMA_ACHIEVEMENTS.filter(b => b.pilar === pilar);
  const cores = getCoresDosPilares();
  
  return (
    <div key={pilar} className="mb-6">
      <p className="text-sm font-medium mb-2" style={{ color: cores[pilar as keyof typeof cores] }}>
        {getNomePilar(pilar)}
      </p>
      <div className="flex flex-wrap gap-2">
        {badgesDosPilar.map((badge) => (
          <div 
            key={badge.id} 
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs"
            style={{ borderColor: cores[pilar as keyof typeof cores], backgroundColor: cores[pilar as keyof typeof cores] + '10' }}
            title={badge.descricao}
          >
            <span>{badge.emoji}</span>
            <span style={{ color: cores[pilar as keyof typeof cores] }}>{badge.nome}</span>
          </div>
        ))}
      </div>
    </div>
  );
})}
```

## 4. Texto "pra Jaqueline" → "para seu mentor" em EVERYWHERE

Faz um Find & Replace (Ctrl+H ou Cmd+H) em todo o projeto:

**Find**: `pra Jaqueline|pra você|pra mim`
**Replace with**: `para seu mentor`

**Find**: `pra`
**Replace with**: `para` (cuidado com este, pode pegar palavras que não devem)

### Específico: app/minha-trilha/MinhaTrilhaClient.tsx
Já está escrito "pra Jaqueline", troca por "para seu mentor"

### Específico: app/passaporte/page.tsx (se existir)
Se tiver "LinkedIn com a Jaque", troca por "Revisão do LinkedIn"

## 5. lib/types.ts — adicionar type para Announcement

Se não existir, adiciona:

```typescript
export interface Announcement {
  id: string;
  titulo: string;
  conteudo: string;
  tipo: 'geral' | 'individual' | 'grupo';
  destinatario_id?: string | null;
  created_at: string;
  updated_at?: string;
}
```

## 6. Avisos de Copy — títulos em CAPS LOCK e Title Case

### 6.1 Títulos de seções (CAPS LOCK → Normal)
Procura em todos os arquivos por títulos com CAPS LOCK inicial e troca:

**Find**: `MAPA DO CONHECIMENTO`, `SIMULADOR DE CV`, `PDI`, etc
**Replace**: `Mapa do conhecimento`, `Simulador de CV`, `Pdi`, etc (apenas primeira letra maiúscula)

Exemplo de arquivo pra verificar:
- `app/dashboard/page.tsx` (títulos das seções)
- `app/quem-sou-eu/page.tsx`
- `app/simulador-cv/page.tsx`

### 6.2 ⚠️ CRÍTICO: Títulos de Insights (Title Case → Sentence case)
Os títulos dos insights estão vindo com Title Case (primeira letra de cada palavra maiúscula).
Precisa trocar pra Sentence case (apenas primeira letra maiúscula, resto minúsculo).

Exemplos:
- ❌ `Sua Dinâmica de Energia: Uma Leitura de Forças`
- ✅ `Sua dinâmica de energia: uma leitura de forças`

- ❌ `Como Você Opera no Automático`
- ✅ `Como você opera no automático`

Procura em:
- `app/quem-sou-eu/page.tsx` ou componente de insights
- `app/simulador-cv/page.tsx` ou componente de insights
- `components/InsightCard.tsx` (se existir)
- Qualquer arquivo que renderize `insight.titulo` ou `insight.nome`

Se houver um componente que renderiza insights, adiciona uma função helper:
```typescript
function formatarTituloInsight(titulo: string): string {
  if (!titulo) return '';
  return titulo.charAt(0).toUpperCase() + titulo.slice(1).toLowerCase();
}
```

E usa assim no JSX:
```typescript
<h3>{formatarTituloInsight(insight.titulo)}</h3>
```

## 7. Banco de dados — Tabela de votos para encontros presenciais

No Supabase, cria a tabela:

```sql
create table public.votos_encontro (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  data_escolhida text not null,
  nome_mentorado text not null,
  created_at timestamptz not null default now()
);

create unique index votos_encontro_user_unico on public.votos_encontro(user_id);

alter table public.votos_encontro enable row level security;

create policy "mentorado ve seu voto"
  on public.votos_encontro for select
  using (user_id = auth.uid());

create policy "mentorado cria seu voto"
  on public.votos_encontro for insert
  with check (user_id = auth.uid());

create policy "admin ve todos votos"
  on public.votos_encontro for select
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin));
```

## 8. Sistema de Emails e Alertas (Cron)

**IMPORTANTE**: Adiciona um cron job que roda:
- **Hoje, 14h**: aviso pra votar (deadline amanhã 16h)
- **Amanhã, 16h30**: último aviso antes do encerramento
- **Terça de manhã, 8h**: aviso final pra quem não votou (só presencial)
- **Terça 23h**: votação encerra

O endpoint já existe em `app/api/cron/lembretes`. Precisa adicionar lógica pra avisos de votação.

Criar arquivo `app/api/cron/avisos-votacao/route.ts`:

```typescript
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = await createClient();
  const agora = new Date();
  const dia = agora.getDate();
  const hora = agora.getHours();

  // 1. Se for hoje 14h: aviso pra votar
  if (dia === 2 && hora === 14) {
    // Busca quem não votou ainda
    const { data: quemNaoVotou } = await supabase
      .from('profiles')
      .select('email, nome')
      .not('email', 'is', null);

    // Manda email pra cada um
    // Usar SendGrid via /api/enviar-email ou similar

    return NextResponse.json({ enviados: quemNaoVotou?.length || 0 });
  }

  // 2. Se for amanhã 16h30: segundo aviso
  if (dia === 3 && hora === 16) {
    // Similar ao anterior
  }

  // 3. Se for terça 8h: aviso final (só presencial)
  if (dia === 4 && hora === 8) {
    // Busca quem tem plano presencial e não votou
    // Manda email
  }

  return NextResponse.json({ ok: true });
}
```

## 9. Admin: Novo link no painel admin

Se tiver um menu admin, adiciona links pra:
- `/admin/indicacoes` (gestão de indicações e liberação de sessões bônus)
- `/admin/feedbacks` (trilha de feedbacks mensais)

(Já existem as páginas, é só linkar no menu se houver um)

---

**Resumo da ordem de aplicação:**
1. Adiciona imports novos (badges, tipos)
2. Substitui Mural de Avisos
3. Adiciona navegação nova (sidebar)
4. Adiciona badges SOMA no Passaporte
5. Troca textos (pra → para, CAPS → Normal)
6. (Opcional) Adiciona links no admin se houver menu

Depois: `npm run build` e verifica se tá tudo compilando.

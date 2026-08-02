# Patches em arquivos existentes

Estes 4 arquivos já existem no projeto e precisam de pequenos acréscimos.
Copie os trechos abaixo pro Claude Code aplicar (ele tem acesso ao arquivo
completo e sabe onde encaixar).

## 1. lib/types.ts — adicionar estas interfaces e campos

```typescript
export interface Indicacao {
  id: string;
  indicador_id: string;
  indicado_id: string | null;
  indicado_nome: string;
  indicado_email: string;
  status: 'pendente' | 'convertido';
  created_at: string;
  convertido_em: string | null;
}

export interface CheckinMensal {
  id: string;
  user_id: string;
  mes_referencia: string;
  nota: number;
  feedback_texto: string | null;
  sugestao_melhoria: string | null;
  created_at: string;
}

export interface PlanoMentoria {
  id: string;
  codigo: string;
  nome: string;
  duracao_meses: number;
  foco: string;
  preco_avista: number;
  preco_cartao: number;
  preco_recorrente_total: number;
  parcelas_recorrente: number;
  descricao_encontros: string;
  itens_inclusos: unknown;
  ativo: boolean;
  ordem: number;
}
```

E na interface `Profile` já existente, adiciona estes três campos:

```typescript
codigo_indicacao: string | null;
indicado_por_id: string | null;
sessoes_bonus_resgatadas: number;
```

## 2. app/login/page.tsx — capturar o código de indicação da URL

No topo do componente, ler o parâmetro `ref` da URL:

```typescript
import { useSearchParams } from 'next/navigation';
// ...
const searchParams = useSearchParams();
const codigoIndicacao = searchParams.get('ref');
```

E no `supabase.auth.signUp`, dentro de `options.data`, adiciona o campo:

```typescript
const { data, error } = await supabase.auth.signUp({
  email,
  password: senha,
  options: {
    data: {
      nome,
      tipo_pacote: tipoPacote,
      codigo_indicacao_referencia: codigoIndicacao, // adiciona esta linha
    },
  },
});
```

Se quiser, pode mostrar uma mensagem tipo "Você foi indicado por um amigo!"
quando `codigoIndicacao` existir, mas isso é só estético, não é obrigatório
pra funcionar.

## 3. components/Sidebar.tsx — dois novos itens de navegação

Adiciona esses dois links no array de itens de navegação do mentorado
(perto de "Simulador de CV" ou "Meu Passaporte", por exemplo):

```typescript
{ href: '/indique-um-amigo', label: 'Indique um Amigo', icon: Gift },
{ href: '/minha-trilha', label: 'Minha Trilha', icon: TrendingUp },
```

(Importa `Gift` e `TrendingUp` de `lucide-react` se ainda não estiverem
importados.)

## 4. app/api/mercadopago/webhook/route.ts — marcar indicação como convertida

No trecho onde o webhook confirma que a assinatura foi paga (o mesmo lugar
que já ativa `status_assinatura = 'ativo'` e dispara o e-mail de boas-vindas),
adiciona esta checagem logo depois:

```typescript
// Se esse mentorado foi indicado por alguém, marca a indicação como convertida
const { data: perfilPago } = await supabase
  .from('profiles')
  .select('indicado_por_id')
  .eq('id', userId) // usa a variável que já identifica o usuário nesse trecho
  .single();

if (perfilPago?.indicado_por_id) {
  await supabase
    .from('indicacoes')
    .update({ status: 'convertido', convertido_em: new Date().toISOString() })
    .eq('indicado_id', userId)
    .eq('status', 'pendente');
}
```

Ajusta o nome da variável `userId` pro nome real que já existe nesse arquivo
(deve ser algo como `data.user.id` ou similar, dependendo de como o webhook
já identifica o usuário pago).

## Admin: onde encontrar as novas páginas

Duas páginas novas ficam disponíveis direto pela URL, sem precisar mexer
no layout do admin agora (dá pra linkar depois no menu do admin se quiser):

- `/admin/indicacoes` — mostra quem indicou quem, quantos converteram, e
  tem o botão pra marcar sessão bônus como usada
- `/admin/feedbacks` — mostra todos os check-ins mensais da trilha, com
  nota média geral no topo

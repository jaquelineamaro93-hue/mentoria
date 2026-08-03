# Patches — Meu Plano (saída do Meu PDI)

Este pacote resolve o problema: a mentorada preenche as 20 seções do Meu PDI e não
aparece nenhum plano, roadmap ou ação depois disso. Agora existe uma página
`/meu-pdi/plano` que transforma as respostas em um plano com pilares SMART,
roadmap, lista de ações (feita/não feita) e reflexão mensal — no mesmo formato
dos PDIs que a Jaque já produz manualmente (Brunna, Laura).

Arquivos NOVOS neste zip (não sobrescrevem nada):
- `supabase/migrations/20260803_pdi_plano_gerado.sql`
- `lib/prompts-pdi.ts`
- `app/api/pdi/gerar-plano/route.ts`
- `app/api/pdi/acoes/route.ts`
- `app/api/pdi/reflexao/route.ts`
- `app/meu-pdi/plano/page.tsx`
- `components/pdi/AcaoItem.tsx`
- `components/pdi/RoadmapTimeline.tsx`
- `components/pdi/ReflexaoMensal.tsx`

## 1. Confirmar nome real da tabela das 20 seções

Em `app/api/pdi/gerar-plano/route.ts` a query assume uma tabela `pdi_respostas`
com colunas `secao_codigo`, `secao_titulo`, `resposta`, `mentorado_id`,
`secao_ordem`. Procura no projeto pelo nome real da tabela que guarda as
respostas do Meu PDI (as 20 seções, incluindo `bem_estar`, `inteligencia_emocional`,
`celebracao`, `planejamento_futuro` etc, vistas na migração anterior) e ajusta
o nome da tabela/colunas nessa rota. Se os nomes de coluna forem diferentes,
ajusta o `.select(...)` e o `.map(...)` logo abaixo.

## 2. Trocar os imports de "client Supabase" pelos helpers reais do projeto

Três arquivos usam `createClient` direto do `@supabase/supabase-js` como
placeholder:
- `app/api/pdi/acoes/route.ts`
- `app/meu-pdi/plano/page.tsx`

Troca pelos helpers que o projeto já usa nas outras rotas/páginas (client
autenticado a partir dos cookies da sessão), do mesmo jeito que as demais
páginas client-side do dashboard fazem.

## 3. Botão "Meu plano" dentro do Meu PDI

No arquivo da página do Meu PDI (o workbook de 20 seções), depois que a
mentorada preenche a seção 20 (`planejamento_futuro`), mostra um botão/banner
levando para `/meu-pdi/plano`:

```tsx
{todasSecoesPreenchidas && (
  <Link href="/meu-pdi/plano" className="...">
    Ver meu plano →
  </Link>
)}
```

Ajusta `todasSecoesPreenchidas` para a variável/checagem real que o projeto já
usa para saber se as 20 seções foram completadas.

## 4. Sidebar

Se "Meu PDI" já é um item da sidebar, não precisa de item novo — o link fica
dentro da própria página do PDI (ver item 3). Se preferir um item de sidebar
separado chamado "Meu plano", segue o mesmo padrão dos outros ícones da nav.

## 5. Painel admin (opcional, mas recomendado)

Dá pra reaproveitar `pdi_planos` e `pdi_acoes` para a Jaque ver, por
mentorado, se o plano foi gerado e quantas ações estão concluídas — parecido
com o que já existe em `/admin/financeiro`. Não incluído neste pacote para
manter o escopo pequeno; avisa se quiser que eu monte essa tela também.

## 6. Variáveis de ambiente

Nenhuma variável nova. Usa as que já existem: `NEXT_PUBLIC_SUPABASE_URL`,
`NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`.
Confirma que o pacote `@anthropic-ai/sdk` já está no `package.json` (é usado em
outras partes do projeto, tipo o Simulador de CV); se não estiver, `npm install
@anthropic-ai/sdk`.

## 7. Aplicar a migração

Aplica `supabase/migrations/20260803_pdi_plano_gerado.sql` direto pelo Supabase
(MCP), do mesmo jeito que as migrações anteriores foram aplicadas — não precisa
esperar o deploy do front pra isso.

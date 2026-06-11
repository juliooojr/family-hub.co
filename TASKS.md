# ✅ FAMILY HUB — BACKLOG DE TAREFAS v3
> Ordem de execução obrigatória. Não pule fases.
> Marque cada item conforme conclui antes de avançar.

---

## FASE 1 — FUNDAÇÃO
> Objetivo: projeto rodando localmente com login funcional e layout base.

### 1.1 Setup Supabase
- [ ] Criar projeto em supabase.com (nome: `family-hub`)
- [ ] Ativar Google OAuth: Authentication → Providers → Google
  - Criar credenciais OAuth 2.0 no Google Cloud Console
  - Callback URL: `https://<projeto>.supabase.co/auth/v1/callback`
- [ ] Executar schema SQL completo (copiar do BRAIN.md)
- [ ] Ativar RLS em todas as tabelas
- [ ] Criar policies de isolamento por `family_id`
- [ ] Criar bucket privado `documents` no Storage

### 1.2 Setup Next.js
```bash
npx create-next-app@latest family-hub \
  --typescript --tailwind --eslint --app --src-dir
cd family-hub
npx shadcn@latest init
npm install @supabase/supabase-js @supabase/ssr
npm install @fontsource/bebas-neue @fontsource/inter @fontsource/jetbrains-mono
```

### 1.3 Variáveis de ambiente
Criar `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

### 1.4 Tailwind config — design tokens
- [ ] Adicionar paleta do DESIGN.md em `tailwind.config.ts`
- [ ] Configurar fontes via `next/font` (Bebas Neue, Inter, JetBrains Mono)
- [ ] Adicionar CSS global: `cursor: default` em todos os elementos não-interativos

### 1.5 Auth
- [ ] `src/lib/supabase/client.ts` — browser client
- [ ] `src/lib/supabase/server.ts` — server client
- [ ] `src/middleware.ts` — proteger todas as rotas exceto `/login`
- [ ] Página `/login` com botão "Entrar com Google"
- [ ] `/auth/callback/route.ts`
- [ ] Hook `useUser()` para acessar sessão

### 1.6 Layout base
- [ ] `src/app/layout.tsx` — providers, fontes, CSS global
- [ ] `src/app/(app)/layout.tsx` — layout protegido com FloatNav
- [ ] Componente `FloatNav` — pill flutuante com módulos ativos e bloqueados
- [ ] Componente `Topbar` reutilizável com `back-btn`, título, sub, tabs e actions
- [ ] Página Hub orbital `/` — bolhas de módulo com estados ativo/bloqueado/SOS

---

## FASE 2 — FINANCEIRO
> Objetivo: CRUD completo + dashboard funcional com dados reais do Supabase.

### 2.1 Queries (src/lib/queries/)
- [ ] `transactions.ts` — getTransactions(filters), create, update, delete + audit
- [ ] `bills.ts` — getBills, getBillPayments, payBill (cria transaction automática)
- [ ] `budgets.ts` — getBudgets(monthYear), upsertBudget
- [ ] `investments.ts` — getInvestments, create, update
- [ ] `reserve.ts` — getReserveConfig, upsertReserveConfig, getReserveBalance

### 2.2 Componentes UI
- [ ] `MonthPicker` — navegador `‹ Mês / Ano ›` (Jul/2026 → Dez/2050)
- [ ] `FinanceiroDashboard` — 4 cards, fluxo de caixa, categorias, reserva
- [ ] `FluxoCaixaChart` — barras semanais receita/despesa (usar recharts)
- [ ] `ReservaCard` — barra gradiente, 3 sub-cards, botões depositar/retirar, modal config
- [ ] `TransacoesList` — lista com seções Receitas/Despesas/Reserva + filtros
- [ ] `ContasList` — seções Pendentes/Vencidas/Pagas, toggle pago/pendente
- [ ] `OrcamentoList` — semáforo por categoria (verde/amarelo/vermelho)
- [ ] `InvestimentoGrid` — cards por ativo + card "Novo aporte"
- [ ] `ModalNovaTransacao` — tipo (despesa/receita), valor grande, categoria chips, recorrência
- [ ] `ModalDetalheTransacao` — editar + excluir
- [ ] `ModalNovaConta` — nome, valor, dia vencimento, categoria, recorrência
- [ ] `ModalDetalheConta` — editar + botão "Marcar paga" + excluir
- [ ] `ModalNovoAporte` — nome, tipo, valor investido, valor atual, data
- [ ] `ModalOrcamento` — categoria + teto mensal
- [ ] `ModalConfigurarReserva` — custo mensal, meses cobertura (3/6/9/12), meta ao vivo

### 2.3 Página
- [ ] `src/app/(app)/financeiro/page.tsx`
  - 5 sub-abas: Visão Geral, Transações, Contas, Orçamento, Investimentos
  - Botão primário muda por aba (ver BRAIN.md)
  - Filtro owner: Família / Julio / Carol
  - Server Components com Suspense

### 2.4 Extras
- [ ] Exportar transações como CSV (client-side)
- [ ] Alertas visuais quando gasto > 90% do orçamento

---

## FASE 3 — LISTA DE COMPRAS
> Objetivo: CRUD completo com modo mercado e arquivo.

### 3.1 Queries
- [ ] `shopping.ts` — getLists, getItems, createList, createItem, toggleItem, archiveList, reopenList

### 3.2 Componentes
- [ ] `ShoppingCard` — header clicável separado dos itens; click na linha marca sem abrir detalhe
- [ ] `ShoppingDetalhe` — progresso, itens alfa, add item, arquivar quando 100%
- [ ] `ShoppingArquivo` — lista arquivadas, dropdown "Ver itens", modal "Reabrir"
- [ ] `ModoMercado` — fullscreen, itens grandes, check + excluir + adicionar
- [ ] `ModalNovaLista` — emoji picker, nome, data, responsável
- [ ] `ModalAddItem` — nome, insere em ordem alfa
- [ ] `ModalReabrir` — confirmação com listagem dos itens

### 3.3 Regras críticas de implementação
- Itens SEMPRE ordenados alfabeticamente no banco e na UI
- Cards SEMPRE ordenados por `scheduled_date ASC NULLS LAST`
- Click no `.chk-box` ou na linha `.chk` → toggle + atualiza progress bar imediatamente
- Botão `←` usa pilha de histórico de views (não `router.back()` direto)

---

## FASE 4 — DEMAIS MÓDULOS
> Iniciar apenas após Fase 3 aprovada.

- [ ] **Calendário** — Google Calendar API (leitura + criação de eventos)
- [ ] **Flora** — perfil, vacinas, gastos integrados ao Financeiro
- [ ] **Documentos** — upload Storage, signed URLs, categorias, busca
- [ ] **Emergência** — CRUD contatos com botão "Ligar"

---

## FASE 5 — PRODUÇÃO
- [ ] Deploy Vercel: conectar repo GitHub, configurar env vars
- [ ] Domínio customizado
- [ ] Convite de novos usuários por email (admin envia, convidado acessa tudo)
- [ ] Emails de alerta (Supabase Edge Functions + Resend)
  - Vencimento de conta se aproximando
  - Vacina da Flora próxima do vencimento
  - Orçamento > 90% de qualquer categoria
- [ ] Testes de segurança: RLS com 2 usuários distintos, signed URLs expirando
- [ ] PWA: `manifest.json` + service worker para instalar no celular

---

## REFERÊNCIAS RÁPIDAS

### Prompt padrão para cada sessão no Cursor
```
Leia BRAIN.md, DESIGN.md e TASKS.md antes de qualquer ação.
Stack: Next.js 14 App Router + TypeScript strict + Tailwind + Supabase + shadcn/ui.
Referência visual: family-hub-v3.html.
Tarefa desta sessão: [DESCREVA AQUI]
```

### Checklist antes de cada commit
- [ ] Nenhuma key/secret no código
- [ ] RLS ativo em todas as queries novas
- [ ] TypeScript sem erros (`npx tsc --noEmit`)
- [ ] Cursor `default` em novos elementos não-interativos
- [ ] Testado em 360px e 768px

---
*TASKS.md — Family Hub v3.0 — 10/06/2026*

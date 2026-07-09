# 🧠 FAMILY HUB — BRAIN PROMPT v3
> Cole este arquivo no início de QUALQUER sessão de desenvolvimento.
> É a fonte da verdade do projeto. Nunca tome decisões que contradigam este documento.

---

## VISÃO GERAL
**Family Hub** é um sistema web privado para a família Julio & Carol.
Centraliza finanças, agenda, documentos, pets e compras em um hub digital seguro.
Acesso via browser (desktop + mobile responsivo, 360px até 1440px+).
Login obrigatório via Google OAuth.

## FAMÍLIA
| Membro | Perfil |
|--------|--------|
| Julio | Pai, 34 anos — admin principal |
| Carol | Mãe, 35 anos — co-admin |
| Tomás | Filho, nascido 27/03/2026 |
| Flora | Shih-Tzu, nascida 06/11/2024 |

---

## STACK OBRIGATÓRIA
| Camada | Tecnologia |
|--------|-----------|
| Frontend | Next.js 14 (App Router) + TypeScript |
| Estilização | Tailwind CSS + shadcn/ui customizado |
| Backend/Auth | Supabase (PostgreSQL + Auth + Storage + RLS) |
| Autenticação | OAuth Google (login por Gmail) |
| Calendário | Google Calendar API (leitura + criação) — módulo futuro |
| Hospedagem | Vercel (frontend) + Supabase Cloud |

**TypeScript strict em todo o projeto. Sem `any` implícito.**

---

## REGRAS DE SEGURANÇA — NÃO NEGOCIÁVEIS
1. Nenhuma rota ou dado acessível sem autenticação ativa
2. RLS ativo no Supabase em todas as tabelas — cada registro tem `family_id`
3. HTTPS forçado em todas as rotas (Vercel faz por padrão)
4. Zero variáveis sensíveis no código — tudo via `.env.local` e Vercel env vars
5. Documentos em bucket privado Supabase Storage, acesso só via signed URL com expiração
6. Toda ação crítica registrada em tabela `audit_log`
7. Novos usuários acessam via convite por email — acesso total, sem restrição de módulo
8. Nenhum dado sensível em query params de URL
9. Cursor `default` em todos os elementos não-interativos; `pointer` apenas em clicáveis
10. `user-select: none` em todos os elementos não-editáveis para evitar cursor de texto

---

## MÓDULOS E STATUS
| Módulo | Status | Prioridade |
|--------|--------|-----------|
| 🔐 Auth (Google OAuth) | 🔴 A fazer | 1 |
| 💰 Financeiro | 🔴 A fazer | 2 |
| 🛒 Lista de Compras | 🔴 A fazer | 3 |
| 📅 Calendário | 🔒 Bloqueado (futuro) | 4 |
| 🐾 Flora (Pet) | 🔒 Bloqueado (futuro) | 5 |
| 📁 Documentos | 🔒 Bloqueado (futuro) | 6 |
| 🚨 Emergência | 🔒 Bloqueado (futuro) | 7 |

**Módulos bloqueados = UI existe no mockup mas backend ainda não será implementado.**
**Na UI, módulos bloqueados aparecem com cadeado 🔒, sem hover, cursor not-allowed.**

---

## MÓDULO FINANCEIRO — SPEC COMPLETA

### 5 sub-abas (tabs na topbar)
| Aba | Descrição |
|-----|-----------|
| **Visão Geral** | Dashboard: 4 cards de resumo, fluxo de caixa, categorias, reserva de emergência |
| **Transações** | CRUD completo — receitas, despesas, reserva. Filtro por mês/ano + categoria + tipo |
| **Contas** | Compromissos recorrentes mensais com check pago/pendente. Filtro por mês/ano |
| **Orçamento** | Teto mensal por categoria com semáforo verde/amarelo/vermelho. Filtro por mês/ano |
| **Investimentos** | Estrutura preservada, mas aba bloqueada ate uma etapa futura |

### Botão primário muda por aba
- Visão Geral / Transações → `+ Transação`
- Contas → `+ Conta`
- Orçamento → `+ Categoria`
- Investimentos → `+ Aporte`

### Filtro mês/ano
- Presente em Visão Geral, Transações, Contas e Orçamento
- Navegação por `‹ Jul / 2026 ›` (setas)
- Mínimo: Jan/2026 | Máximo: Dez/2050

### Transações — regras de negócio
- Campos: `amount`, `type` (income/expense/reserve_deposit/reserve_withdrawal), `category`, `description`, `date`, `responsible`, `family_id`, `recurrence`, `expense_kind`, `notes`
- `owner_id`: Julio, Carol ou Família
- Recorrência: único, semanal, mensal, anual
- Categorias: Moradia, Alimentação, Saúde, Bebê, Pet, Lazer, Renda, **Reserva**, Outros
- Categoria **Reserva** alimenta automaticamente o saldo da reserva de emergência

### Contas — regras de negócio
- Compromissos com recorrência aparecem automaticamente nos meses seguintes
- Status: pendente (laranja), pago (verde), vencido (vermelho)
- Ao marcar como paga, registra somente o pagamento mensal da conta; nao gera transacao duplicada
- Agrupamento: Pendentes/Vencidas no topo → Pagas embaixo

### Reserva de emergência — configuração
- Meta configuravel diretamente no card da reserva
- Depositos e retiradas diretas sao movimentacoes de reserva, nao receitas ou despesas comuns
- Conta da categoria Reserva aumenta o saldo somente quando marcada como paga
- Exibe saldo atual, meta, movimento do mes e barra de progresso

### Orçamento — semáforo
- Verde: gasto < 75% do teto
- Amarelo: 75–89%
- Vermelho: >= 90%

---

## MÓDULO LISTA DE COMPRAS — SPEC COMPLETA

### Estrutura de dados por lista
```
{ emoji, nome, data?, resp, itens: string[], feitos: Set<string> }
```

### Regras de negócio
- **Itens sempre em ordem alfabética** — pendentes primeiro, comprados por último
- **Cards ordenados por data** — mais próxima primeiro, sem data vai para o final
- Criar lista: emoji (picker), nome, data opcional, responsável
- Cada card mostra: header clicável (abre detalhe), itens com check inline, botão `+ item`
- **Clique no header** → abre tela de detalhe
- **Clique no item ou chk-box** → marca/desmarca sem abrir detalhe + atualiza progress bar imediatamente
- **Excluir item**: botão `×` que aparece no hover (desktop) ou sempre visível (touch)

### Views do módulo
| View | Descrição |
|------|-----------|
| **Listas** | Grid de cards. Link discreto "📦 Arquivo" no canto direito |
| **Detalhe** | Progresso, itens em alfa, botão `+ Adicionar item`, arquivar quando 100% |
| **Arquivo** | Lista arquivadas (mais recentes primeiro). Dropdown "Ver itens" + modal "↺ Reabrir" |
| **Modo Mercado** | Fullscreen, itens grandes, fácil check com uma mão, `+ Item` e `×` por item |

### Navegação — pilha de histórico
- Botão `←` na topbar sempre volta para view anterior
- Se não há histórico (está na raiz Listas) → vai para o Hub
- Modo Mercado tem próprio botão `✕ Sair` → volta para Detalhe

### Arquivo — comportamento
- "Ver itens" → dropdown inline com listagem; clique novamente fecha
- "↺ Reabrir" → modal de confirmação → lista volta como ativa com itens desmarcados

---

## DESIGN — TOKENS OFICIAIS
> Ver arquivo DESIGN.md para tokens completos.
> Mockup visual aprovado: `family-hub-v3.html`

**Princípios:**
- Dark theme industrial: fundo carvão `#111210`, acento laranja âmbar `#e8760a`
- Tipografia: **Bebas Neue** (títulos/números) + **Inter** (corpo) + **JetBrains Mono** (dados/labels)
- Mobile-first: responsivo de 360px até 1440px+
- Hub orbital na tela inicial — bolhas flutuantes com anéis giratórios
- Float nav pill fixo no fundo das telas internas (não sidebar)
- SOS: sem hover scale, borda vermelha pulsante, acesso imediato
- Módulos bloqueados: `grayscale + opacity 0.4 + 🔒 + pointer-events:none`
- Cursor global: `default` em tudo, `pointer` só em elementos interativos, `text` só em inputs

---

## BANCO DE DADOS — ESTRUTURA BASE

```sql
families (id uuid PK, name text, created_at timestamptz)

family_members (
  id uuid PK, family_id uuid FK, user_id uuid FK auth.users,
  name text, role text CHECK (role IN ('admin','member')),
  avatar_url text, created_at timestamptz
)

finance_transactions (
  id uuid PK, family_id uuid FK,
  type text CHECK (type IN ('expense','income','reserve_deposit','reserve_withdrawal')),
  name text NOT NULL, amount numeric(12,2) NOT NULL,
  category text NOT NULL, responsible text NOT NULL,
  recurrence text CHECK (recurrence IN ('none','weekly','monthly','bimonthly','yearly')),
  transaction_date date NOT NULL,
  expense_kind text CHECK (expense_kind IN ('fixed','variable')),
  notes text, created_at timestamptz, updated_at timestamptz
)

finance_budgets (
  id uuid PK, family_id uuid FK, category text NOT NULL,
  emoji text NOT NULL, monthly_limit numeric(12,2) NOT NULL,
  created_at timestamptz, updated_at timestamptz,
  UNIQUE(family_id, category)
)

investments (
  id uuid PK, family_id uuid FK, owner_id uuid FK family_members,
  name text NOT NULL, type text NOT NULL,
  amount_invested numeric(12,2) NOT NULL, current_value numeric(12,2),
  invested_at date NOT NULL, notes text, created_at timestamptz
)

finance_bills (
  id uuid PK, family_id uuid FK,
  name text NOT NULL, category text NOT NULL,
  amount numeric(12,2), due_day int CHECK (due_day BETWEEN 1 AND 31),
  responsible text NOT NULL, recurrence text NOT NULL,
  start_date date NOT NULL,
  expense_kind text CHECK (expense_kind IN ('fixed','variable')),
  notes text, created_at timestamptz, updated_at timestamptz
)

finance_bill_payments (
  id uuid PK, bill_id uuid FK finance_bills, family_id uuid FK,
  month_date date NOT NULL, paid_at timestamptz,
  UNIQUE(bill_id, month_date)
)

finance_reserve_settings (
  family_id uuid PK, goal_amount numeric(12,2) NOT NULL,
  updated_at timestamptz
)

shopping_lists (
  id uuid PK, family_id uuid FK, emoji text, name text NOT NULL,
  scheduled_date date, responsible text,
  status text CHECK (status IN ('active','archived')) DEFAULT 'active',
  created_at timestamptz, archived_at timestamptz
)

shopping_items (
  id uuid PK, list_id uuid FK shopping_lists, family_id uuid FK,
  name text NOT NULL, checked boolean DEFAULT false,
  checked_at timestamptz, created_at timestamptz
)

audit_log (
  id uuid PK, family_id uuid FK, user_id uuid FK auth.users,
  action text NOT NULL, table_name text NOT NULL,
  record_id uuid, payload jsonb, created_at timestamptz DEFAULT now()
)
```

**RLS obrigatório em todas as tabelas.**

---

## FLUXO DE DESENVOLVIMENTO

```
Fase 1 — Fundação
  ├── Setup Supabase + Google OAuth + tabelas + RLS
  ├── Setup Next.js 14 + TypeScript + Tailwind + shadcn/ui
  ├── Login Google + proteção de rotas (middleware)
  └── Layout base: hub orbital + float nav

Fase 2 — Financeiro
  ├── CRUD transações + filtros mês/ano/categoria/owner
  ├── Módulo Contas (bills + bill_payments)
  ├── Dashboard visão geral + fluxo de caixa
  ├── Orçamento com semáforo
  ├── Reserva de emergência configurável
  └── Investimentos

Fase 3 — Lista de Compras
  ├── CRUD listas + itens (ordem alfabética)
  ├── Modo Mercado
  └── Arquivo + reabrir

Fase 4 — Demais módulos
  └── Calendário → Flora → Documentos → Emergência

Fase 5 — Produção
  ├── Deploy Vercel + domínio
  ├── Alertas por email (Supabase Edge Functions)
  └── PWA (manifest + service worker)
```

---

## INSTRUÇÃO PARA IA GERADORA DE CÓDIGO
> Prompt recomendado para iniciar um novo chat retomando Tarefas:

"Vamos continuar o Family Hub a partir da branch atualizada de Tarefas.

Antes de mexer no código, leia AGENTS.md, README.md, TASKS.md, DESIGN.md e BRAIN.md.

Contexto importante:
- O PWA mobile já está publicado em produção.
- Compras e Financeiro estão em uso real.
- A primeira base experimental de Tarefas já existe, mas os acessos pelo menu lateral, navigation mobile e tela inicial estão bloqueados até revisão.
- Tarefas deve ser exclusiva por usuário, diferente de Compras/Financeiro que são por família.
- A proposta atual é manter o nome Tarefas por enquanto.
- A seção deve seguir o padrão visual do Family Hub, funcionando bem no desktop e responsivo.
- Frequências esperadas: diário, semanal, quinzenal, mensal e dias específicos.
- Deve permitir concluir/desfazer, editar/excluir, metas de quantidade como água, sequência zerando quando passar um dia previsto sem cumprir, e deixar notificações preparadas porém bloqueadas.
- Transações financeiras agora são sempre avulsas; contas podem ser fixas ou variáveis recorrentes.
- Existe backlog para detalhar contas variáveis como Cartão de crédito sem duplicar o total nas transações.

Objetivo da sessão:
Revisar a primeira base de Tarefas, propor/implementar apenas os ajustes necessários para uma primeira versão pequena e útil, e só então desbloquear os acessos se a experiência estiver aprovada.

Validação obrigatória ao final:
npm.cmd run lint
npm.cmd exec tsc -- --noEmit
npm.cmd run build"

---
*Family Hub BRAIN.md — v3.0 — 10/06/2026*

---

## ATUALIZACAO DE ESTADO REAL - 06/07/2026

Este bloco prevalece sobre trechos historicos acima quando houver divergencia.

- Projeto em producao: https://family-hub-co.vercel.app
- Stack real: Next.js 16.2.9, React 19.2.4, TypeScript strict, Supabase e Vercel.
- `master` e a branch oficial da producao.
- Login e exclusivo via Google OAuth.
- Usuarios autorizados: Julio e Carol.
- Home publica, Hub interno, Compras, Financeiro e PWA mobile estao publicados.
- App instalavel pela tela inicial do iPhone, sem publicacao em loja.
- PWA possui manifest, service worker, offline fallback, icone principal e splash screen iOS.
- Navegacao autenticada usa menu lateral no desktop e barra inferior no mobile.
- Compras e Financeiro usam dados reais no Supabase compartilhado; nao criar dados ficticios.
- Melhorias de UX de uso real em Compras, Financeiro e login foram implementadas em 03/07/2026 e aguardam publicacao/validacao mobile.
- Compras possui item com preco opcional discreto e Modo Mercado revisado para desktop.
- Financeiro preserva meses anteriores ao editar contas recorrentes e categorias/orcamentos; transacoes usam data atual por padrao e ordenacao por data registrada.
- Financeiro separa despesas em Fixos, Variaveis recorrentes e Transacoes avulsas. Apenas Contas usam a classificacao fixo/variavel; Transacoes sao sempre avulsas.
- Contas variaveis como Cartao de credito devem representar o total da fatura. O detalhamento interno da fatura esta no backlog e nao deve duplicar despesas em Transacoes.
- A Visao Geral do Financeiro possui grafico mensal clicavel com valores por barra.
- Tarefas possui primeira base experimental na branch atual, mas os acessos pelo menu lateral, navigation mobile e tela inicial estao bloqueados ate revisao e aprovacao.
- Investimentos, Calendario, Flora, Documentos e Emergencia permanecem bloqueados para escopos futuros.

---

## ATUALIZACAO DE ESTADO REAL - 08/07/2026

Este bloco prevalece sobre trechos historicos acima quando houver divergencia.

- Tarefas possui primeira versao pequena desbloqueada na navegacao desktop e mobile para teste.
- Compras, Financeiro, Tarefas e Hub receberam ajustes mobile de responsividade e usabilidade nesta branch.
- Financeiro mobile possui cards visiveis por padrao com opcao de minimizar, filtros de Transacoes recolhiveis, abas sem scrollbar aparente cortando itens e gesto interno de puxar para atualizar.
- Contas exibem feedback visual ao marcar pagamento, com preenchimento verde rapido no card, e usam gravacao idempotente para evitar erro de pagamento mensal duplicado.
- Movimentacoes diretas de Reserva aparecem como transacoes de reserva, mas nao somam em receitas, despesas, saldo comum ou margem planejada.
- Orcamento permite expandir uma categoria para listar os itens do mes que compoem o valor gasto, incluindo contas e transacoes.
- O controle de expandir categoria no Orcamento deve permanecer discreto, sem caixa quadrada pesada; usar seta/chevron simples alinhado ao fim da linha.
- Backlog atual: P0 validar o fluxo multi-familia com cadastro aberto, criacao de familia e convites; P1 revisar como Tarefas aparece na Visao Geral; P2 manter seguranca/operacao; P3 manter Investimentos, Calendario, Documentos e Emergencia.
- Family Hub agora evolui para produto multi-familia: cada usuario pode criar uma familia propria ou entrar por convite; dados seguem isolados por `family_id`; Julio permanece owner e Carol admin da familia atual.
- A area "Gerenciar" aparece apenas para owner/admin e concentra membros, edicao do nome da familia e convites.
- Convites pendentes podem ser excluidos pela interface; isso remove o registro de `family_invites` e invalida imediatamente o link `/convite/[token]`.
- Remover membro revoga o acesso daquele usuario a familia, mas nao apaga o historico do que ele ja fez.
- No mobile, a navegacao inferior deve mostrar carregamento ao trocar de modulo, e campos numericos de Tarefas devem evitar zoom automatico.

'use client'

import Link from 'next/link'
import { useState } from 'react'

type Tab = 'visao' | 'transacoes' | 'contas' | 'orcamento' | 'investimentos'
type Recurrence = 'none' | 'weekly' | 'monthly' | 'bimonthly' | 'yearly'
type TransactionType = 'expense' | 'income'
type Transaction = {
  id: string
  type: TransactionType
  name: string
  amount: number
  category: string
  owner: string
  recurrence: Recurrence
  date: string
  notes?: string
}
type Budget = {
  id: string
  name: string
  emoji: string
  limit: number
}
type CategoryOption = { name: string; emoji: string }

const defaultCategories: CategoryOption[] = [
  { name: 'Cartão', emoji: '💳' }, { name: 'Moradia', emoji: '🏠' },
  { name: 'Alimentação', emoji: '🛒' }, { name: 'Saúde', emoji: '💊' },
  { name: 'Bebê', emoji: '👶' }, { name: 'Pet', emoji: '🐾' },
  { name: 'Lazer', emoji: '🎉' }, { name: 'Renda', emoji: '💼' },
  { name: 'Reserva', emoji: '🛡️' }, { name: 'Outros', emoji: '📦' },
]
type Bill = {
  id: string
  name: string
  amount: number
  dueDay: number
  category: string
  owner: string
  recurrence: Recurrence
  startMonth: number
  paidMonths: number[]
  notes?: string
}

const tabs: Array<{ id: Tab; label: string; action: string }> = [
  { id: 'visao', label: 'Visão Geral', action: '+ Transação' },
  { id: 'transacoes', label: 'Transações', action: '+ Transação' },
  { id: 'contas', label: 'Contas', action: '+ Conta' },
  { id: 'orcamento', label: 'Orçamento', action: '+ Categoria' },
  { id: 'investimentos', label: 'Investimentos', action: '+ Aporte' },
]

const initialTransactions: Transaction[] = [
  { id: 'salary-julio', type: 'income', name: 'Salário Julio', amount: 8200, category: 'Renda', owner: 'Julio', recurrence: 'monthly', date: '2026-07-01' },
  { id: 'salary-carol', type: 'income', name: 'Salário Carol', amount: 4200, category: 'Renda', owner: 'Carol', recurrence: 'monthly', date: '2026-07-05' },
  { id: 'rent-tx', type: 'expense', name: 'Aluguel', amount: 1800, category: 'Moradia', owner: 'Julio', recurrence: 'monthly', date: '2026-07-01' },
  { id: 'market', type: 'expense', name: 'Mercado', amount: 420, category: 'Alimentação', owner: 'Carol', recurrence: 'none', date: '2026-07-06' },
  { id: 'vet', type: 'expense', name: 'Veterinário – Flora', amount: 280, category: 'Pet', owner: 'Carol', recurrence: 'none', date: '2026-07-06' },
  { id: 'baby', type: 'expense', name: 'Fralda + Creme Tomás', amount: 155, category: 'Bebê', owner: 'Julio', recurrence: 'none', date: '2026-07-07' },
  { id: 'health-tx', type: 'expense', name: 'Plano de saúde', amount: 680, category: 'Saúde', owner: 'Família', recurrence: 'monthly', date: '2026-07-10' },
  { id: 'reserve-tx', type: 'expense', name: 'Aporte Reserva Emergência', amount: 1875, category: 'Reserva', owner: 'Família', recurrence: 'monthly', date: '2026-07-01' },
]

const initialBills: Bill[] = [
  { id: 'masonry', name: 'Maçonaria', amount: 269, dueDay: 5, category: 'Outros', owner: 'Julio', recurrence: 'monthly', startMonth: 0, paidMonths: [] },
  { id: 'nubank', name: 'Nubank — Fatura', amount: 1840, dueDay: 15, category: 'Cartão', owner: 'Julio', recurrence: 'monthly', startMonth: 0, paidMonths: [] },
  { id: 'health', name: 'Plano de Saúde', amount: 680, dueDay: 20, category: 'Saúde', owner: 'Família', recurrence: 'monthly', startMonth: 0, paidMonths: [] },
  { id: 'rent', name: 'Aluguel', amount: 1800, dueDay: 1, category: 'Moradia', owner: 'Julio', recurrence: 'monthly', startMonth: 0, paidMonths: [6] },
  { id: 'loan', name: 'Empréstimo', amount: 550, dueDay: 4, category: 'Outros', owner: 'Julio', recurrence: 'monthly', startMonth: 0, paidMonths: [6] },
  { id: 'iptv', name: 'IPTV', amount: 75, dueDay: 3, category: 'Moradia', owner: 'Família', recurrence: 'monthly', startMonth: 0, paidMonths: [6] },
  { id: 'trainer', name: 'Personal Trainer', amount: 420, dueDay: 5, category: 'Saúde', owner: 'Carol', recurrence: 'monthly', startMonth: 0, paidMonths: [6] },
  { id: 'iptu', name: 'IPTU Parcela 7/10', amount: 220, dueDay: 2, category: 'Moradia', owner: 'Família', recurrence: 'monthly', startMonth: 0, paidMonths: [6] },
]

const initialBudgets: Budget[] = [
  { id: 'budget-home', name: 'Moradia', emoji: '🏠', limit: 2400 },
  { id: 'budget-food', name: 'Alimentação', emoji: '🛒', limit: 1500 },
  { id: 'budget-baby', name: 'Bebê', emoji: '👶', limit: 1500 },
  { id: 'budget-health', name: 'Saúde', emoji: '💊', limit: 1000 },
  { id: 'budget-pet', name: 'Pet', emoji: '🐾', limit: 1000 },
  { id: 'budget-leisure', name: 'Lazer', emoji: '🎉', limit: 500 },
  { id: 'budget-other', name: 'Outros', emoji: '📦', limit: 1000 },
]

const investments = [
  ['Tesouro Selic 2029', 'Renda Fixa · Julio', 'R$10.000', 'R$11.240', '+12,4%', true],
  ['CDB Banco Inter 120% CDI', 'Renda Fixa · Carol', 'R$8.000', 'R$8.760', '+9,5%', true],
  ['FII HGLG11', 'FII · Julio', 'R$5.000', 'R$5.480', '+9,6%', true],
  ['Previdência Privada', 'Previdência · Família', 'R$7.000', 'R$6.900', '−1,4%', false],
  ['Ações ITUB4', 'Renda Variável · Carol', 'R$2.000', 'R$1.820', '−9,0%', false],
]

export default function FinanceModule() {
  const [tab, setTab] = useState<Tab>('visao')
  const [owner, setOwner] = useState('Família')
  const [monthIndex, setMonthIndex] = useState(6)
  const [notice, setNotice] = useState('')
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions)
  const [transactionModal, setTransactionModal] = useState<Transaction | 'new' | null>(null)
  const [bills, setBills] = useState<Bill[]>(initialBills)
  const [billModal, setBillModal] = useState<Bill | 'new' | null>(null)
  const [budgets, setBudgets] = useState<Budget[]>(initialBudgets)
  const [budgetModal, setBudgetModal] = useState<Budget | 'new' | null>(null)
  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
  const selectedTab = tabs.find((item) => item.id === tab) ?? tabs[0]
  const categoryOptions = [...new Map([
    ...defaultCategories,
    ...budgets.map((budget) => ({ name: budget.name, emoji: budget.emoji })),
    ...bills.map((bill) => ({ name: bill.category, emoji: transactionIcon(bill.category) })),
    ...transactions.map((transaction) => ({ name: transaction.category, emoji: transactionIcon(transaction.category) })),
  ].map((category) => [category.name, category])).values()]

  function demoAction(action: string) {
    setNotice(`${action} será habilitado após a definição e aprovação do schema financeiro.`)
  }

  function saveBill(bill: Bill) {
    setBills((current) => current.some((item) => item.id === bill.id)
      ? current.map((item) => item.id === bill.id ? bill : item)
      : [...current, bill])
    setBillModal(null)
  }

  function saveTransaction(transaction: Transaction) {
    setTransactions((current) => current.some((item) => item.id === transaction.id)
      ? current.map((item) => item.id === transaction.id ? transaction : item)
      : [...current, transaction])
    setTransactionModal(null)
  }

  function deleteTransaction(id: string) {
    setTransactions((current) => current.filter((item) => item.id !== id))
    setTransactionModal(null)
  }

  function saveBudget(budget: Budget) {
    const previous = budgets.find((item) => item.id === budget.id)
    if (previous && previous.name !== budget.name) {
      setBills((current) => current.map((bill) => bill.category === previous.name ? { ...bill, category: budget.name } : bill))
      setTransactions((current) => current.map((transaction) => transaction.category === previous.name ? { ...transaction, category: budget.name } : transaction))
    }
    setBudgets((current) => {
      const duplicate = current.find((item) => item.id !== budget.id && item.name.toLocaleLowerCase('pt-BR') === budget.name.toLocaleLowerCase('pt-BR'))
      if (duplicate) return current.filter((item) => item.id !== budget.id).map((item) => item.id === duplicate.id ? { ...budget, id: duplicate.id } : item)
      return current.some((item) => item.id === budget.id) ? current.map((item) => item.id === budget.id ? budget : item) : [...current, budget]
    })
    setBudgetModal(null)
  }

  function deleteBudget(id: string) {
    setBudgets((current) => current.filter((item) => item.id !== id))
    setBudgetModal(null)
  }

  function deleteBill(id: string) {
    setBills((current) => current.filter((item) => item.id !== id))
    setBillModal(null)
  }

  function toggleBill(id: string) {
    setBills((current) => current.map((item) => item.id !== id ? item : {
      ...item,
      paidMonths: item.paidMonths.includes(monthIndex)
        ? item.paidMonths.filter((month) => month !== monthIndex)
        : [...item.paidMonths, monthIndex],
    }))
  }

  return (
    <main className="finance-shell">
      <header className="finance-topbar">
        <div className="finance-topbar-main">
          <Link className="finance-back" href="/" aria-label="Voltar ao Hub">‹</Link>
          <div className="finance-heading"><h1>FINANCEIRO</h1><p>Junho 2026</p></div>
          <nav className="finance-tabs" aria-label="Áreas do Financeiro">
            {tabs.map((item) => <button className={tab === item.id ? 'active' : ''} key={item.id} onClick={() => { setTab(item.id); setNotice('') }}>{item.label}</button>)}
          </nav>
        </div>
        <div className="finance-actions">
          <div className="finance-owners">{['Família', 'Julio', 'Carol'].map((name) => <button className={owner === name ? 'active' : ''} key={name} onClick={() => setOwner(name)}>{name}</button>)}</div>
          <button className="button button-ghost" onClick={() => demoAction('Exportar')}>Exportar</button>
          <button className="button button-primary" onClick={() => tab === 'contas' ? setBillModal('new') : tab === 'transacoes' ? setTransactionModal('new') : tab === 'orcamento' ? setBudgetModal('new') : demoAction(selectedTab.action)}>{selectedTab.action}</button>
        </div>
      </header>

      <section className="finance-content">
        <div className="finance-local-note"><span>DEMONSTRAÇÃO LOCAL</span>Dados visuais do mockup v3. Nada é salvo no Supabase.</div>
        {notice ? <div className="finance-notice" role="status">{notice}<button onClick={() => setNotice('')} aria-label="Fechar">×</button></div> : null}
        {tab === 'visao' ? <Overview onAction={demoAction} /> : null}
        {tab === 'transacoes' ? <Transactions transactions={transactions} categories={categoryOptions} owner={owner} month={months[monthIndex]} onMonth={setMonthIndex} monthIndex={monthIndex} onCreate={() => setTransactionModal('new')} onEdit={setTransactionModal} /> : null}
        {tab === 'contas' ? <Bills bills={bills} owner={owner} month={months[monthIndex]} onMonth={setMonthIndex} monthIndex={monthIndex} onCreate={() => setBillModal('new')} onEdit={setBillModal} onToggle={toggleBill} /> : null}
        {tab === 'orcamento' ? <Budgets budgets={budgets} bills={bills} transactions={transactions} month={months[monthIndex]} onMonth={setMonthIndex} monthIndex={monthIndex} onCreate={() => setBudgetModal('new')} onEdit={setBudgetModal} /> : null}
        {tab === 'investimentos' ? <Investments onAction={demoAction} /> : null}
      </section>

      <nav className="float-nav" aria-label="Módulos">
        <Link className="fn-home" href="/" prefetch aria-label="Hub">⌂</Link><span className="fn-sep" />
        <button disabled>📊 Início</button><button className="active">💰 Finanças</button><button disabled>📅 Agenda</button>
        <Link className="finance-nav-link" href="/compras" prefetch>🛒 Compras</Link><span className="fn-sep" />
        <button disabled>🐾 Flora</button><button disabled>📁 Docs</button><button className="sos-nav" disabled>🚨 SOS</button>
      </nav>
      {billModal ? <BillModal bill={billModal === 'new' ? null : billModal} categories={categoryOptions} monthIndex={monthIndex} onClose={() => setBillModal(null)} onDelete={deleteBill} onSave={saveBill} onToggle={toggleBill} /> : null}
      {transactionModal ? <TransactionModal transaction={transactionModal === 'new' ? null : transactionModal} categories={categoryOptions} monthIndex={monthIndex} onClose={() => setTransactionModal(null)} onDelete={deleteTransaction} onSave={saveTransaction} /> : null}
      {budgetModal ? <BudgetModal budget={budgetModal === 'new' ? null : budgetModal} onClose={() => setBudgetModal(null)} onDelete={deleteBudget} onSave={saveBudget} /> : null}
    </main>
  )
}

function MonthPicker({ month, monthIndex, onMonth }: { month: string; monthIndex: number; onMonth: (value: number) => void }) {
  return <div className="finance-month-picker"><button onClick={() => onMonth(Math.max(0, monthIndex - 1))}>‹</button><span>{month} / 2026</span><button onClick={() => onMonth(Math.min(11, monthIndex + 1))}>›</button></div>
}

function Overview({ onAction }: { onAction: (action: string) => void }) {
  const categories = [['Moradia', 80, 'blue', 'R$1.800'], ['Alimentação', 55, 'orange', 'R$1.240'], ['Bebê – Tomás', 35, 'green', 'R$780'], ['Saúde', 30, 'purple', 'R$680'], ['Pet – Flora', 18, 'brown', 'R$400'], ['Outros', 25, 'muted', 'R$560']]
  return <>
    <div className="finance-summary-grid">
      <Stat label="Receita Julho" value="R$12.400" tone="income" note="Julio R$8.200 · Carol R$4.200" />
      <Stat label="Despesas Julho" value="R$6.540" tone="expense"><div className="finance-tags"><span>Fixo R$4.100</span><span>Variável R$2.440</span></div></Stat>
      <Stat label="Contas do mês" value="R$8.320"><div className="finance-tags"><span className="paid">R$5.200 pagas</span><span>R$3.120 pend.</span></div></Stat>
      <Stat label="Saldo do mês" value="R$5.860" tone="balance"><div className="finance-tags"><span className="paid">47,2% da receita</span></div></Stat>
    </div>
    <div className="finance-main-grid">
      <article className="finance-card"><header className="finance-section-header"><h2>FLUXO DE CAIXA</h2><div className="finance-legend"><span className="income">■ Receita</span><span className="expense">■ Despesa</span></div></header><div className="finance-chart demo">{[[60,45],[4,55],[4,30],[80,62],[20,38]].map((bars,index) => <div className="finance-chart-column" key={index}><div className="finance-demo-bars"><span style={{height:bars[0]}} /><span style={{height:bars[1]}} /></div><small>{index === 4 ? 'PREV' : `S${index + 1}`}</small></div>)}</div></article>
      <article className="finance-card"><header className="finance-section-header"><h2>GASTOS POR CATEGORIA</h2></header><div className="finance-category-list">{categories.map(([name,width,tone,value]) => <div className="finance-category" key={name}><i className={String(tone)} /><span>{name}</span><div><b className={String(tone)} style={{width:`${width}%`}} /></div><strong>{value}</strong></div>)}</div></article>
    </div>
    <article className="finance-card finance-reserve"><header className="finance-section-header"><div><h2>RESERVA DE EMERGÊNCIA</h2><p>Atualizado em 07/07/2026</p></div><div className="finance-reserve-actions"><span>75% da meta</span><button className="button button-ghost" onClick={() => onAction('Configurar meta')}>⚙ Configurar meta</button></div></header><div className="finance-progress"><span style={{width:'75%'}} /></div><div className="finance-progress-meta"><span>R$22.500 acumulado</span><span>Meta: R$30.000 · ~4 meses</span></div><div className="finance-reserve-grid"><div><span>Saldo atual</span><strong>R$22.500</strong></div><div><span>Meta</span><strong>R$30.000</strong><small>6× custo mensal</small></div><div><span>Aporte médio/mês</span><strong>R$1.875</strong></div></div><div className="finance-reserve-buttons"><button className="button button-primary" onClick={() => onAction('Depositar na reserva')}>+ Depositar na Reserva</button><button className="button button-ghost" onClick={() => onAction('Retirar da reserva')}>− Retirar da Reserva</button></div></article>
  </>
}

function Transactions({ transactions, categories, owner, month, monthIndex, onMonth, onCreate, onEdit }: { transactions: Transaction[]; categories: CategoryOption[]; owner: string; month: string; monthIndex: number; onMonth: (value: number) => void; onCreate: () => void; onEdit: (transaction: Transaction) => void }) {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('Todas categorias')
  const [type, setType] = useState('Todos os tipos')
  const visible = transactions.filter((transaction) => {
    const matchesMonth = transactionAppearsInMonth(transaction, monthIndex)
    const matchesOwner = owner === 'Família' || transaction.owner === owner
    const matchesSearch = transaction.name.toLocaleLowerCase('pt-BR').includes(search.trim().toLocaleLowerCase('pt-BR'))
    const matchesCategory = category === 'Todas categorias' || transaction.category === category
    const matchesType = type === 'Todos os tipos' || (type === 'Receita' ? transaction.type === 'income' : transaction.type === 'expense')
    return matchesMonth && matchesOwner && matchesSearch && matchesCategory && matchesType
  })
  const groups = [
    ['Receitas', visible.filter((item) => item.type === 'income' && item.category !== 'Reserva')],
    ['Despesas', visible.filter((item) => item.type === 'expense' && item.category !== 'Reserva')],
    ['Reserva', visible.filter((item) => item.category === 'Reserva')],
  ] as const

  return <><div className="finance-filter-row"><input className="field" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="🔍  Buscar..." aria-label="Buscar transações" /><select className="field" value={category} onChange={(event) => setCategory(event.target.value)} aria-label="Filtrar por categoria"><option>Todas categorias</option>{categories.map((item) => <option key={item.name}>{item.name}</option>)}</select><select className="field" value={type} onChange={(event) => setType(event.target.value)} aria-label="Filtrar por tipo"><option>Todos os tipos</option><option>Receita</option><option>Despesa</option></select><MonthPicker month={month} monthIndex={monthIndex} onMonth={onMonth} /><button className="button button-primary" onClick={onCreate}>+ Nova</button></div>{visible.length === 0 ? <div className="finance-bill-empty">Nenhuma transação encontrada com estes filtros.</div> : groups.map(([group, items]) => items.length > 0 ? <section className="finance-transaction-group" key={group}><h3>{group}</h3><div>{items.map((item) => <button className="finance-transaction" key={item.id} onClick={() => onEdit(item)}><span className="finance-transaction-icon">{categoryEmoji(item.category, categories)}</span><span><strong>{item.name}</strong><small>{item.category.toUpperCase()} · {item.recurrence !== 'none' ? 'Recorrente · ' : ''}{item.owner}</small></span><span className={item.type}><strong>{item.type === 'income' ? '+' : '−'}{formatMoney(item.amount)}</strong><small>{formatTransactionDate(item, monthIndex)}</small></span></button>)}</div></section> : null)}</>
}

function Bills({ bills, owner, month, monthIndex, onMonth, onCreate, onEdit, onToggle }: { bills: Bill[]; owner: string; month: string; monthIndex: number; onMonth: (value: number) => void; onCreate: () => void; onEdit: (bill: Bill) => void; onToggle: (id: string) => void }) {
  const visible = bills.filter((bill) => appearsInMonth(bill, monthIndex) && (owner === 'Família' || bill.owner === owner))
  const paid = visible.filter((bill) => bill.paidMonths.includes(monthIndex))
  const pending = visible.filter((bill) => !bill.paidMonths.includes(monthIndex))
  const total = visible.reduce((sum, bill) => sum + bill.amount, 0)
  const paidTotal = paid.reduce((sum, bill) => sum + bill.amount, 0)
  const pendingTotal = pending.reduce((sum, bill) => sum + bill.amount, 0)
  const percentage = total > 0 ? Math.round((paidTotal / total) * 100) : 0

  return <><SectionToolbar title="CONTAS" subtitle={`Compromissos recorrentes · ${month} 2026`}><MonthPicker month={month} monthIndex={monthIndex} onMonth={onMonth} /><button className="button button-primary" onClick={onCreate}>+ Conta</button></SectionToolbar><div className="finance-three-grid"><Stat label="Total do mês" value={formatMoney(total)} note={`${visible.length} ${visible.length === 1 ? 'conta' : 'contas'}`} /><Stat label="Já pagas" value={formatMoney(paidTotal)} tone="income" note={`${paid.length} contas · ${percentage}%`} /><Stat label="Pendentes" value={formatMoney(pendingTotal)} tone="accent" note={`${pending.length} contas`} /></div><BillGroup title="⏳ Pendentes" items={pending} monthIndex={monthIndex} onEdit={onEdit} onToggle={onToggle} /><BillGroup title="✅ Pagas" items={paid} monthIndex={monthIndex} onEdit={onEdit} onToggle={onToggle} /></>
}

function Budgets({ budgets, bills, transactions, month, monthIndex, onMonth, onCreate, onEdit }: { budgets: Budget[]; bills: Bill[]; transactions: Transaction[]; month: string; monthIndex: number; onMonth: (value: number) => void; onCreate: () => void; onEdit: (budget: Budget) => void }) {
  const expenses = calculateCategoryExpenses(bills, transactions, monthIndex)
  const budgetNames = new Set(budgets.map((budget) => budget.name))
  const unbudgeted = [...expenses.entries()].filter(([category, amount]) => amount > 0 && !budgetNames.has(category))
  const totalBudgeted = budgets.reduce((sum, budget) => sum + budget.limit, 0)
  const totalSpent = [...expenses.values()].reduce((sum, amount) => sum + amount, 0)
  const available = totalBudgeted - totalSpent

  return <><SectionToolbar title="ORÇAMENTO" subtitle={`Semáforo de controle · ${month} 2026`}><MonthPicker month={month} monthIndex={monthIndex} onMonth={onMonth} /><button className="button button-primary" onClick={onCreate}>+ Categoria</button></SectionToolbar>{budgets.length === 0 ? <div className="finance-bill-empty">Nenhuma categoria possui orçamento definido.</div> : <div className="finance-budget-list">{budgets.map((budget) => {
    const spent = expenses.get(budget.name) ?? 0
    const percentage = budget.limit > 0 ? Math.round((spent / budget.limit) * 100) : 0
    const tone = budgetTone(percentage)
    return <button className="finance-budget-row" key={budget.id} onClick={() => onEdit(budget)}><i className={tone} /><strong><span>{budget.emoji}</span> {budget.name}</strong><div><span className={tone} style={{width:`${Math.min(percentage, 100)}%`}} /></div><span><b className={tone}>{formatMoney(spent)}</b><small>de {formatMoney(budget.limit)} · {percentage}%</small></span></button>
  })}</div>}{unbudgeted.length > 0 ? <section className="finance-unbudgeted"><h3>GASTOS SEM ORÇAMENTO</h3><p>Estas categorias têm despesas no mês, mas ainda não possuem teto definido.</p><div>{unbudgeted.map(([category, amount]) => <span key={category}>{transactionIcon(category)} {category} <strong>{formatMoney(amount)}</strong></span>)}</div></section> : null}<div className="finance-three-grid"><Stat label="Total orçado" value={formatMoney(totalBudgeted)} /><Stat label="Total gasto" value={formatMoney(totalSpent)} tone="expense" /><Stat label={available >= 0 ? 'Disponível' : 'Acima do orçamento'} value={formatMoney(Math.abs(available))} tone={available >= 0 ? 'income' : 'expense'} /></div></>
}

function Investments({ onAction }: { onAction: (action: string) => void }) {
  return <><SectionToolbar title="CARTEIRA DE INVESTIMENTOS" subtitle="Atualização manual · Junho 2026"><button className="button button-primary" onClick={() => onAction('Novo aporte')}>+ Aporte</button></SectionToolbar><div className="finance-summary-grid"><Stat label="Patrimônio total" value="R$34.200" tone="accent"><div className="finance-tags"><span className="paid">+2,3% no mês</span></div></Stat><Stat label="Rendimento acum." value="R$4.200" tone="income" note="12,3% do investido" /><Stat label="Total investido" value="R$30.000" note="Aportes acumulados" /><Stat label="Aporte do mês" value="R$2.000" tone="accent" note="Meta: R$2.500" /></div><div className="finance-investment-grid">{investments.map((item) => <button className="finance-investment-card" key={String(item[0])} onClick={() => onAction('Detalhe do investimento')}><strong>{item[0]}</strong><small>{item[1]}</small><div><span><small>Investido</small><b>{item[2]}</b></span><span><small>Atual</small><b className={item[5] ? 'positive' : 'negative'}>{item[3]}</b><em className={item[5] ? 'positive' : 'negative'}>{item[4]}</em></span></div></button>)}<button className="finance-new-investment" onClick={() => onAction('Novo aporte')}><b>+</b><span>Novo aporte</span></button></div></>
}

function Stat({ label, value, tone = '', note, children }: { label: string; value: string; tone?: string; note?: string; children?: React.ReactNode }) {
  return <article className="finance-card"><span className="finance-card-label">{label}</span><strong className={`finance-value ${tone}`}>{value}</strong>{note ? <p>{note}</p> : null}{children}</article>
}

function SectionToolbar({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return <header className="finance-page-toolbar"><div><h2>{title}</h2><p>{subtitle}</p></div><div>{children}</div></header>
}

function BillGroup({ title, items, monthIndex, onEdit, onToggle }: { title: string; items: Bill[]; monthIndex: number; onEdit: (bill: Bill) => void; onToggle: (id: string) => void }) {
  return <section className="finance-bill-group"><h3>{title}</h3><div>{items.length === 0 ? <div className="finance-bill-empty">Nenhuma conta neste grupo.</div> : items.map((item) => {
    const paid = item.paidMonths.includes(monthIndex)
    const overdue = !paid && monthIndex === 6 && item.dueDay < 7
    return <div className={`finance-bill ${paid ? 'paid' : overdue ? 'overdue' : 'pending'}`} key={item.id}><button className="finance-bill-check" onClick={() => onToggle(item.id)} aria-label={paid ? 'Marcar como pendente' : 'Marcar como paga'}>{paid ? '✓' : ''}</button><button className="finance-bill-detail" onClick={() => onEdit(item)}><span><strong>{item.name}</strong><small>{item.category.toUpperCase()} · {paid ? `Pago em ${String(item.dueDay).padStart(2, '0')}/07` : `Vence dia ${String(item.dueDay).padStart(2, '0')}`} · {item.owner}</small></span><span><b>{formatMoney(item.amount)}</b><small>{paid ? 'Pago ✓' : overdue ? `Vencida há ${7 - item.dueDay} dias` : `Falta ${item.dueDay - 7} dias`}</small></span></button></div>
  })}</div></section>
}

function BudgetModal({ budget, onClose, onDelete, onSave }: { budget: Budget | null; onClose: () => void; onDelete: (id: string) => void; onSave: (budget: Budget) => void }) {
  const [draft, setDraft] = useState<Budget>(budget ?? { id: crypto.randomUUID(), name: '', emoji: '🏠', limit: 0 })
  const emojis = ['🏠', '🛒', '💊', '👶', '🐾', '🎉', '📦', '💳', '🚗', '🍽️', '⚡', '📱', '🎓', '👕', '✈️', '🎁']

  function submit(event: React.FormEvent) {
    event.preventDefault()
    if (!draft.name.trim() || draft.limit <= 0) return
    onSave({ ...draft, name: draft.name.trim() })
  }

  return <div className="modal-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}><section className="modal-card finance-budget-modal" role="dialog" aria-modal="true" aria-label={budget ? 'Editar orçamento' : 'Definir orçamento'}><header><h2>{budget ? 'EDITAR ORÇAMENTO' : 'DEFINIR ORÇAMENTO'}</h2><button onClick={onClose} aria-label="Fechar">×</button></header><form onSubmit={submit}>
    <div className="finance-form-group"><span className="finance-form-label">EMOJI DA CATEGORIA</span><div className="finance-emoji-grid">{emojis.map((emoji) => <button type="button" className={draft.emoji === emoji ? 'selected' : ''} key={emoji} onClick={() => setDraft({ ...draft, emoji })} aria-label={`Usar emoji ${emoji}`}>{emoji}</button>)}</div></div>
    <div className="finance-form-group"><label htmlFor="budget-name">CATEGORIA</label><input id="budget-name" className="field" value={draft.name} placeholder="Ex: Moradia, Alimentação..." onChange={(event) => setDraft({ ...draft, name: event.target.value })} required maxLength={40} autoFocus={!budget} /></div>
    <div className="finance-form-group"><label htmlFor="budget-limit">TETO MENSAL</label><div className="finance-amount-input compact"><span>R$</span><input id="budget-limit" type="number" inputMode="decimal" min="0.01" step="0.01" placeholder="0,00" value={draft.limit || ''} onChange={(event) => setDraft({ ...draft, limit: Number(event.target.value) })} required /></div></div>
    <div className="modal-actions finance-bill-modal-actions">{budget ? <button type="button" className="button button-danger" onClick={() => onDelete(budget.id)}>Excluir</button> : null}<span /><button type="button" className="button button-ghost" onClick={onClose}>Cancelar</button><button className="button button-primary">Salvar</button></div>
  </form></section></div>
}

function TransactionModal({ transaction, categories, monthIndex, onClose, onDelete, onSave }: { transaction: Transaction | null; categories: CategoryOption[]; monthIndex: number; onClose: () => void; onDelete: (id: string) => void; onSave: (transaction: Transaction) => void }) {
  const [draft, setDraft] = useState<Transaction>(transaction ?? { id: crypto.randomUUID(), type: 'expense', name: '', amount: 0, category: 'Moradia', owner: 'Família', recurrence: 'none', date: `2026-${String(monthIndex + 1).padStart(2, '0')}-07`, notes: '' })
  const recurrences: Array<[Recurrence, string]> = [['none', 'Único'], ['weekly', 'Semanal'], ['monthly', 'Mensal'], ['yearly', 'Anual']]

  function submit(event: React.FormEvent) {
    event.preventDefault()
    if (!draft.name.trim() || draft.amount <= 0 || !draft.date) return
    onSave({ ...draft, name: draft.name.trim() })
  }

  return <div className="modal-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}><section className="modal-card finance-bill-modal finance-transaction-modal" role="dialog" aria-modal="true" aria-label={transaction ? 'Detalhe da transação' : 'Nova transação'}><header><h2>{transaction ? 'DETALHE DA TRANSAÇÃO' : 'NOVA TRANSAÇÃO'}</h2><button onClick={onClose} aria-label="Fechar">×</button></header>{transaction ? <div className={`finance-transaction-summary ${draft.type}`}><div><small>{draft.type === 'income' ? 'RECEITA' : 'DESPESA'} · {draft.category.toUpperCase()}</small><strong>{draft.type === 'income' ? '+' : '−'}{formatMoney(draft.amount)}</strong><span>{draft.name}</span></div><div><span>{formatDate(draft.date)}</span><span>{draft.owner} · {recurrenceLabel(draft.recurrence)}</span></div></div> : null}<form onSubmit={submit}>
    <div className="finance-type-toggle"><button type="button" className={draft.type === 'expense' ? 'expense active' : 'expense'} onClick={() => setDraft({ ...draft, type: 'expense' })}>▼ DESPESA</button><button type="button" className={draft.type === 'income' ? 'income active' : 'income'} onClick={() => setDraft({ ...draft, type: 'income' })}>▲ RECEITA</button></div>
    <div className="finance-amount-input"><span>R$</span><input id="transaction-amount" type="number" inputMode="decimal" min="0.01" step="0.01" placeholder="0,00" value={draft.amount || ''} onChange={(event) => setDraft({ ...draft, amount: Number(event.target.value) })} required autoFocus={!transaction} /></div>
    <div className="finance-form-group"><label htmlFor="transaction-name">DESCRIÇÃO</label><input id="transaction-name" className="field" value={draft.name} placeholder="Ex: Mercado, Aluguel, Salário..." onChange={(event) => setDraft({ ...draft, name: event.target.value })} required maxLength={100} /></div>
    <div className="finance-form-group"><span className="finance-form-label">CATEGORIA</span><div className="finance-category-chips">{categories.map((category) => <button type="button" className={draft.category === category.name ? 'selected' : ''} key={category.name} onClick={() => setDraft({ ...draft, category: category.name })}><span>{category.emoji}</span>{category.name}</button>)}</div></div>
    <div className="finance-modal-fields"><div className="finance-form-group"><label htmlFor="transaction-date">DATA</label><input id="transaction-date" className="field" type="date" value={draft.date} onChange={(event) => setDraft({ ...draft, date: event.target.value })} required /></div><div className="finance-form-group"><label htmlFor="transaction-owner">RESPONSÁVEL</label><select id="transaction-owner" className="field" value={draft.owner} onChange={(event) => setDraft({ ...draft, owner: event.target.value })}>{['Família', 'Julio', 'Carol'].map((owner) => <option key={owner}>{owner}</option>)}</select></div></div>
    <div className="finance-form-group"><span className="finance-form-label">RECORRÊNCIA</span><div className="finance-recurrence-options">{recurrences.map(([value, label]) => <button type="button" className={draft.recurrence === value ? 'selected' : ''} key={value} onClick={() => setDraft({ ...draft, recurrence: value })}>{label}</button>)}</div></div>
    <div className="finance-form-group"><label htmlFor="transaction-notes">OBSERVAÇÕES (OPCIONAL)</label><input id="transaction-notes" className="field" value={draft.notes ?? ''} placeholder="Notas adicionais..." onChange={(event) => setDraft({ ...draft, notes: event.target.value })} maxLength={240} /></div>
    <div className="modal-actions finance-bill-modal-actions">{transaction ? <button type="button" className="button button-danger" onClick={() => onDelete(transaction.id)}>Excluir</button> : null}<span /><button type="button" className="button button-ghost" onClick={onClose}>Cancelar</button><button className="button button-primary">{transaction ? 'Salvar alterações' : 'Salvar Transação'}</button></div>
  </form></section></div>
}

function BillModal({ bill, categories, monthIndex, onClose, onDelete, onSave, onToggle }: { bill: Bill | null; categories: CategoryOption[]; monthIndex: number; onClose: () => void; onDelete: (id: string) => void; onSave: (bill: Bill) => void; onToggle: (id: string) => void }) {
  const [draft, setDraft] = useState<Bill>(bill ?? { id: crypto.randomUUID(), name: '', amount: 0, dueDay: 7, category: 'Moradia', owner: 'Família', recurrence: 'none', startMonth: monthIndex, paidMonths: [], notes: '' })
  const paid = draft.paidMonths.includes(monthIndex)
  const recurrences: Array<[Recurrence, string]> = [['none', 'Único'], ['weekly', 'Semanal'], ['monthly', 'Mensal'], ['yearly', 'Anual']]
  const dateValue = `2026-${String(draft.startMonth + 1).padStart(2, '0')}-${String(draft.dueDay).padStart(2, '0')}`

  function submit(event: React.FormEvent) {
    event.preventDefault()
    if (!draft.name.trim() || draft.amount <= 0 || draft.dueDay < 1 || draft.dueDay > 31) return
    onSave({ ...draft, name: draft.name.trim() })
  }

  return <div className="modal-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}><section className="modal-card finance-bill-modal finance-transaction-modal" role="dialog" aria-modal="true" aria-label={bill ? 'Detalhe da conta' : 'Nova conta'}><header><h2>{bill ? 'DETALHE DA CONTA' : 'NOVA CONTA'}</h2><button onClick={onClose} aria-label="Fechar">×</button></header>{bill ? <div className={`finance-bill-modal-summary ${paid ? 'paid' : ''}`}><div><small>{paid ? 'PAGA' : 'PENDENTE'} · {draft.category.toUpperCase()}</small><strong>{formatMoney(draft.amount)}</strong><span>{draft.name}</span></div><button type="button" onClick={() => { onToggle(draft.id); setDraft((current) => ({ ...current, paidMonths: paid ? current.paidMonths.filter((month) => month !== monthIndex) : [...current.paidMonths, monthIndex] })) }}>{paid ? '↶ Marcar pendente' : '✓ Marcar paga'}</button></div> : null}<form onSubmit={submit}>
    <div className="finance-expense-type">▼ DESPESA</div>
    <div className="finance-amount-input"><span>R$</span><input id="bill-amount" type="number" inputMode="decimal" min="0.01" step="0.01" placeholder="0,00" value={draft.amount || ''} onChange={(event) => setDraft({ ...draft, amount: Number(event.target.value) })} required autoFocus={!bill} /></div>
    <div className="finance-form-group"><label htmlFor="bill-name">DESCRIÇÃO</label><input id="bill-name" className="field" value={draft.name} placeholder="Ex: Mercado, Aluguel, Condomínio..." onChange={(event) => setDraft({ ...draft, name: event.target.value })} required maxLength={100} /></div>
    <div className="finance-form-group"><span className="finance-form-label">CATEGORIA</span><div className="finance-category-chips">{categories.map((category) => <button type="button" className={draft.category === category.name ? 'selected' : ''} key={category.name} onClick={() => setDraft({ ...draft, category: category.name })}><span>{category.emoji}</span>{category.name}</button>)}</div></div>
    <div className="finance-modal-fields"><div className="finance-form-group"><label htmlFor="bill-date">DATA</label><input id="bill-date" className="field" type="date" value={dateValue} onChange={(event) => { const date = event.target.valueAsDate; if (date) setDraft({ ...draft, dueDay: date.getUTCDate(), startMonth: date.getUTCMonth() }) }} required /></div><div className="finance-form-group"><label htmlFor="bill-owner">RESPONSÁVEL</label><select id="bill-owner" className="field" value={draft.owner} onChange={(event) => setDraft({ ...draft, owner: event.target.value })}>{['Família', 'Julio', 'Carol'].map((owner) => <option key={owner}>{owner}</option>)}</select></div></div>
    <div className="finance-form-group"><span className="finance-form-label">RECORRÊNCIA</span><div className="finance-recurrence-options">{recurrences.map(([value, label]) => <button type="button" className={draft.recurrence === value ? 'selected' : ''} key={value} onClick={() => setDraft({ ...draft, recurrence: value })}>{label}</button>)}</div></div>
    <div className="finance-form-group"><label htmlFor="bill-notes">OBSERVAÇÕES (OPCIONAL)</label><input id="bill-notes" className="field" value={draft.notes ?? ''} placeholder="Notas adicionais..." onChange={(event) => setDraft({ ...draft, notes: event.target.value })} maxLength={240} /></div>
    <div className="modal-actions finance-bill-modal-actions">{bill ? <button type="button" className="button button-danger" onClick={() => onDelete(bill.id)}>Excluir</button> : null}<span /><button type="button" className="button button-ghost" onClick={onClose}>Cancelar</button><button className="button button-primary">Salvar Conta</button></div>
  </form></section></div>
}

function appearsInMonth(bill: Bill, month: number) {
  if (month < bill.startMonth) return false
  if (bill.recurrence === 'none') return month === bill.startMonth
  if (bill.recurrence === 'bimonthly') return (month - bill.startMonth) % 2 === 0
  if (bill.recurrence === 'yearly') return month === bill.startMonth
  return true
}

function transactionAppearsInMonth(transaction: Transaction, month: number) {
  const startMonth = Number(transaction.date.slice(5, 7)) - 1
  if (month < startMonth) return false
  if (transaction.recurrence === 'none') return month === startMonth
  if (transaction.recurrence === 'bimonthly') return (month - startMonth) % 2 === 0
  if (transaction.recurrence === 'yearly') return month === startMonth
  return true
}

function calculateCategoryExpenses(bills: Bill[], transactions: Transaction[], month: number) {
  const expenses = new Map<string, number>()
  for (const bill of bills) {
    if (!appearsInMonth(bill, month)) continue
    expenses.set(bill.category, (expenses.get(bill.category) ?? 0) + bill.amount)
  }
  for (const transaction of transactions) {
    if (transaction.type !== 'expense' || !transactionAppearsInMonth(transaction, month)) continue
    expenses.set(transaction.category, (expenses.get(transaction.category) ?? 0) + transaction.amount)
  }
  return expenses
}

function budgetTone(percentage: number) {
  if (percentage >= 90) return 'red'
  if (percentage >= 75) return 'yellow'
  return 'green'
}

function transactionIcon(category: string) {
  return ({ Moradia: '🏠', Alimentação: '🛒', Saúde: '💊', Bebê: '👶', Pet: '🐾', Lazer: '🎉', Renda: '💼', Reserva: '🛡️', Outros: '📦' } as Record<string, string>)[category] ?? '📦'
}

function categoryEmoji(category: string, categories: CategoryOption[]) {
  return categories.find((item) => item.name === category)?.emoji ?? transactionIcon(category)
}

function formatTransactionDate(transaction: Transaction, month: number) {
  const day = transaction.date.slice(8, 10)
  return `${day}/${String(month + 1).padStart(2, '0')}/2026`
}

function formatDate(date: string) {
  const [year, month, day] = date.split('-')
  return `${day}/${month}/${year}`
}

function recurrenceLabel(recurrence: Recurrence) {
  return ({ none: 'Único', weekly: 'Semanal', monthly: 'Fixo Mensal', bimonthly: 'Bimestral', yearly: 'Anual' } as Record<Recurrence, string>)[recurrence]
}

function formatMoney(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 2 }).format(value)
}

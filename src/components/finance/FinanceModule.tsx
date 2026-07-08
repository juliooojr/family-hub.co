'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { FinanceBill, FinanceBudget, FinanceTransaction } from '@/lib/finance'

type Tab = 'visao' | 'transacoes' | 'contas' | 'orcamento' | 'investimentos'
type Recurrence = 'none' | 'weekly' | 'monthly' | 'bimonthly' | 'yearly'
type ExpenseKind = 'fixed' | 'variable'
type TransactionType = 'expense' | 'income' | 'reserve_deposit' | 'reserve_withdrawal'
type Transaction = FinanceTransaction
type Budget = FinanceBudget
type CategoryOption = { name: string; emoji: string }

const defaultCategories: CategoryOption[] = [
  { name: 'Cartão', emoji: '💳' }, { name: 'Moradia', emoji: '🏠' },
  { name: 'Alimentação', emoji: '🛒' }, { name: 'Saúde', emoji: '💊' },
  { name: 'Bebê', emoji: '👶' }, { name: 'Pet', emoji: '🐾' },
  { name: 'Lazer', emoji: '🎉' }, { name: 'Renda', emoji: '💼' },
  { name: 'Reserva', emoji: '🛡️' }, { name: 'Outros', emoji: '📦' },
]
type Bill = FinanceBill

const tabs: Array<{ id: Tab; label: string; action: string }> = [
  { id: 'visao', label: 'Visão Geral', action: '+ Transação' },
  { id: 'transacoes', label: 'Transações', action: '+ Transação' },
  { id: 'contas', label: 'Contas', action: '+ Conta' },
  { id: 'orcamento', label: 'Orçamento', action: '+ Categoria' },
  { id: 'investimentos', label: 'Investimentos', action: '+ Aporte' },
]

const investments = [
  ['Tesouro Selic 2029', 'Renda Fixa · Julio', 'R$10.000', 'R$11.240', '+12,4%', true],
  ['CDB Banco Inter 120% CDI', 'Renda Fixa · Carol', 'R$8.000', 'R$8.760', '+9,5%', true],
  ['FII HGLG11', 'FII · Julio', 'R$5.000', 'R$5.480', '+9,6%', true],
  ['Previdência Privada', 'Previdência · Família', 'R$7.000', 'R$6.900', '−1,4%', false],
  ['Ações ITUB4', 'Renda Variável · Carol', 'R$2.000', 'R$1.820', '−9,0%', false],
]

export default function FinanceModule({ familyId, transactions: initialTransactions, bills: initialBills, budgets: initialBudgets, reserveGoal: initialReserveGoal }: { familyId: string; transactions: Transaction[]; bills: Bill[]; budgets: Budget[]; reserveGoal: number }) {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const [tab, setTab] = useState<Tab>('visao')
  const [owner, setOwner] = useState('Família')
  const [monthIndex, setMonthIndex] = useState(() => new Date().getMonth())
  const [notice, setNotice] = useState('')
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions)
  const [transactionModal, setTransactionModal] = useState<Transaction | 'new' | null>(null)
  const [bills, setBills] = useState<Bill[]>(initialBills)
  const [billModal, setBillModal] = useState<Bill | 'new' | null>(null)
  const [budgets, setBudgets] = useState<Budget[]>(initialBudgets)
  const [budgetModal, setBudgetModal] = useState<Budget | 'new' | null>(null)
  const [reserveModal, setReserveModal] = useState<'deposit' | 'withdrawal' | 'goal' | null>(null)
  const [reserveGoal, setReserveGoal] = useState(initialReserveGoal)
  const [exportOpen, setExportOpen] = useState(false)
  const [summariesCollapsed, setSummariesCollapsed] = useState(false)
  const [pendingBillIds, setPendingBillIds] = useState<string[]>([])
  const [refreshing, setRefreshing] = useState(false)
  const touchStartY = useRef<number | null>(null)
  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
  const selectedTab = tabs.find((item) => item.id === tab) ?? tabs[0]
  const activeBudgets = budgets.filter((budget) => budgetAppearsInMonth(budget, monthIndex))
  const categoryOptions = activeBudgets.length > 0
    ? activeBudgets.map((budget) => ({ name: budget.name, emoji: budget.emoji }))
    : defaultCategories

  function demoAction(action: string) {
    setNotice(`${action} será habilitado após a definição e aprovação do schema financeiro.`)
  }

  useEffect(() => {
    if (!refreshing) return
    const timeout = window.setTimeout(() => setRefreshing(false), 900)
    return () => window.clearTimeout(timeout)
  }, [refreshing])

  function startPullRefresh(event: React.TouchEvent<HTMLElement>) {
    if (window.scrollY > 0) return
    touchStartY.current = event.touches[0]?.clientY ?? null
  }

  function finishPullRefresh(event: React.TouchEvent<HTMLElement>) {
    const startY = touchStartY.current
    touchStartY.current = null
    if (startY === null || window.scrollY > 0 || refreshing) return
    const distance = (event.changedTouches[0]?.clientY ?? startY) - startY
    if (distance < 84) return
    setRefreshing(true)
    router.refresh()
  }

  async function saveBill(input: Bill | Bill[]) {
    if (Array.isArray(input)) {
      const rows = input.map((bill) => ({
        id: bill.id, family_id: familyId, name: bill.name, amount: bill.amount, due_day: bill.dueDay,
        category: bill.category, responsible: bill.owner, recurrence: 'none' as const,
        start_date: bill.startDate ?? monthStartDate(bill.startMonth), end_date: null,
        expense_kind: bill.expenseKind, notes: bill.notes || null,
      }))
      const { error } = await supabase.from('finance_bills').insert(rows)
      if (error) return setNotice(`Não foi possível salvar as parcelas: ${error.message}`)
      setBills((current) => [...current, ...input])
      setBillModal(null)
      return
    }

    const bill = input
    const previous = bills.find((item) => item.id === bill.id)
    const shouldVersion = Boolean(previous && previous.startMonth < monthIndex)
    const effectiveStartMonth = shouldVersion ? Math.max(monthIndex, bill.startMonth) : bill.startMonth
    const savedBill = shouldVersion
      ? { ...bill, id: crypto.randomUUID(), startMonth: effectiveStartMonth, endMonth: undefined, paidMonths: bill.paidMonths.filter((month) => month >= effectiveStartMonth) }
      : bill
    if (shouldVersion) {
      const { error: endError } = await supabase.from('finance_bills').update({ end_date: monthStartDate(effectiveStartMonth - 1) }).eq('id', bill.id).eq('family_id', familyId)
      if (endError) return setNotice(`Não foi possível preservar os meses anteriores da conta: ${endError.message}`)
    }
    const { error } = await supabase.from('finance_bills').upsert({
      id: savedBill.id, family_id: familyId, name: savedBill.name, amount: savedBill.amount, due_day: savedBill.dueDay,
      category: savedBill.category, responsible: savedBill.owner, recurrence: savedBill.recurrence,
      start_date: savedBill.startDate ?? monthStartDate(savedBill.startMonth), end_date: savedBill.endMonth === undefined ? null : monthStartDate(savedBill.endMonth),
      expense_kind: savedBill.expenseKind, notes: savedBill.notes || null,
    })
    if (error) return setNotice(`Não foi possível salvar a conta: ${error.message}`)
    setBills((current) => shouldVersion
      ? [...current.map((item) => item.id === bill.id ? { ...item, endMonth: effectiveStartMonth - 1 } : item), savedBill]
      : current.some((item) => item.id === savedBill.id)
        ? current.map((item) => item.id === savedBill.id ? savedBill : item)
        : [...current, savedBill])
    setBillModal(null)
  }

  async function saveTransaction(input: Transaction | Transaction[]) {
    if (Array.isArray(input)) {
      const savedTransactions = input.map((transaction) => ({ ...transaction, expenseKind: undefined }))
      const rows = input.map((transaction) => ({
        id: transaction.id, family_id: familyId, type: transaction.type, name: transaction.name,
        amount: transaction.amount, category: transaction.category, responsible: transaction.owner,
        recurrence: 'none' as const, transaction_date: transaction.date,
        expense_kind: null, notes: transaction.notes || null,
      }))
      const { error } = await supabase.from('finance_transactions').insert(rows)
      if (error) return setNotice(`Não foi possível salvar as parcelas: ${error.message}`)
      setTransactions((current) => [...current, ...savedTransactions])
      setTransactionModal(null)
      return
    }

    const transaction = { ...input, expenseKind: undefined }
    const { error } = await supabase.from('finance_transactions').upsert({
      id: transaction.id, family_id: familyId, type: transaction.type, name: transaction.name,
      amount: transaction.amount, category: transaction.category, responsible: transaction.owner,
      recurrence: transaction.recurrence, transaction_date: transaction.date,
        expense_kind: null, notes: transaction.notes || null,
    })
    if (error) return setNotice(`Não foi possível salvar a transação: ${error.message}`)
    setTransactions((current) => current.some((item) => item.id === transaction.id)
      ? current.map((item) => item.id === transaction.id ? transaction : item)
      : [...current, transaction])
    setTransactionModal(null)
  }

  async function deleteTransaction(id: string) {
    const { error } = await supabase.from('finance_transactions').delete().eq('id', id).eq('family_id', familyId)
    if (error) return setNotice(`Não foi possível excluir a transação: ${error.message}`)
    setTransactions((current) => current.filter((item) => item.id !== id))
    setTransactionModal(null)
  }

  async function saveBudget(budget: Budget) {
    const previous = budgets.find((item) => item.id === budget.id)
    const originalStartMonth = budget.startMonth ?? monthIndex
    const shouldVersion = Boolean(previous && (previous.startMonth ?? 0) < monthIndex)
    const effectiveStartMonth = shouldVersion ? monthIndex : originalStartMonth
    const existingEffectiveBudget = shouldVersion
      ? budgets.find((item) =>
        item.id !== budget.id &&
        (item.startMonth ?? 0) === effectiveStartMonth &&
        item.name.toLocaleLowerCase('pt-BR') === budget.name.toLocaleLowerCase('pt-BR')
      )
      : undefined
    const savedBudget = shouldVersion
      ? { ...budget, id: existingEffectiveBudget?.id ?? crypto.randomUUID(), startMonth: effectiveStartMonth, endMonth: undefined }
      : { ...budget, startMonth: effectiveStartMonth }
    if (previous && previous.name !== savedBudget.name) {
      const effectiveStartDate = monthStartDate(effectiveStartMonth)
      const [{ error: billError }, { error: transactionError }] = await Promise.all([
        supabase.from('finance_bills').update({ category: savedBudget.name }).eq('family_id', familyId).eq('category', previous.name).gte('start_date', effectiveStartDate),
        supabase.from('finance_transactions').update({ category: savedBudget.name }).eq('family_id', familyId).eq('category', previous.name).gte('transaction_date', effectiveStartDate),
      ])
      if (billError || transactionError) return setNotice(`Não foi possível renomear a categoria: ${(billError ?? transactionError)?.message}`)
      setBills((current) => current.map((bill) => bill.category === previous.name && bill.startMonth >= effectiveStartMonth ? { ...bill, category: savedBudget.name } : bill))
      setTransactions((current) => current.map((transaction) => transaction.category === previous.name && transactionMonth(transaction) >= effectiveStartMonth ? { ...transaction, category: savedBudget.name } : transaction))
    }
    if (shouldVersion) {
      const { error: endError } = await supabase.from('finance_budgets').update({ end_date: monthStartDate(effectiveStartMonth - 1) }).eq('id', budget.id).eq('family_id', familyId)
      if (endError) return setNotice(`Não foi possível preservar os meses anteriores da categoria: ${endError.message}`)
    }
    const { error } = await supabase.from('finance_budgets').upsert({
      id: savedBudget.id, family_id: familyId, category: savedBudget.name, emoji: savedBudget.emoji, monthly_limit: savedBudget.limit,
      start_date: monthStartDate(effectiveStartMonth), end_date: savedBudget.endMonth === undefined ? null : monthStartDate(savedBudget.endMonth),
    })
    if (error) return setNotice(`Não foi possível salvar o orçamento: ${error.message}`)
    setBudgets((current) => {
      const endedPrevious = shouldVersion
        ? current.map((item) => item.id === budget.id ? { ...item, endMonth: effectiveStartMonth - 1 } : item)
        : current
      return endedPrevious.some((item) => item.id === savedBudget.id)
        ? endedPrevious.map((item) => item.id === savedBudget.id ? savedBudget : item)
        : [...endedPrevious, savedBudget]
    })
    setBudgetModal(null)
  }

  async function deleteBudget(id: string) {
    const { error } = await supabase.from('finance_budgets').delete().eq('id', id).eq('family_id', familyId)
    if (error) return setNotice(`Não foi possível excluir o orçamento: ${error.message}`)
    setBudgets((current) => current.filter((item) => item.id !== id))
    setBudgetModal(null)
  }

  async function saveReserveMovement(type: 'deposit' | 'withdrawal', amount: number, date: string, notes: string) {
    const transaction: Transaction = {
      id: crypto.randomUUID(),
      type: type === 'deposit' ? 'reserve_deposit' : 'reserve_withdrawal',
      name: type === 'deposit' ? 'Depósito na reserva' : 'Retirada da reserva',
      amount,
      category: 'Reserva',
      owner: 'Família',
      recurrence: 'none',
      date,
      notes,
    }
    const { error } = await supabase.from('finance_transactions').insert({
      id: transaction.id, family_id: familyId, type: transaction.type, name: transaction.name,
      amount, category: 'Reserva', responsible: 'Família', recurrence: 'none', transaction_date: date, notes: notes || null,
    })
    if (error) return setNotice(`Não foi possível registrar a reserva: ${error.message}`)
    setTransactions((current) => [...current, transaction])
    setReserveModal(null)
  }

  async function saveReserveGoal(goal: number) {
    const { error } = await supabase.from('finance_reserve_settings').upsert({ family_id: familyId, goal_amount: goal })
    if (error) return setNotice(`Não foi possível salvar a meta: ${error.message}`)
    setReserveGoal(goal)
    setReserveModal(null)
  }

  function exportFinance(format: 'png' | 'csv' | 'json') {
    const data = buildExportData(transactions, bills, budgets, monthIndex)
    if (format === 'json') downloadBlob(JSON.stringify(data, null, 2), 'family-hub-financeiro.json', 'application/json')
    if (format === 'csv') downloadBlob(`\uFEFF${exportCsv(data)}`, 'family-hub-financeiro.csv', 'text/csv;charset=utf-8')
    if (format === 'png') exportSummaryPng(data)
    setExportOpen(false)
  }

  async function deleteBill(id: string) {
    const { error } = await supabase.from('finance_bills').delete().eq('id', id).eq('family_id', familyId)
    if (error) return setNotice(`Não foi possível excluir a conta: ${error.message}`)
    setBills((current) => current.filter((item) => item.id !== id))
    setBillModal(null)
  }

  async function toggleBill(id: string) {
    const bill = bills.find((item) => item.id === id)
    if (!bill) return
    const monthDate = `2026-${String(monthIndex + 1).padStart(2, '0')}-01`
    const paid = bill.paidMonths.includes(monthIndex)
    setPendingBillIds((current) => current.includes(id) ? current : [...current, id])
    const result = paid
      ? await supabase.from('finance_bill_payments').delete().eq('bill_id', id).eq('month_date', monthDate).eq('family_id', familyId)
      : await supabase.from('finance_bill_payments').upsert({ family_id: familyId, bill_id: id, month_date: monthDate }, { onConflict: 'bill_id,month_date' })
    if (result.error) {
      setPendingBillIds((current) => current.filter((item) => item !== id))
      return setNotice(`Não foi possível atualizar o pagamento: ${result.error.message}`)
    }
    setBills((current) => current.map((item) => item.id !== id ? item : {
      ...item,
      paidMonths: item.paidMonths.includes(monthIndex)
        ? item.paidMonths.filter((month) => month !== monthIndex)
        : [...item.paidMonths, monthIndex],
    }))
    setPendingBillIds((current) => current.filter((item) => item !== id))
    router.refresh()
  }

  return (
    <main className={`finance-shell ${summariesCollapsed ? 'summaries-collapsed' : ''}`} onTouchStart={startPullRefresh} onTouchEnd={finishPullRefresh}>
      <div className={`finance-refresh-indicator ${refreshing ? 'active' : ''}`} aria-hidden="true">Atualizando...</div>
      <header className="finance-topbar">
        <div className="finance-topbar-main">
          <Link className="finance-back" href="/hub" aria-label="Voltar ao início">‹</Link>
          <div className="finance-heading"><h1>FINANCEIRO</h1><p>{months[monthIndex]} 2026</p></div>
          <nav className="finance-tabs" aria-label="Áreas do Financeiro">
            {tabs.map((item) => <button className={tab === item.id ? 'active' : ''} disabled={item.id === 'investimentos'} title={item.id === 'investimentos' ? 'Disponível futuramente' : undefined} key={item.id} onClick={() => { setTab(item.id); setNotice('') }}>{item.label}{item.id === 'investimentos' ? ' 🔒' : ''}</button>)}
          </nav>
        </div>
        <div className="finance-actions">
          <button className="button button-ghost finance-summary-toggle" type="button" onClick={() => setSummariesCollapsed((collapsed) => !collapsed)}>{summariesCollapsed ? 'Mostrar cards' : 'Ocultar cards'}</button>
          <div className="finance-export"><button className="button button-ghost" onClick={() => setExportOpen((open) => !open)} aria-expanded={exportOpen}>Exportar ▾</button>{exportOpen ? <div><button onClick={() => exportFinance('png')}>Imagem PNG</button><button onClick={() => exportFinance('csv')}>Planilha CSV</button><button onClick={() => exportFinance('json')}>Dados JSON</button></div> : null}</div>
          <button className="button button-primary" onClick={() => tab === 'contas' ? setBillModal('new') : tab === 'visao' || tab === 'transacoes' ? setTransactionModal('new') : tab === 'orcamento' ? setBudgetModal('new') : demoAction(selectedTab.action)}>{selectedTab.action}</button>
        </div>
      </header>

      <section className="finance-content">
        {notice ? <div className="finance-notice" role="status">{notice}<button onClick={() => setNotice('')} aria-label="Fechar">×</button></div> : null}
        {tab === 'visao' ? <Overview transactions={transactions} bills={bills} categories={categoryOptions} month={months[monthIndex]} monthIndex={monthIndex} onMonth={setMonthIndex} reserveGoal={reserveGoal} onReserve={setReserveModal} /> : null}
        {tab === 'transacoes' ? <Transactions transactions={transactions} categories={categoryOptions} owner={owner} onOwner={setOwner} month={months[monthIndex]} onMonth={setMonthIndex} monthIndex={monthIndex} onCreate={() => setTransactionModal('new')} onEdit={setTransactionModal} /> : null}
        {tab === 'contas' ? <Bills bills={bills} owner={owner} onOwner={setOwner} month={months[monthIndex]} onMonth={setMonthIndex} monthIndex={monthIndex} pendingBillIds={pendingBillIds} onCreate={() => setBillModal('new')} onEdit={setBillModal} onToggle={toggleBill} /> : null}
        {tab === 'orcamento' ? <Budgets budgets={activeBudgets} bills={bills} transactions={transactions} categories={categoryOptions} month={months[monthIndex]} onMonth={setMonthIndex} monthIndex={monthIndex} onCreate={() => setBudgetModal('new')} onEdit={setBudgetModal} /> : null}
        {tab === 'investimentos' ? <Investments onAction={demoAction} /> : null}
      </section>

      {billModal ? <BillModal bill={billModal === 'new' ? null : billModal} categories={categoryOptions} monthIndex={monthIndex} onClose={() => setBillModal(null)} onDelete={deleteBill} onSave={saveBill} onToggle={toggleBill} /> : null}
      {transactionModal ? <TransactionModal transaction={transactionModal === 'new' ? null : transactionModal} categories={categoryOptions} onClose={() => setTransactionModal(null)} onDelete={deleteTransaction} onSave={saveTransaction} /> : null}
      {budgetModal ? <BudgetModal budget={budgetModal === 'new' ? null : budgetModal} monthIndex={monthIndex} onClose={() => setBudgetModal(null)} onDelete={deleteBudget} onSave={saveBudget} /> : null}
      {reserveModal ? <ReserveModal mode={reserveModal} goal={reserveGoal} balance={calculateReserveBalance(transactions, bills, monthIndex)} averageMonthlyExpenses={calculateAverageMonthlyExpenses(transactions, bills, monthIndex)} onClose={() => setReserveModal(null)} onGoal={saveReserveGoal} onSave={saveReserveMovement} /> : null}
    </main>
  )
}

function MonthPicker({ month, monthIndex, onMonth }: { month: string; monthIndex: number; onMonth: (value: number) => void }) {
  return <div className="finance-month-picker"><button onClick={() => onMonth(Math.max(0, monthIndex - 1))}>‹</button><span>{month} / 2026</span><button onClick={() => onMonth(Math.min(11, monthIndex + 1))}>›</button></div>
}

function Overview({ transactions, bills, categories: categoryOptions, month, monthIndex, onMonth, reserveGoal, onReserve }: { transactions: Transaction[]; bills: Bill[]; categories: CategoryOption[]; month: string; monthIndex: number; onMonth: (month: number) => void; reserveGoal: number; onReserve: (mode: 'deposit' | 'withdrawal' | 'goal') => void }) {
  const summary = calculateMonthSummary(transactions, bills, monthIndex)
  const categories = [...summary.categories.entries()].sort((a, b) => b[1] - a[1])
  const maxCategory = Math.max(...categories.map(([, value]) => value), 1)
  const chartStart = Math.max(0, monthIndex - 5)
  const chartMonths = Array.from({ length: monthIndex - chartStart + 1 }, (_, index) => chartStart + index)
  const chart = chartMonths.map((index) => ({ index, ...calculateMonthSummary(transactions, bills, index) }))
  const chartMax = Math.max(...chart.flatMap((item) => [item.income, item.expenses, Math.abs(item.reserveNet)]), 1)
  const reserveBalance = calculateReserveBalance(transactions, bills, monthIndex)
  const reserveMonth = summary.reserveNet
  const reservePercentage = reserveGoal > 0 ? Math.max(0, Math.round((reserveBalance / reserveGoal) * 100)) : 0
  const balancePercentage = summary.income > 0 ? Math.round((summary.balance / summary.income) * 100) : 0
  const expenseComposition = calculateExpenseComposition(transactions, bills, monthIndex)

  return <>
    <SectionToolbar title="VISÃO GERAL" subtitle={`Resumo financeiro · ${month} 2026`}><MonthPicker month={month} monthIndex={monthIndex} onMonth={onMonth} /></SectionToolbar>
    <div className="finance-summary-grid finance-overview-summary">
      <Stat label={`Receita ${month}`} value={formatMoney(summary.income)} tone="income" note={`${summary.incomeCount} receitas no mês`} />
      <Stat label={`Despesas ${month}`} value={formatMoney(summary.expenses)} tone="expense"><div className="finance-tags"><span>Fixo {formatMoney(summary.fixed)}</span><span>Variável {formatMoney(summary.variable)}</span></div></Stat>
      <Stat label="Saldo do mês" value={formatMoney(summary.balance)} tone={summary.balance >= 0 ? 'balance' : 'expense'}><div className="finance-tags"><span className={summary.balance >= 0 ? 'paid' : ''}>{balancePercentage}% da receita</span></div></Stat>
    </div>
    <ExpenseCompositionCard composition={expenseComposition} />
    <div className="finance-main-grid">
      <article className="finance-card"><header className="finance-section-header"><div><h2>ÚLTIMOS 6 MESES</h2><p>Clique em um mês para focar nele</p></div><div className="finance-legend"><span className="income">■ Receita</span><span className="expense">■ Despesa</span><span className="reserve">■ Reserva</span></div></header><div className="finance-six-month-chart">{chart.map((item) => <button type="button" className={item.index === monthIndex ? 'finance-six-month-column active' : 'finance-six-month-column'} key={item.index} onClick={() => onMonth(item.index)} aria-label={`Ver ${monthShort(item.index)}: receita ${formatMoney(item.income)}, despesa ${formatMoney(item.expenses)}, reserva ${formatMoney(item.reserveNet)}`}><div><span className="income" style={{height:`${Math.max(3, (item.income / chartMax) * 100)}%`}} /><span className="expense" style={{height:`${Math.max(3, (item.expenses / chartMax) * 100)}%`}} /><span className="reserve" style={{height:`${Math.max(3, (Math.abs(item.reserveNet) / chartMax) * 100)}%`}} /></div><small>{monthShort(item.index)}</small><span className="finance-chart-tooltip"><b>{monthShort(item.index)}</b><em><i className="income" /> Receita {formatMoney(item.income)}</em><em><i className="expense" /> Despesa {formatMoney(item.expenses)}</em><em><i className="reserve" /> Reserva {formatMoney(item.reserveNet)}</em></span></button>)}</div></article>
      <article className="finance-card"><header className="finance-section-header"><h2>GASTOS POR CATEGORIA</h2></header>{categories.length === 0 ? <div className="finance-empty-state"><strong>Nenhuma despesa no mês</strong></div> : <div className="finance-category-list">{categories.map(([name, value], index) => <div className="finance-category" key={name}><i className={categoryTone(index)} /><span>{categoryEmoji(name, categoryOptions)} {name}</span><div><b className={categoryTone(index)} style={{width:`${(value / maxCategory) * 100}%`}} /></div><strong>{formatMoney(value)}</strong></div>)}</div>}</article>
    </div>
    <article className="finance-card finance-reserve"><header className="finance-section-header"><div><h2>RESERVA DE EMERGÊNCIA</h2><p>Saldo acumulado até {month} de 2026</p></div><div className="finance-reserve-actions"><span>{reservePercentage}% da meta</span><button className="button button-ghost" onClick={() => onReserve('goal')}>⚙ Configurar meta</button></div></header><div className="finance-progress"><span style={{width:`${Math.min(reservePercentage, 100)}%`}} /></div><div className="finance-progress-meta"><span>{formatMoney(reserveBalance)} acumulado</span><span>Meta: {formatMoney(reserveGoal)}</span></div><div className="finance-reserve-grid"><div><span>Saldo atual</span><strong>{formatMoney(reserveBalance)}</strong></div><div><span>Meta</span><strong>{formatMoney(reserveGoal)}</strong></div><div><span>Movimento no mês</span><strong>{formatMoney(reserveMonth)}</strong></div></div><div className="finance-reserve-buttons"><button className="button button-primary" onClick={() => onReserve('deposit')}>+ Depositar na Reserva</button><button className="button button-ghost" onClick={() => onReserve('withdrawal')}>− Retirar da Reserva</button></div></article>
  </>
}

function Transactions({ transactions, categories, owner, onOwner, month, monthIndex, onMonth, onCreate, onEdit }: { transactions: Transaction[]; categories: CategoryOption[]; owner: string; onOwner: (owner: string) => void; month: string; monthIndex: number; onMonth: (value: number) => void; onCreate: () => void; onEdit: (transaction: Transaction) => void }) {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('Categorias')
  const [type, setType] = useState('Tipos')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const visible = transactions.filter((transaction) => {
    const matchesMonth = transactionAppearsInMonth(transaction, monthIndex)
    const matchesOwner = owner === 'Família' || transaction.owner === owner
    const matchesSearch = transaction.name.toLocaleLowerCase('pt-BR').includes(search.trim().toLocaleLowerCase('pt-BR'))
    const matchesCategory = category === 'Categorias' || transaction.category === category
    const matchesType = type === 'Tipos' || (type === 'Receita' ? transaction.type === 'income' : type === 'Despesa' ? transaction.type === 'expense' : transaction.type === 'reserve_deposit' || transaction.type === 'reserve_withdrawal')
    return matchesMonth && matchesOwner && matchesSearch && matchesCategory && matchesType
  }).sort((a, b) => transactionMonthDate(b, monthIndex).localeCompare(transactionMonthDate(a, monthIndex)))
  const groups = [
    ['Receitas', visible.filter((item) => item.type === 'income' && item.category !== 'Reserva')],
    ['Despesas', visible.filter((item) => item.type === 'expense' && item.category !== 'Reserva')],
    ['Reserva', visible.filter((item) => item.type === 'reserve_deposit' || item.type === 'reserve_withdrawal')],
  ] as const
  const incoming = visible.filter((item) => item.type === 'income')
  const outgoing = visible.filter((item) => item.type === 'expense')
  const incomingTotal = incoming.reduce((sum, item) => sum + item.amount, 0)
  const outgoingTotal = outgoing.reduce((sum, item) => sum + item.amount, 0)
  const spentPercentage = incomingTotal > 0 ? Math.round((outgoingTotal / incomingTotal) * 100) : 0

  return <><div className="finance-mobile-filter-toggle"><button className="button button-ghost" type="button" onClick={() => setFiltersOpen((open) => !open)}>{filtersOpen ? 'Ocultar filtros' : 'Mostrar filtros'}</button><button className="button button-primary" onClick={onCreate}>+ Nova</button></div><div className={`finance-filter-row ${filtersOpen ? 'open' : ''}`}><input className="field" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="🔍  Buscar..." aria-label="Buscar transações" /><select className="field" value={category} onChange={(event) => setCategory(event.target.value)} aria-label="Filtrar por categoria"><option>Categorias</option>{categories.map((item) => <option key={item.name}>{item.name}</option>)}</select><select className="field" value={type} onChange={(event) => setType(event.target.value)} aria-label="Filtrar por tipo"><option>Tipos</option><option>Receita</option><option>Despesa</option><option>Reserva</option></select><OwnerFilter owner={owner} onOwner={onOwner} /><MonthPicker month={month} monthIndex={monthIndex} onMonth={onMonth} /><button className="button button-primary finance-filter-create" onClick={onCreate}>+ Nova</button></div><div className="finance-three-grid"><Stat label="Entradas" value={formatMoney(incomingTotal)} tone="income" note={`${incoming.length} ${incoming.length === 1 ? 'transação' : 'transações'}`} /><Stat label="Saídas" value={formatMoney(outgoingTotal)} tone="expense" note={`${outgoing.length} ${outgoing.length === 1 ? 'transação' : 'transações'}`} /><Stat label="% das entradas" value={`${spentPercentage}%`} tone={spentPercentage >= 100 ? 'expense' : spentPercentage >= 75 ? 'accent' : 'balance'} note={incomingTotal > 0 ? `${formatMoney(outgoingTotal)} de ${formatMoney(incomingTotal)}` : 'sem entradas no filtro'} /></div>{visible.length === 0 ? <div className="finance-bill-empty">Nenhuma transação encontrada com estes filtros.</div> : groups.map(([group, items]) => items.length > 0 ? <section className="finance-transaction-group" key={group}><h3>{group}</h3><div>{items.map((item) => <button className="finance-transaction" key={item.id} onClick={() => onEdit(item)}><span className="finance-transaction-icon">{categoryEmoji(item.category, categories)}</span><span><strong>{item.name}</strong><small>{item.category.toUpperCase()} · {item.recurrence !== 'none' ? 'Recorrente · ' : ''}{item.owner}</small></span><span className={transactionTone(item.type)}><strong>{transactionSign(item.type)}{formatMoney(item.amount)}</strong><small>{formatTransactionDate(item, monthIndex)}</small></span></button>)}</div></section> : null)}</>
}

function ExpenseCompositionCard({ composition }: { composition: ReturnType<typeof calculateExpenseComposition> }) {
  const items = [
    { label: 'Fixos', value: composition.fixed, note: 'contas e transações fixas', tone: 'green' },
    { label: 'Variáveis recorrentes', value: composition.recurringVariable, note: 'contas previsíveis que variam', tone: 'orange' },
    { label: 'Transações avulsas', value: composition.oneOffVariable, note: 'despesas pontuais do mês', tone: 'blue' },
  ]
  const total = Math.max(composition.total, 0)
  return <article className="finance-card finance-expense-composition">
    <header className="finance-section-header"><div><h2>COMPOSIÇÃO DAS DESPESAS</h2><p>Distribui o total gasto no mês por tipo</p></div><strong>{formatMoney(composition.total)}</strong></header>
    <div>{items.map((item) => {
      const percentage = total > 0 ? Math.round((item.value / total) * 100) : 0
      return <div className="finance-expense-composition-row" key={item.label}><span>{item.label}</span><strong>{percentage}%</strong><div><b className={item.tone} style={{ width: `${percentage}%` }} /></div><small>{formatMoney(item.value)} · {item.note}</small></div>
    })}</div>
  </article>
}

function Bills({ bills, owner, onOwner, month, monthIndex, pendingBillIds, onMonth, onCreate, onEdit, onToggle }: { bills: Bill[]; owner: string; onOwner: (owner: string) => void; month: string; monthIndex: number; pendingBillIds: string[]; onMonth: (value: number) => void; onCreate: () => void; onEdit: (bill: Bill) => void; onToggle: (id: string) => void }) {
  const visible = bills.filter((bill) => appearsInMonth(bill, monthIndex) && (owner === 'Família' || bill.owner === owner))
  const paid = visible.filter((bill) => bill.paidMonths.includes(monthIndex))
  const pending = visible.filter((bill) => !bill.paidMonths.includes(monthIndex))
  const total = visible.reduce((sum, bill) => sum + bill.amount, 0)
  const paidTotal = paid.reduce((sum, bill) => sum + bill.amount, 0)
  const pendingTotal = pending.reduce((sum, bill) => sum + bill.amount, 0)
  const percentage = total > 0 ? Math.round((paidTotal / total) * 100) : 0

  return <><SectionToolbar title="CONTAS" subtitle={`Compromissos recorrentes · ${month} 2026`}><OwnerFilter owner={owner} onOwner={onOwner} /><MonthPicker month={month} monthIndex={monthIndex} onMonth={onMonth} /><button className="button button-primary" onClick={onCreate}>+ Conta</button></SectionToolbar><div className="finance-three-grid"><Stat label="Total do mês" value={formatMoney(total)} note={`${visible.length} ${visible.length === 1 ? 'conta' : 'contas'}`} /><Stat label="Já pagas" value={formatMoney(paidTotal)} tone="income" note={`${paid.length} contas · ${percentage}%`} /><Stat label="Pendentes" value={formatMoney(pendingTotal)} tone="accent" note={`${pending.length} contas`} /></div><BillGroup title="⏳ Pendentes" items={pending} monthIndex={monthIndex} pendingBillIds={pendingBillIds} onEdit={onEdit} onToggle={onToggle} /><BillGroup title="✅ Pagas" items={paid} monthIndex={monthIndex} pendingBillIds={pendingBillIds} onEdit={onEdit} onToggle={onToggle} /></>
}

function Budgets({ budgets, bills, transactions, categories, month, monthIndex, onMonth, onCreate, onEdit }: { budgets: Budget[]; bills: Bill[]; transactions: Transaction[]; categories: CategoryOption[]; month: string; monthIndex: number; onMonth: (value: number) => void; onCreate: () => void; onEdit: (budget: Budget) => void }) {
  const [expandedBudgetId, setExpandedBudgetId] = useState<string | null>(null)
  const expenses = calculateCategoryExpenses(bills, transactions, monthIndex)
  const budgetNames = new Set(budgets.map((budget) => budget.name))
  const unbudgeted = [...expenses.entries()].filter(([category, amount]) => amount > 0 && !budgetNames.has(category))
  const planning = calculateBudgetPlanning(transactions, bills, budgets, expenses, monthIndex)

  return <><SectionToolbar title="ORÇAMENTO" subtitle={`Semáforo de controle · ${month} 2026`}><MonthPicker month={month} monthIndex={monthIndex} onMonth={onMonth} /><button className="button button-primary" onClick={onCreate}>+ Categoria</button></SectionToolbar><BudgetPlanningCards planning={planning} />{budgets.length === 0 ? <div className="finance-bill-empty">Nenhuma categoria possui orçamento definido.</div> : <div className="finance-budget-list">{budgets.map((budget) => {
    const spent = expenses.get(budget.name) ?? 0
    const percentage = budget.limit > 0 ? Math.round((spent / budget.limit) * 100) : 0
    const tone = budgetTone(percentage)
    const expanded = expandedBudgetId === budget.id
    const breakdown = budgetBreakdown(budget.name, bills, transactions, monthIndex)
    return <article className={`finance-budget-item ${expanded ? 'open' : ''}`} key={budget.id}><button className="finance-budget-row" onClick={() => setExpandedBudgetId(expanded ? null : budget.id)} aria-expanded={expanded}><i className={tone} /><strong><span>{budget.emoji}</span> {budget.name}</strong><div><span className={tone} style={{width:`${Math.min(percentage, 100)}%`}} /></div><span><b className={tone}>{formatMoney(spent)}</b><small>de {formatMoney(budget.limit)} · {percentage}%</small></span><em aria-hidden="true">⌄</em></button>{expanded ? <div className="finance-budget-breakdown"><header><span>{breakdown.length} {breakdown.length === 1 ? 'item' : 'itens'} em {month}</span><button type="button" className="button button-ghost" onClick={() => onEdit(budget)}>Editar categoria</button></header>{breakdown.length === 0 ? <p>Nenhum lançamento nesta categoria para o mês selecionado.</p> : <div>{breakdown.map((item) => <div className="finance-budget-breakdown-row" key={item.id}><span><strong>{item.name}</strong><small>{item.source} · {item.owner} · {item.date}</small></span><b>{formatMoney(item.amount)}</b></div>)}</div>}</div> : null}</article>
  })}</div>}{unbudgeted.length > 0 ? <section className="finance-unbudgeted"><h3>GASTOS SEM ORÇAMENTO</h3><p>Estas categorias têm despesas no mês, mas ainda não possuem teto definido.</p><div>{unbudgeted.map(([category, amount]) => <span key={category}>{categoryEmoji(category, categories)} {category} <strong>{formatMoney(amount)}</strong></span>)}</div></section> : null}</>
}

function BudgetPlanningCards({ planning }: { planning: ReturnType<typeof calculateBudgetPlanning> }) {
  const budgetShare = planning.income > 0 ? Math.round((planning.totalBudgeted / planning.income) * 100) : 0
  return <div className="finance-summary-grid finance-budget-planning">
    <Stat label="Receita do mês" value={formatMoney(planning.income)} tone="income" note={`${planning.incomeCount} ${planning.incomeCount === 1 ? 'receita' : 'receitas'}`} />
    <Stat label="Total orçado" value={formatMoney(planning.totalBudgeted)} tone="accent" note={planning.income > 0 ? `${budgetShare}% da receita` : 'sem receita registrada'} />
    <Stat label="Gasto orçado" value={formatMoney(planning.budgetedSpent)} tone="expense" note={`${formatMoney(Math.abs(planning.budgetRemaining))} ${planning.budgetRemaining >= 0 ? 'restantes' : 'acima do orçado'}`} />
    <Stat label={planning.plannedMargin >= 0 ? 'Folga planejada' : 'Receita excedida'} value={formatMoney(Math.abs(planning.plannedMargin))} tone={planning.plannedMargin >= 0 ? 'balance' : 'expense'} note={planning.plannedMargin >= 0 ? 'receita ainda sem destino fixo' : 'orçamento maior que receita'} />
  </div>
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

function OwnerFilter({ owner, onOwner }: { owner: string; onOwner: (owner: string) => void }) {
  return <div className="finance-owners" aria-label="Filtrar por responsável">{['Família', 'Julio', 'Carol'].map((name) => <button type="button" className={owner === name ? 'active' : ''} key={name} onClick={() => onOwner(name)}>{name}</button>)}</div>
}

function ExpenseKindField({ value, onChange }: { value: ExpenseKind; onChange: (value: ExpenseKind) => void }) {
  return <div className="finance-form-group"><span className="finance-form-label">TIPO DE GASTO</span><div className="finance-recurrence-options"><button type="button" className={value === 'fixed' ? 'selected' : ''} onClick={() => onChange('fixed')}>Fixo</button><button type="button" className={value === 'variable' ? 'selected' : ''} onClick={() => onChange('variable')}>Variável</button></div></div>
}

function BillGroup({ title, items, monthIndex, pendingBillIds, onEdit, onToggle }: { title: string; items: Bill[]; monthIndex: number; pendingBillIds: string[]; onEdit: (bill: Bill) => void; onToggle: (id: string) => void }) {
  return <section className="finance-bill-group"><h3>{title}</h3><div>{items.length === 0 ? <div className="finance-bill-empty">Nenhuma conta neste grupo.</div> : items.map((item) => {
    const paid = item.paidMonths.includes(monthIndex)
    const overdue = !paid && monthIndex === 6 && item.dueDay < 7
    const pending = pendingBillIds.includes(item.id)
    return <div className={`finance-bill ${paid ? 'paid' : overdue ? 'overdue' : 'pending'} ${pending ? 'updating' : ''}`} key={item.id}><button className="finance-bill-check" onClick={() => onToggle(item.id)} disabled={pending} aria-label={pending ? 'Atualizando pagamento' : paid ? 'Marcar como pendente' : 'Marcar como paga'}>{pending ? '' : paid ? '✓' : ''}</button><button className="finance-bill-detail" onClick={() => onEdit(item)} disabled={pending}><span><strong>{item.name}</strong><small>{item.category.toUpperCase()} · {item.expenseKind === 'fixed' ? 'Fixo' : 'Variável'} · {paid ? `Pago em ${String(item.dueDay).padStart(2, '0')}/07` : `Vence dia ${String(item.dueDay).padStart(2, '0')}`} · {item.owner}</small></span><span><b>{formatMoney(item.amount)}</b><small>{pending ? 'Atualizando...' : paid ? 'Pago ✓' : overdue ? `Vencida há ${7 - item.dueDay} dias` : `Falta ${item.dueDay - 7} dias`}</small></span></button></div>
  })}</div></section>
}

function BudgetModal({ budget, monthIndex, onClose, onDelete, onSave }: { budget: Budget | null; monthIndex: number; onClose: () => void; onDelete: (id: string) => void; onSave: (budget: Budget) => void }) {
  const [draft, setDraft] = useState<Budget>(budget ?? { id: crypto.randomUUID(), name: '', emoji: '🏠', limit: 0 })
  const emojis = ['🏠', '🛒', '💊', '👶', '🐾', '🎉', '📦', '💳', '🚗', '🍽️', '⚡', '📱', '🎓', '👕', '✈️', '🎁']

  function submit(event: React.FormEvent) {
    event.preventDefault()
    if (!draft.name.trim() || draft.limit <= 0) return
    onSave({ ...draft, name: draft.name.trim(), startMonth: draft.startMonth ?? monthIndex })
  }

  return <div className="modal-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}><section className="modal-card finance-budget-modal" role="dialog" aria-modal="true" aria-label={budget ? 'Editar orçamento' : 'Definir orçamento'}><header><h2>{budget ? 'EDITAR ORÇAMENTO' : 'DEFINIR ORÇAMENTO'}</h2><button onClick={onClose} aria-label="Fechar">×</button></header><form onSubmit={submit}>
    <div className="finance-form-group"><span className="finance-form-label">EMOJI DA CATEGORIA</span><div className="finance-emoji-grid">{emojis.map((emoji) => <button type="button" className={draft.emoji === emoji ? 'selected' : ''} key={emoji} onClick={() => setDraft({ ...draft, emoji })} aria-label={`Usar emoji ${emoji}`}>{emoji}</button>)}</div></div>
    <div className="finance-form-group"><label htmlFor="budget-name">CATEGORIA</label><input id="budget-name" className="field" value={draft.name} placeholder="Ex: Moradia, Alimentação..." onChange={(event) => setDraft({ ...draft, name: event.target.value })} required maxLength={40} /></div>
    <div className="finance-form-group"><label htmlFor="budget-limit">TETO MENSAL</label><div className="finance-amount-input compact"><span>R$</span><input id="budget-limit" type="number" inputMode="decimal" min="0.01" step="0.01" placeholder="0,00" value={draft.limit || ''} onChange={(event) => setDraft({ ...draft, limit: Number(event.target.value) })} required /></div></div>
    <div className="modal-actions finance-bill-modal-actions">{budget ? <button type="button" className="button button-danger" onClick={() => onDelete(budget.id)}>Excluir</button> : null}<span /><button type="button" className="button button-ghost" onClick={onClose}>Cancelar</button><button className="button button-primary">Salvar</button></div>
  </form></section></div>
}

function ReserveModal({ mode, goal, balance, averageMonthlyExpenses, onClose, onGoal, onSave }: { mode: 'deposit' | 'withdrawal' | 'goal'; goal: number; balance: number; averageMonthlyExpenses: number; onClose: () => void; onGoal: (goal: number) => void; onSave: (type: 'deposit' | 'withdrawal', amount: number, date: string, notes: string) => void }) {
  const [amount, setAmount] = useState(mode === 'goal' ? goal : 0)
  const initialCoverage = [3, 6, 9, 12].find((months) => Math.abs(goal / months - averageMonthlyExpenses) < 1) ?? 6
  const [monthlyCost, setMonthlyCost] = useState(mode === 'goal' ? Math.round(goal / initialCoverage) : 0)
  const [coverageMonths, setCoverageMonths] = useState(initialCoverage)
  const [plannedMonthly, setPlannedMonthly] = useState(mode === 'goal' ? Math.max(0, Math.round((goal - balance) / 4)) : 0)
  const [date, setDate] = useState(localISODate())
  const [notes, setNotes] = useState('')
  const title = mode === 'goal' ? 'CONFIGURAR RESERVA' : mode === 'deposit' ? 'DEPOSITAR NA RESERVA' : 'RETIRAR DA RESERVA'
  const calculatedGoal = Math.max(0, monthlyCost * coverageMonths)
  const remaining = Math.max(0, calculatedGoal - balance)
  const monthsToGoal = plannedMonthly > 0 ? Math.ceil(remaining / plannedMonthly) : null

  function submit(event: React.FormEvent) {
    event.preventDefault()
    if (mode === 'goal') {
      if (calculatedGoal <= 0) return
      onGoal(calculatedGoal)
      return
    }
    if (amount <= 0) return
    onSave(mode, amount, date, notes.trim())
  }

  return <div className="modal-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}><section className={mode === 'goal' ? 'modal-card finance-reserve-config-modal' : 'modal-card finance-budget-modal'} role="dialog" aria-modal="true" aria-label={title}><header><h2>{title}</h2><button onClick={onClose} aria-label="Fechar">×</button></header><form onSubmit={submit}>
    {mode === 'goal' ? <>
      <div className="finance-reserve-help"><span>Como funciona</span><p>Use a categoria <strong>Reserva</strong> ao registrar uma transação ou conta paga para somar ou retirar do saldo automaticamente.</p></div>
      <div className="finance-form-group"><label htmlFor="reserve-monthly-cost">CUSTO MENSAL DA FAMÍLIA (R$)</label><div className="finance-amount-input compact"><span>R$</span><input id="reserve-monthly-cost" type="number" inputMode="decimal" min="0.01" step="0.01" value={monthlyCost || ''} onChange={(event) => setMonthlyCost(Number(event.target.value))} autoFocus required /></div><small className="finance-helper-text">Média dos últimos 3 meses: {formatMoney(averageMonthlyExpenses)}</small></div>
      <div className="finance-form-group"><span className="finance-form-label">MESES DE COBERTURA</span><div className="finance-coverage-options">{[3, 6, 9, 12].map((months) => <button type="button" className={coverageMonths === months ? 'selected' : ''} key={months} onClick={() => setCoverageMonths(months)}>{months} meses</button>)}</div></div>
      <div className="finance-calculated-goal"><span>Meta calculada</span><strong>{formatMoney(calculatedGoal)}</strong></div>
      <div className="finance-form-group"><label htmlFor="reserve-planned-monthly">APORTE MENSAL PLANEJADO (R$)</label><div className="finance-amount-input compact"><span>R$</span><input id="reserve-planned-monthly" type="number" inputMode="decimal" min="0" step="0.01" placeholder="0,00" value={plannedMonthly || ''} onChange={(event) => setPlannedMonthly(Number(event.target.value))} /></div><small className="finance-helper-text">{plannedMonthly > 0 ? `Com ${formatMoney(plannedMonthly)}/mês atingirá a meta em ~${monthsToGoal ?? 0} ${monthsToGoal === 1 ? 'mês' : 'meses'}` : 'Informe um aporte mensal para estimar o prazo até a meta.'}</small></div>
    </> : <>
      <div className="finance-form-group"><label htmlFor="reserve-amount">VALOR</label><div className="finance-amount-input compact"><span>R$</span><input id="reserve-amount" type="number" inputMode="decimal" min="0.01" step="0.01" placeholder="0,00" value={amount || ''} onChange={(event) => setAmount(Number(event.target.value))} autoFocus required /></div></div>
      <div className="finance-form-group"><label htmlFor="reserve-date">DATA</label><input id="reserve-date" className="field" type="date" value={date} onChange={(event) => setDate(event.target.value)} required /></div>
      <div className="finance-form-group"><label htmlFor="reserve-notes">OBSERVAÇÕES (OPCIONAL)</label><input id="reserve-notes" className="field" value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Ex: aporte mensal, valor extraordinário..." maxLength={240} /></div>
    </>}
    <div className="modal-actions finance-bill-modal-actions"><span /><button type="button" className="button button-ghost" onClick={onClose}>Cancelar</button><button className="button button-primary">{mode === 'goal' ? 'Salvar configuração' : 'Salvar'}</button></div></form></section></div>
}

function TransactionModal({ transaction, categories, onClose, onDelete, onSave }: { transaction: Transaction | null; categories: CategoryOption[]; onClose: () => void; onDelete: (id: string) => void; onSave: (transaction: Transaction | Transaction[]) => void }) {
  const initialCategory = categories[0]?.name ?? 'Outros'
  const [draft, setDraft] = useState<Transaction>(transaction ?? { id: crypto.randomUUID(), type: 'expense', name: '', amount: 0, category: initialCategory, owner: 'Família', recurrence: 'none', date: localISODate(), notes: '' })
  const recurrences: Array<[Recurrence, string]> = [['none', 'Único'], ['weekly', 'Semanal'], ['monthly', 'Mensal'], ['yearly', 'Anual']]
  const [customInstallments, setCustomInstallments] = useState(0)

  function submit(event: React.FormEvent) {
    event.preventDefault()
    if (!draft.name.trim() || draft.amount <= 0 || !draft.date) return
    const cleanDraft = { ...draft, name: draft.name.trim(), category: draft.type === 'income' ? 'Receita' : draft.category }
    if (!transaction && customInstallments > 1) {
      const installmentAmount = Number((cleanDraft.amount / customInstallments).toFixed(2))
      const lastAmount = Number((cleanDraft.amount - installmentAmount * (customInstallments - 1)).toFixed(2))
      onSave(Array.from({ length: customInstallments }, (_, index) => ({
        ...cleanDraft,
        id: crypto.randomUUID(),
        name: `${cleanDraft.name} ${index + 1}/${customInstallments}`,
        amount: index === customInstallments - 1 ? lastAmount : installmentAmount,
        recurrence: 'none',
        date: addMonthsToISODate(cleanDraft.date, index + 1),
        notes: cleanDraft.notes?.trim() || `Parcela ${index + 1}/${customInstallments}`,
      })))
      return
    }
    onSave(cleanDraft)
  }

  const isReserve = draft.type === 'reserve_deposit' || draft.type === 'reserve_withdrawal'
  return <div className="modal-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}><section className="modal-card finance-bill-modal finance-transaction-modal" role="dialog" aria-modal="true" aria-label={transaction ? 'Detalhe da transação' : 'Nova transação'}><header><h2>{transaction ? 'DETALHE DA TRANSAÇÃO' : 'NOVA TRANSAÇÃO'}</h2><button onClick={onClose} aria-label="Fechar">×</button></header>{transaction ? <div className={`finance-transaction-summary ${transactionTone(draft.type)}`}><div><small>{transactionTypeLabel(draft.type)} · {draft.category.toUpperCase()}</small><strong>{transactionSign(draft.type)}{formatMoney(draft.amount)}</strong><span>{draft.name}</span></div><div><span>{formatDate(draft.date)}</span><span>{draft.owner} · {recurrenceLabel(draft.recurrence)}</span></div></div> : null}<form onSubmit={submit}>
    <div className="finance-type-toggle">{isReserve ? <><button type="button" className={draft.type === 'reserve_deposit' ? 'income active' : 'income'} onClick={() => setDraft({ ...draft, type: 'reserve_deposit' })}>▲ DEPÓSITO</button><button type="button" className={draft.type === 'reserve_withdrawal' ? 'expense active' : 'expense'} onClick={() => setDraft({ ...draft, type: 'reserve_withdrawal' })}>▼ RETIRADA</button></> : <><button type="button" className={draft.type === 'expense' ? 'expense active' : 'expense'} onClick={() => setDraft({ ...draft, type: 'expense', category: draft.category === 'Receita' ? initialCategory : draft.category })}>▼ DESPESA</button><button type="button" className={draft.type === 'income' ? 'income active' : 'income'} onClick={() => setDraft({ ...draft, type: 'income', category: 'Receita' })}>▲ RECEITA</button></>}</div>
    <div className="finance-amount-input"><span>R$</span><input id="transaction-amount" type="number" inputMode="decimal" min="0.01" step="0.01" placeholder="0,00" value={draft.amount || ''} onChange={(event) => setDraft({ ...draft, amount: Number(event.target.value) })} required /></div>
    <div className="finance-form-group"><label htmlFor="transaction-name">DESCRIÇÃO</label><input id="transaction-name" className="field" value={draft.name} placeholder="Ex: Mercado, Aluguel, Salário..." onChange={(event) => setDraft({ ...draft, name: event.target.value })} required maxLength={100} /></div>
    {draft.type !== 'income' ? <div className="finance-form-group"><span className="finance-form-label">CATEGORIA</span><div className="finance-category-chips">{categories.map((category) => <button type="button" className={draft.category === category.name ? 'selected' : ''} key={category.name} onClick={() => setDraft({ ...draft, category: category.name, type: category.name === 'Reserva' ? 'reserve_deposit' : isReserve ? 'expense' : draft.type })}><span>{category.emoji}</span>{category.name}</button>)}</div></div> : <div className="finance-income-note">Receitas entram no resumo do mês sem categoria de orçamento.</div>}
    <div className="finance-modal-fields"><div className="finance-form-group"><label htmlFor="transaction-date">DATA</label><input id="transaction-date" className="field" type="date" value={draft.date} onChange={(event) => setDraft({ ...draft, date: event.target.value })} required /></div><div className="finance-form-group"><label htmlFor="transaction-owner">RESPONSÁVEL</label><select id="transaction-owner" className="field" value={draft.owner} onChange={(event) => setDraft({ ...draft, owner: event.target.value })}>{['Família', 'Julio', 'Carol'].map((owner) => <option key={owner}>{owner}</option>)}</select></div></div>
    <div className="finance-form-group"><span className="finance-form-label">RECORRÊNCIA</span><div className="finance-recurrence-options">{recurrences.map(([value, label]) => <button type="button" className={customInstallments === 0 && draft.recurrence === value ? 'selected' : ''} key={value} onClick={() => { setCustomInstallments(0); setDraft({ ...draft, recurrence: value }) }}>{label}</button>)}{!transaction ? <button type="button" className={customInstallments > 1 ? 'selected' : ''} onClick={() => { setCustomInstallments(customInstallments > 1 ? 0 : 10); setDraft({ ...draft, recurrence: 'none' }) }}>Personalizado</button> : null}</div></div>
    {!transaction && customInstallments > 1 ? <div className="finance-form-group"><label htmlFor="transaction-installments">QUANTIDADE DE PARCELAS</label><input id="transaction-installments" className="field" type="number" min="2" max="60" value={customInstallments} onChange={(event) => setCustomInstallments(Math.max(2, Number(event.target.value) || 2))} /><small className="finance-helper-text">A primeira parcela entra no próximo mês. O valor será dividido e a descrição receberá 1/{customInstallments}, 2/{customInstallments}...</small></div> : null}
    <div className="finance-form-group"><label htmlFor="transaction-notes">OBSERVAÇÕES (OPCIONAL)</label><input id="transaction-notes" className="field" value={draft.notes ?? ''} placeholder="Notas adicionais..." onChange={(event) => setDraft({ ...draft, notes: event.target.value })} maxLength={240} /></div>
    <div className="modal-actions finance-bill-modal-actions">{transaction ? <button type="button" className="button button-danger" onClick={() => onDelete(transaction.id)}>Excluir</button> : null}<span /><button type="button" className="button button-ghost" onClick={onClose}>Cancelar</button><button className="button button-primary">{transaction ? 'Salvar alterações' : 'Salvar Transação'}</button></div>
  </form></section></div>
}

function BillModal({ bill, categories, monthIndex, onClose, onDelete, onSave, onToggle }: { bill: Bill | null; categories: CategoryOption[]; monthIndex: number; onClose: () => void; onDelete: (id: string) => void; onSave: (bill: Bill | Bill[]) => void; onToggle: (id: string) => void }) {
  const initialCategory = categories[0]?.name ?? 'Outros'
  const today = localDateParts()
  const [draft, setDraft] = useState<Bill>(bill ?? { id: crypto.randomUUID(), name: '', amount: 0, dueDay: today.day, category: initialCategory, owner: 'Família', recurrence: 'none', startMonth: today.month, paidMonths: [], notes: '', expenseKind: 'fixed' })
  const paid = draft.paidMonths.includes(monthIndex)
  const recurrences: Array<[Recurrence, string]> = [['none', 'Único'], ['weekly', 'Semanal'], ['monthly', 'Mensal'], ['yearly', 'Anual']]
  const [customInstallments, setCustomInstallments] = useState(0)
  const dateValue = `2026-${String(draft.startMonth + 1).padStart(2, '0')}-${String(draft.dueDay).padStart(2, '0')}`

  function submit(event: React.FormEvent) {
    event.preventDefault()
    if (!draft.name.trim() || draft.amount <= 0 || draft.dueDay < 1 || draft.dueDay > 31) return
    if (!bill && customInstallments > 1) {
      const installmentAmount = Number((draft.amount / customInstallments).toFixed(2))
      const lastAmount = Number((draft.amount - installmentAmount * (customInstallments - 1)).toFixed(2))
      onSave(Array.from({ length: customInstallments }, (_, index) => {
        const startDate = addMonthsToMonthStart(dateValue, index + 1)
        return {
          ...draft,
          id: crypto.randomUUID(),
          name: `${draft.name.trim()} ${index + 1}/${customInstallments}`,
          amount: index === customInstallments - 1 ? lastAmount : installmentAmount,
          recurrence: 'none',
          startDate,
          startMonth: Number(startDate.slice(5, 7)) - 1,
          paidMonths: [],
          notes: draft.notes?.trim() || `Parcela ${index + 1}/${customInstallments}`,
        }
      }))
      return
    }
    onSave({ ...draft, name: draft.name.trim() })
  }

  return <div className="modal-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}><section className="modal-card finance-bill-modal finance-transaction-modal" role="dialog" aria-modal="true" aria-label={bill ? 'Detalhe da conta' : 'Nova conta'}><header><h2>{bill ? 'DETALHE DA CONTA' : 'NOVA CONTA'}</h2><button onClick={onClose} aria-label="Fechar">×</button></header>{bill ? <div className={`finance-bill-modal-summary ${paid ? 'paid' : ''}`}><div><small>{paid ? 'PAGA' : 'PENDENTE'} · {draft.category.toUpperCase()}</small><strong>{formatMoney(draft.amount)}</strong><span>{draft.name}</span></div><button type="button" onClick={() => { onToggle(draft.id); setDraft((current) => ({ ...current, paidMonths: paid ? current.paidMonths.filter((month) => month !== monthIndex) : [...current.paidMonths, monthIndex] })) }}>{paid ? '↶ Marcar pendente' : '✓ Marcar paga'}</button></div> : null}<form onSubmit={submit}>
    <div className="finance-expense-type">▼ DESPESA</div>
    <div className="finance-amount-input"><span>R$</span><input id="bill-amount" type="number" inputMode="decimal" min="0.01" step="0.01" placeholder="0,00" value={draft.amount || ''} onChange={(event) => setDraft({ ...draft, amount: Number(event.target.value) })} required /></div>
    <div className="finance-form-group"><label htmlFor="bill-name">DESCRIÇÃO</label><input id="bill-name" className="field" value={draft.name} placeholder="Ex: Mercado, Aluguel, Condomínio..." onChange={(event) => setDraft({ ...draft, name: event.target.value })} required maxLength={100} /></div>
    <div className="finance-form-group"><span className="finance-form-label">CATEGORIA</span><div className="finance-category-chips">{categories.map((category) => <button type="button" className={draft.category === category.name ? 'selected' : ''} key={category.name} onClick={() => setDraft({ ...draft, category: category.name })}><span>{category.emoji}</span>{category.name}</button>)}</div></div>
    <div className="finance-modal-fields"><div className="finance-form-group"><label htmlFor="bill-date">DATA</label><input id="bill-date" className="field" type="date" value={dateValue} onChange={(event) => { const date = event.target.valueAsDate; if (date) setDraft({ ...draft, dueDay: date.getUTCDate(), startMonth: date.getUTCMonth() }) }} required /></div><div className="finance-form-group"><label htmlFor="bill-owner">RESPONSÁVEL</label><select id="bill-owner" className="field" value={draft.owner} onChange={(event) => setDraft({ ...draft, owner: event.target.value })}>{['Família', 'Julio', 'Carol'].map((owner) => <option key={owner}>{owner}</option>)}</select></div></div>
    <div className="finance-form-group"><span className="finance-form-label">RECORRÊNCIA</span><div className="finance-recurrence-options">{recurrences.map(([value, label]) => <button type="button" className={customInstallments === 0 && draft.recurrence === value ? 'selected' : ''} key={value} onClick={() => { setCustomInstallments(0); setDraft({ ...draft, recurrence: value }) }}>{label}</button>)}{!bill ? <button type="button" className={customInstallments > 1 ? 'selected' : ''} onClick={() => { setCustomInstallments(customInstallments > 1 ? 0 : 10); setDraft({ ...draft, recurrence: 'none' }) }}>Personalizado</button> : null}</div></div>
    {!bill && customInstallments > 1 ? <div className="finance-form-group"><label htmlFor="bill-installments">QUANTIDADE DE PARCELAS</label><input id="bill-installments" className="field" type="number" min="2" max="60" value={customInstallments} onChange={(event) => setCustomInstallments(Math.max(2, Number(event.target.value) || 2))} /><small className="finance-helper-text">A primeira parcela entra no próximo mês. O valor será dividido e a descrição receberá 1/{customInstallments}, 2/{customInstallments}...</small></div> : null}
    {draft.category !== 'Reserva' ? <ExpenseKindField value={draft.expenseKind} onChange={(expenseKind) => setDraft({ ...draft, expenseKind })} /> : null}
    <div className="finance-form-group"><label htmlFor="bill-notes">OBSERVAÇÕES (OPCIONAL)</label><input id="bill-notes" className="field" value={draft.notes ?? ''} placeholder="Notas adicionais..." onChange={(event) => setDraft({ ...draft, notes: event.target.value })} maxLength={240} /></div>
    <div className="modal-actions finance-bill-modal-actions">{bill ? <button type="button" className="button button-danger" onClick={() => onDelete(bill.id)}>Excluir</button> : null}<span /><button type="button" className="button button-ghost" onClick={onClose}>Cancelar</button><button className="button button-primary">Salvar Conta</button></div>
  </form></section></div>
}

function localDateParts(date = new Date()) {
  return { year: date.getFullYear(), month: date.getMonth(), day: date.getDate() }
}

function localISODate(date = new Date()) {
  const { year, month, day } = localDateParts(date)
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function addMonthsToISODate(value: string, months: number) {
  const date = new Date(`${value}T12:00:00`)
  const originalDay = date.getDate()
  date.setMonth(date.getMonth() + months)
  if (date.getDate() !== originalDay) date.setDate(0)
  return date.toISOString().slice(0, 10)
}

function addMonthsToMonthStart(value: string, months: number) {
  return addMonthsToISODate(value, months).slice(0, 8) + '01'
}

function monthStartDate(month: number) {
  return `2026-${String(month + 1).padStart(2, '0')}-01`
}

function transactionMonth(transaction: Transaction) {
  return Number(transaction.date.slice(5, 7)) - 1
}

function transactionMonthDate(transaction: Transaction, month: number) {
  return `2026-${String(month + 1).padStart(2, '0')}-${transaction.date.slice(8, 10)}`
}

function appearsInMonth(bill: Bill, month: number) {
  if (month < bill.startMonth) return false
  if (bill.endMonth !== undefined && month > bill.endMonth) return false
  if (bill.recurrence === 'none') return month === bill.startMonth
  if (bill.recurrence === 'bimonthly') return (month - bill.startMonth) % 2 === 0
  if (bill.recurrence === 'yearly') return month === bill.startMonth
  return true
}

function budgetAppearsInMonth(budget: Budget, month: number) {
  const startMonth = budget.startMonth ?? 0
  if (month < startMonth) return false
  return budget.endMonth === undefined || month <= budget.endMonth
}

function transactionAppearsInMonth(transaction: Transaction, month: number) {
  const startMonth = transactionMonth(transaction)
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

function budgetBreakdown(category: string, bills: Bill[], transactions: Transaction[], month: number) {
  const billItems = bills
    .filter((bill) => bill.category === category && appearsInMonth(bill, month))
    .map((bill) => ({
      id: `bill-${bill.id}`,
      name: bill.name,
      amount: bill.amount,
      owner: bill.owner,
      source: bill.expenseKind === 'fixed' ? 'Conta fixa' : 'Conta variável',
      date: `Dia ${String(bill.dueDay).padStart(2, '0')}`,
    }))
  const transactionItems = transactions
    .filter((transaction) => transaction.type === 'expense' && transaction.category === category && transactionAppearsInMonth(transaction, month))
    .map((transaction) => ({
      id: `transaction-${transaction.id}`,
      name: transaction.name,
      amount: transaction.amount,
      owner: transaction.owner,
      source: transaction.recurrence === 'none' ? 'Transação avulsa' : 'Transação recorrente',
      date: formatTransactionDate(transaction, month),
    }))

  return [...billItems, ...transactionItems].sort((a, b) => b.amount - a.amount)
}

function calculateBudgetPlanning(
  transactions: Transaction[],
  bills: Bill[],
  budgets: Budget[],
  expenses: Map<string, number>,
  month: number,
) {
  const monthTransactions = transactions.filter((transaction) => transactionAppearsInMonth(transaction, month))
  const incomeTransactions = monthTransactions.filter((transaction) => transaction.type === 'income')
  const income = incomeTransactions.reduce((sum, item) => sum + item.amount, 0)
  const totalBudgeted = budgets.reduce((sum, budget) => sum + budget.limit, 0)
  const budgetedSpent = budgets.reduce((sum, budget) => sum + (expenses.get(budget.name) ?? 0), 0)
  const unbudgetedSpent = [...expenses.entries()].reduce((sum, [category, amount]) =>
    budgets.some((budget) => budget.name === category) ? sum : sum + amount, 0)
  return {
    income,
    incomeCount: incomeTransactions.length,
    totalBudgeted,
    budgetedSpent,
    unbudgetedSpent,
    budgetRemaining: totalBudgeted - budgetedSpent,
    plannedMargin: income - totalBudgeted,
  }
}

function calculateExpenseComposition(transactions: Transaction[], bills: Bill[], month: number) {
  const monthTransactions = transactions.filter((transaction) =>
    transaction.type === 'expense' &&
    transaction.category !== 'Reserva' &&
    transactionAppearsInMonth(transaction, month)
  )
  const monthBills = bills.filter((bill) =>
    bill.category !== 'Reserva' &&
    appearsInMonth(bill, month)
  )
  const fixedBills = monthBills
    .filter((bill) => bill.expenseKind === 'fixed')
    .reduce((sum, bill) => sum + bill.amount, 0)
  const recurringVariable = monthBills
    .filter((bill) => bill.expenseKind === 'variable')
    .reduce((sum, bill) => sum + bill.amount, 0)
  const oneOffVariable = monthTransactions
    .reduce((sum, transaction) => sum + transaction.amount, 0)

  return {
    fixed: fixedBills,
    recurringVariable,
    oneOffVariable,
    total: fixedBills + recurringVariable + oneOffVariable,
  }
}

function calculateMonthSummary(transactions: Transaction[], bills: Bill[], month: number) {
  const monthTransactions = transactions.filter((transaction) => transactionAppearsInMonth(transaction, month))
  const monthBills = bills.filter((bill) => appearsInMonth(bill, month))
  const incomeTransactions = monthTransactions.filter((transaction) => transaction.type === 'income')
  const expenseTransactions = monthTransactions.filter((transaction) => transaction.type === 'expense' && transaction.category !== 'Reserva')
  const expenseBills = monthBills.filter((bill) => bill.category !== 'Reserva')
  const income = incomeTransactions.reduce((sum, item) => sum + item.amount, 0)
  const expenses = expenseTransactions.reduce((sum, item) => sum + item.amount, 0) + expenseBills.reduce((sum, item) => sum + item.amount, 0)
  const fixed = expenseBills.filter((item) => item.expenseKind === 'fixed').reduce((sum, item) => sum + item.amount, 0)
  const variable = expenses - fixed
  const billsTotal = monthBills.reduce((sum, item) => sum + item.amount, 0)
  const billsPaid = monthBills.filter((item) => item.paidMonths.includes(month)).reduce((sum, item) => sum + item.amount, 0)
  const categories = new Map<string, number>()
  for (const item of [...expenseTransactions, ...expenseBills]) categories.set(item.category, (categories.get(item.category) ?? 0) + item.amount)
  const directReserve = monthTransactions.reduce((sum, item) => sum + (item.type === 'reserve_deposit' ? item.amount : item.type === 'reserve_withdrawal' ? -item.amount : 0), 0)
  const paidReserveBills = monthBills.filter((item) => item.category === 'Reserva' && item.paidMonths.includes(month)).reduce((sum, item) => sum + item.amount, 0)
  return { income, incomeCount: incomeTransactions.length, expenses, fixed, variable, billsTotal, billsPaid, billsPending: billsTotal - billsPaid, balance: income - expenses, categories, reserveNet: directReserve + paidReserveBills }
}

function calculateReserveBalance(transactions: Transaction[], bills: Bill[], month: number) {
  let total = 0
  for (let index = 0; index <= month; index += 1) total += calculateMonthSummary(transactions, bills, index).reserveNet
  return total
}

function calculateAverageMonthlyExpenses(transactions: Transaction[], bills: Bill[], month: number) {
  const start = Math.max(0, month - 2)
  const months = Array.from({ length: month - start + 1 }, (_, index) => start + index)
  const total = months.reduce((sum, item) => sum + calculateMonthSummary(transactions, bills, item).expenses, 0)
  return months.length > 0 ? Math.round(total / months.length) : 0
}

function budgetTone(percentage: number) {
  if (percentage >= 90) return 'red'
  if (percentage >= 75) return 'yellow'
  return 'green'
}

function transactionIcon(category: string) {
  return ({ Moradia: '🏠', Alimentação: '🛒', Saúde: '💊', Bebê: '👶', Pet: '🐾', Lazer: '🎉', Renda: '💼', Reserva: '🛡️', Outros: '📦' } as Record<string, string>)[category] ?? '📦'
}

function transactionTone(type: TransactionType) {
  return type === 'income' || type === 'reserve_deposit' ? 'income' : 'expense'
}

function transactionSign(type: TransactionType) {
  return type === 'income' || type === 'reserve_deposit' ? '+' : '−'
}

function transactionTypeLabel(type: TransactionType) {
  return ({ income: 'RECEITA', expense: 'DESPESA', reserve_deposit: 'DEPÓSITO NA RESERVA', reserve_withdrawal: 'RETIRADA DA RESERVA' } as Record<TransactionType, string>)[type]
}

function categoryEmoji(category: string, categories: CategoryOption[]) {
  return categories.find((item) => item.name.toLocaleLowerCase('pt-BR') === category.toLocaleLowerCase('pt-BR'))?.emoji ?? transactionIcon(category)
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

function monthShort(month: number) {
  return ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'][month]
}

function categoryTone(index: number) {
  return ['blue', 'orange', 'green', 'purple', 'brown', 'yellow', 'muted'][index % 7]
}

function buildExportData(transactions: Transaction[], bills: Bill[], budgets: Budget[], selectedMonth: number) {
  return {
    exportedAt: new Date().toISOString(),
    selectedMonth,
    transactions,
    bills,
    budgets,
  }
}

function exportCsv(data: ReturnType<typeof buildExportData>) {
  const rows = [['Origem', 'Tipo', 'Descrição', 'Categoria', 'Responsável', 'Valor', 'Data/Vencimento', 'Recorrência', 'Tipo de gasto']]
  for (const item of data.transactions) rows.push(['Transação', transactionTypeLabel(item.type), item.name, item.category, item.owner, String(item.amount).replace('.', ','), item.date, recurrenceLabel(item.recurrence), item.type === 'expense' ? 'Avulsa' : ''])
  for (const item of data.bills) rows.push(['Conta', 'Despesa', item.name, item.category, item.owner, String(item.amount).replace('.', ','), `Dia ${item.dueDay}`, recurrenceLabel(item.recurrence), item.expenseKind === 'fixed' ? 'Fixo' : 'Variável'])
  return rows.map((row) => row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(';')).join('\r\n')
}

function downloadBlob(content: string, filename: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }))
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

function exportSummaryPng(data: ReturnType<typeof buildExportData>) {
  const canvas = document.createElement('canvas')
  canvas.width = 1200
  canvas.height = 630
  const context = canvas.getContext('2d')
  if (!context) return
  const summary = calculateMonthSummary(data.transactions, data.bills, data.selectedMonth)
  context.fillStyle = '#10110f'
  context.fillRect(0, 0, canvas.width, canvas.height)
  context.fillStyle = '#e8760a'
  context.font = '34px sans-serif'
  context.fillText('FAMILY HUB · FINANCEIRO', 60, 80)
  context.fillStyle = '#f3f1ea'
  context.font = '26px sans-serif'
  context.fillText(`Receitas: ${formatMoney(summary.income)}`, 60, 165)
  context.fillText(`Despesas: ${formatMoney(summary.expenses)}`, 60, 225)
  context.fillText(`Saldo: ${formatMoney(summary.balance)}`, 60, 285)
  context.fillText(`Contas: ${formatMoney(summary.billsTotal)}`, 60, 345)
  context.fillText(`Reserva acumulada: ${formatMoney(calculateReserveBalance(data.transactions, data.bills, data.selectedMonth))}`, 60, 405)
  context.fillStyle = '#85887f'
  context.font = '18px sans-serif'
  context.fillText(`Gerado em ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`, 60, 555)
  const link = document.createElement('a')
  link.download = 'family-hub-financeiro.png'
  link.href = canvas.toDataURL('image/png')
  link.click()
}

function formatMoney(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 2 }).format(value)
}

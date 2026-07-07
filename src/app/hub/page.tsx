import Link from 'next/link'
import { redirect } from 'next/navigation'
import InternalShell from '@/components/layout/InternalShell'
import { getFinanceData, type FinanceBill, type FinanceTransaction } from '@/lib/finance'
import { getShoppingLists, type ShoppingList } from '@/lib/shopping'
import { createClient } from '@/lib/supabase/server'

function billAppearsInMonth(bill: FinanceBill, month: number) {
  if (month < bill.startMonth) return false
  if (bill.recurrence === 'none') return month === bill.startMonth
  if (bill.recurrence === 'bimonthly') return (month - bill.startMonth) % 2 === 0
  if (bill.recurrence === 'yearly') return month === bill.startMonth
  return true
}

function calculateReserveBalance(transactions: FinanceTransaction[], bills: FinanceBill[], month: number) {
  const directMovements = transactions.reduce((sum, transaction) => {
    const transactionMonth = Number(transaction.date.slice(5, 7)) - 1
    if (transactionMonth > month) return sum
    if (transaction.type === 'reserve_deposit') return sum + transaction.amount
    if (transaction.type === 'reserve_withdrawal') return sum - transaction.amount
    return sum
  }, 0)

  const paidReserveBills = bills
    .filter((bill) => bill.category === 'Reserva')
    .reduce((sum, bill) => sum + bill.paidMonths.filter((paidMonth) => paidMonth <= month).length * bill.amount, 0)

  return directMovements + paidReserveBills
}

function countCurrentShoppingLists(lists: ShoppingList[], yearMonth: string) {
  return lists.filter((list) => {
    if (list.status !== 'active') return false
    const referenceDate = list.scheduledDate ?? list.createdAt.slice(0, 10)
    return referenceDate.startsWith(yearMonth)
  }).length
}

function getGreeting(date: Date) {
  const hour = Number(new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    hour12: false,
    timeZone: 'America/Sao_Paulo',
  }).format(date))

  if (hour < 12) return 'Bom dia'
  if (hour < 18) return 'Boa tarde'
  return 'Boa noite'
}

export default async function HubPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/?next=/hub')

  const now = new Date()
  const yearMonth = new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: '2-digit',
    timeZone: 'America/Sao_Paulo',
  }).format(now)
  const month = Number(yearMonth.slice(5, 7)) - 1
  const userName = user.user_metadata.full_name ?? user.email?.split('@')[0] ?? 'Família'
  const firstName = userName.split(' ')[0]
  const greeting = getGreeting(now)

  let shoppingLists: ShoppingList[] = []
  let financeData: Awaited<ReturnType<typeof getFinanceData>> | null = null

  const [shoppingResult, financeResult] = await Promise.allSettled([
    getShoppingLists(supabase),
    getFinanceData(supabase, user.id),
  ])

  if (shoppingResult.status === 'fulfilled') shoppingLists = shoppingResult.value
  if (financeResult.status === 'fulfilled') financeData = financeResult.value

  const pendingLists = countCurrentShoppingLists(shoppingLists, yearMonth)
  const openBills = financeData?.bills.filter((bill) =>
    billAppearsInMonth(bill, month) && !bill.paidMonths.includes(month)
  ).length ?? 0
  const reserveBalance = financeData
    ? calculateReserveBalance(financeData.transactions, financeData.bills, month)
    : 0
  const reserveGoal = financeData?.reserveGoal ?? 0
  const reservePercentage = reserveGoal > 0 ? Math.max(0, Math.round((reserveBalance / reserveGoal) * 100)) : 0

  return (
    <InternalShell active="home">
      <main className="dashboard-main">
        <header className="dashboard-heading">
          <div>
            <h1>{greeting}, {firstName}.</h1>
            <p>Tudo organizado para hoje.</p>
          </div>
        </header>

        <section className="dashboard-quick" aria-label="Módulos">
          <Link className="dashboard-quick-card" href="/financeiro"><span>💰</span><strong>Finanças</strong><small>Resumo mensal</small></Link>
          <Link className="dashboard-quick-card" href="/compras"><span>🛒</span><strong>Compras</strong><small>Listas da família</small></Link>
          <div className="dashboard-quick-card locked"><span>📋</span><strong>Tarefas</strong><small>Em pausa</small><b>🔒</b></div>
          <div className="dashboard-quick-card locked"><span>📅</span><strong>Agenda</strong><small>Em breve</small><b>🔒</b></div>
          <div className="dashboard-quick-card locked"><span>📁</span><strong>Documentos</strong><small>Em breve</small><b>🔒</b></div>
          <div className="dashboard-quick-card locked"><span>🚨</span><strong>Emergência</strong><small>Em breve</small><b>🔒</b></div>
        </section>

        <section className="dashboard-stats" aria-label="Resumo do mês">
          <article>
            <span>Contas</span>
            <strong className="dashboard-value-accent">{openBills}</strong>
            <small>{openBills === 1 ? 'conta aberta no mês' : 'contas abertas no mês'}</small>
          </article>
          <article>
            <span>Compras</span>
            <strong className="dashboard-value-accent">{pendingLists}</strong>
            <small>{pendingLists === 1 ? 'lista pendente no mês' : 'listas pendentes no mês'}</small>
          </article>
          <article className="locked">
            <span>Tarefas</span>
            <strong className="dashboard-value-accent">--</strong>
            <small>em pausa para ajustes</small>
            <b>🔒</b>
          </article>
          <article>
            <span>Reserva</span>
            <strong className="dashboard-value-reserve">{formatMoney(reserveBalance)}</strong>
            <small>{reservePercentage}% da meta</small>
          </article>
        </section>

        <section className="dashboard-future-grid">
          <article className="dashboard-future-card">
            <h2>Resumo da casa</h2>
            <div><span>⌂</span><strong>Em construção</strong><small>Novos resumos familiares aparecerão aqui.</small></div>
          </article>
          <article className="dashboard-future-card">
            <h2>Hoje em Tarefas</h2>
            <div><span>📋</span><strong>Em pausa</strong><small>A seção será retomada com o escopo ajustado.</small></div>
          </article>
        </section>
      </main>
    </InternalShell>
  )
}

function formatMoney(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(value)
}

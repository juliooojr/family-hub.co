import Link from 'next/link'
import { redirect } from 'next/navigation'
import InternalShell from '@/components/layout/InternalShell'
import FamilyActivityFeed from '@/components/activity/FamilyActivityFeed'
import HubCalendarPreview from '@/components/calendar/HubCalendarPreview'
import { getFamilyActivities } from '@/lib/activity'
import { addDays, expandCalendarEvents, getCalendarData, type CalendarOccurrence } from '@/lib/calendar'
import { canManageFamily, getCurrentFamilyContext } from '@/lib/family'
import { getFinanceData, type FinanceBill, type FinanceTransaction } from '@/lib/finance'
import { getShoppingLists, type ShoppingList } from '@/lib/shopping'
import { createClient } from '@/lib/supabase/server'
import { getTasksData, getTodayKey, isTaskDueOn, type RoutineEntry, type RoutineTask } from '@/lib/tasks'

function billAppearsInMonth(bill: FinanceBill, month: number) {
  if (month < bill.startMonth) return false
  if (bill.endMonth !== undefined && month > bill.endMonth) return false
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

function countOpenShoppingLists(lists: ShoppingList[]) {
  return lists.filter((list) => list.status === 'active').length
}

function countOpenBills(bills: FinanceBill[], month: number) {
  return bills.filter((bill) =>
    billAppearsInMonth(bill, month) &&
    !bill.paidMonths.includes(month)
  ).length
}

function countCompletedTasks(tasks: RoutineTask[], entries: RoutineEntry[], todayKey: string) {
  const entryByTaskId = new Map(entries.filter((entry) => entry.entryDate === todayKey).map((entry) => [entry.taskId, entry]))
  const dueTasks = tasks.filter((task) => isTaskDueOn(task, todayKey))
  return {
    due: dueTasks.length,
    completed: dueTasks.filter((task) => entryByTaskId.get(task.id)?.completed).length,
    preview: dueTasks.slice(0, 3).map((task) => ({
      task,
      completed: entryByTaskId.get(task.id)?.completed ?? false,
    })),
  }
}

function getGreeting(date: Date) {
  const hour = Number(new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    hour12: false,
    timeZone: 'America/Sao_Paulo',
  }).format(date))

  if (hour >= 6 && hour < 12) return 'Bom dia'
  if (hour >= 12 && hour < 18) return 'Boa tarde'
  return 'Boa noite'
}

export default async function HubPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/?next=/hub')
  const familyContext = await getCurrentFamilyContext(supabase, user.id)
  if (!familyContext) redirect('/familia/criar')

  const now = new Date()
  const yearMonth = new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: '2-digit',
    timeZone: 'America/Sao_Paulo',
  }).format(now)
  const todayKey = getTodayKey()
  const month = Number(yearMonth.slice(5, 7)) - 1
  const userName = user.user_metadata.full_name ?? user.email?.split('@')[0] ?? 'Família'
  const firstName = userName.split(' ')[0]
  const greeting = getGreeting(now)

  let shoppingLists: ShoppingList[] = []
  let financeData: Awaited<ReturnType<typeof getFinanceData>> | null = null
  let taskData: Awaited<ReturnType<typeof getTasksData>> | null = null
  let calendarData: Awaited<ReturnType<typeof getCalendarData>> | null = null
  let activities: Awaited<ReturnType<typeof getFamilyActivities>> = []

  const [shoppingResult, financeResult, tasksResult, calendarResult, activitiesResult] = await Promise.allSettled([
    getShoppingLists(supabase),
    getFinanceData(supabase, user.id),
    getTasksData(supabase, user.id),
    getCalendarData(supabase),
    getFamilyActivities(supabase, familyContext.family.id, familyContext.members, 8),
  ])

  if (shoppingResult.status === 'fulfilled') shoppingLists = shoppingResult.value
  if (financeResult.status === 'fulfilled') financeData = financeResult.value
  if (tasksResult.status === 'fulfilled') taskData = tasksResult.value
  if (calendarResult.status === 'fulfilled') calendarData = calendarResult.value
  if (activitiesResult.status === 'fulfilled') activities = activitiesResult.value

  const pendingLists = countOpenShoppingLists(shoppingLists)
  const taskSummary = taskData ? countCompletedTasks(taskData.tasks, taskData.entries, todayKey) : null
  const openBills = financeData ? countOpenBills(financeData.bills, month) : 0
  const reserveBalance = financeData
    ? calculateReserveBalance(financeData.transactions, financeData.bills, month)
    : 0
  const reserveGoal = financeData?.reserveGoal ?? 0
  const reservePercentage = reserveGoal > 0 ? Math.max(0, Math.round((reserveBalance / reserveGoal) * 100)) : 0
  const calendarDays = buildCalendarDays(calendarData, todayKey)

  return (
    <InternalShell active="home" canManageFamily={canManageFamily(familyContext.member.role)}>
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
          <Link className="dashboard-quick-card" href="/tarefas"><span>📋</span><strong>Tarefas</strong><small>{taskSummary ? `${taskSummary.completed}/${taskSummary.due} hoje` : 'Rotina pessoal'}</small></Link>
          <Link className="dashboard-quick-card" href="/agenda"><span>📅</span><strong>Agenda</strong><small>Compromissos da família</small></Link>
        </section>

        <section className="dashboard-stats" aria-label="Resumo do mês" data-tour="hub-summary">
          <Link className="dashboard-stat-card" href="/financeiro" aria-label={`Abrir Finanças: ${openBills} ${openBills === 1 ? 'conta aberta' : 'contas abertas'}`}>
            <span>Contas</span>
            <strong className="dashboard-value-accent">{openBills}</strong>
            <small>{openBills === 1 ? 'conta aberta no mês' : 'contas abertas no mês'}</small>
          </Link>
          <Link className="dashboard-stat-card" href="/compras" aria-label={`Abrir Compras: ${pendingLists} ${pendingLists === 1 ? 'lista aberta' : 'listas abertas'}`}>
            <span>Compras</span>
            <strong className="dashboard-value-accent">{pendingLists}</strong>
            <small>{pendingLists === 1 ? 'lista aberta' : 'listas abertas'}</small>
          </Link>
          <Link className="dashboard-stat-card" href="/tarefas" aria-label={`Abrir Tarefas: ${taskSummary?.due ?? 0} previstas hoje`}>
            <span>Tarefas</span>
            <strong className="dashboard-value-accent">{taskSummary?.due ?? 0}</strong>
            <small>{taskSummary?.due === 1 ? 'tarefa prevista hoje' : 'tarefas previstas hoje'}</small>
          </Link>
          <article>
            <span>Reserva</span>
            <strong className="dashboard-value-reserve">{formatMoney(reserveBalance)}</strong>
            <small>{reservePercentage}% da meta</small>
          </article>
        </section>

        <section className="dashboard-future-grid">
          <article className="dashboard-future-card dashboard-calendar-card">
            <header className="dashboard-calendar-header"><div><h2>Próximos eventos</h2><small>Hoje e os próximos 6 dias</small></div><Link href="/agenda">Ver agenda <span aria-hidden>→</span></Link></header>
            <HubCalendarPreview days={calendarDays} />
          </article>
          <article className="dashboard-future-card family-activity-card">
            <header><h2>Atividade da Família</h2><Link href="/atividades">Ver histórico <span aria-hidden>→</span></Link></header>
            <FamilyActivityFeed activities={activities} />
          </article>
        </section>
      </main>
    </InternalShell>
  )
}

function buildCalendarDays(data: Awaited<ReturnType<typeof getCalendarData>> | null, today: string) {
  const dates = Array.from({ length: 7 }, (_, index) => addDays(today, index))
  const occurrences = data ? expandCalendarEvents(data.events, data.overrides, today, dates[6]) : []
  const eventsByDate = new Map<string, CalendarOccurrence[]>()
  occurrences.forEach((event) => eventsByDate.set(event.occurrenceDate, [...(eventsByDate.get(event.occurrenceDate) ?? []), event]))
  return dates.map((date) => ({ date, events: eventsByDate.get(date) ?? [] }))
}

function formatMoney(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(value)
}

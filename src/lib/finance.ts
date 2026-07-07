import type { SupabaseClient } from '@supabase/supabase-js'

export type FinanceTransaction = {
  id: string
  type: 'expense' | 'income' | 'reserve_deposit' | 'reserve_withdrawal'
  name: string
  amount: number
  category: string
  owner: string
  recurrence: 'none' | 'weekly' | 'monthly' | 'bimonthly' | 'yearly'
  date: string
  notes?: string
  expenseKind?: 'fixed' | 'variable'
}

export type FinanceBill = {
  id: string; name: string; amount: number; dueDay: number; category: string; owner: string
  recurrence: FinanceTransaction['recurrence']; startMonth: number; endMonth?: number; paidMonths: number[]
  startDate?: string; notes?: string; expenseKind: 'fixed' | 'variable'
}

export type FinanceBudget = { id: string; name: string; emoji: string; limit: number; startMonth?: number; endMonth?: number }

type BillRow = {
  id: string; name: string; amount: number | string; due_day: number; category: string; responsible: string
  recurrence: FinanceTransaction['recurrence']; start_date: string; end_date: string | null; expense_kind: 'fixed' | 'variable'; notes: string | null
  finance_bill_payments: Array<{ month_date: string }> | null
}

type BudgetRow = {
  id: string; category: string; emoji: string; monthly_limit: number | string; start_date: string | null; end_date: string | null
}

export async function getFinanceData(supabase: SupabaseClient, userId: string) {
  const { data: member, error: memberError } = await supabase.from('family_members').select('family_id').eq('user_id', userId).single()
  if (memberError || !member) throw memberError ?? new Error('Família não encontrada.')
  const familyId = member.family_id as string
  const [transactionsResult, billsResult, budgetsResult, reserveResult] = await Promise.all([
    supabase.from('finance_transactions').select('*').eq('family_id', familyId).order('transaction_date'),
    supabase.from('finance_bills').select('*, finance_bill_payments(month_date)').eq('family_id', familyId).order('name'),
    supabase.from('finance_budgets').select('*').eq('family_id', familyId).order('category'),
    supabase.from('finance_reserve_settings').select('goal_amount').eq('family_id', familyId).maybeSingle(),
  ])
  const error = transactionsResult.error ?? billsResult.error ?? budgetsResult.error ?? reserveResult.error
  if (error) throw error
  const transactions: FinanceTransaction[] = (transactionsResult.data ?? []).map((row) => ({
    id: row.id, type: row.type, name: row.name, amount: Number(row.amount), category: row.type === 'income' ? 'Receita' : row.category,
    owner: row.responsible, recurrence: row.recurrence, date: row.transaction_date,
    notes: row.notes ?? undefined, expenseKind: row.expense_kind ?? undefined,
  }))
  const bills: FinanceBill[] = ((billsResult.data ?? []) as BillRow[]).map((row) => ({
    id: row.id, name: row.name, amount: Number(row.amount), dueDay: row.due_day, category: row.category,
    owner: row.responsible, recurrence: row.recurrence, startMonth: Number(row.start_date.slice(5, 7)) - 1,
    startDate: row.start_date,
    endMonth: row.end_date ? Number(row.end_date.slice(5, 7)) - 1 : undefined,
    paidMonths: (row.finance_bill_payments ?? []).map((payment) => Number(payment.month_date.slice(5, 7)) - 1),
    notes: row.notes ?? undefined, expenseKind: row.expense_kind,
  }))
  const budgets: FinanceBudget[] = ((budgetsResult.data ?? []) as BudgetRow[]).map((row) => ({
    id: row.id, name: row.category, emoji: row.emoji, limit: Number(row.monthly_limit),
    startMonth: row.start_date ? Number(row.start_date.slice(5, 7)) - 1 : 0,
    endMonth: row.end_date ? Number(row.end_date.slice(5, 7)) - 1 : undefined,
  }))
  return { familyId, transactions, bills, budgets, reserveGoal: Number(reserveResult.data?.goal_amount ?? 30000) }
}

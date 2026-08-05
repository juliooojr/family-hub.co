import type { SupabaseClient } from '@supabase/supabase-js'
import { displayMemberName, type FamilyMember } from '@/lib/family'

export type ActivityModule = 'shopping' | 'tasks' | 'finance' | 'calendar' | 'documents' | 'emergency'
export type FamilyActivity = { id: string; module: ActivityModule; description: string; createdAt: string }

type AuditRow = {
  id: string; user_id: string | null; action: 'insert' | 'update' | 'delete'; table_name: string
  record_id: string | null; payload: Record<string, unknown> | null; created_at: string
}

const SOURCE_TABLES = ['shopping_lists', 'shopping_items', 'routine_tasks', 'routine_entries', 'finance_transactions', 'finance_bills', 'finance_bill_payments']

export async function getFamilyActivities(supabase: SupabaseClient, familyId: string, members: FamilyMember[], limit?: number): Promise<FamilyActivity[]> {
  const { data, error } = await supabase.from('audit_log')
    .select('id,user_id,action,table_name,record_id,payload,created_at')
    .eq('family_id', familyId).in('table_name', SOURCE_TABLES)
    .order('created_at', { ascending: false }).limit(1000)
  if (error) throw error

  const rows = (data ?? []) as AuditRow[]
  const actors = new Map(members.map((member) => [member.userId, displayMemberName(member)]))
  const lists = collectNames(rows, 'shopping_lists')
  const tasks = collectNames(rows, 'routine_tasks')
  const bills = collectNames(rows, 'finance_bills')
  const activities = rows.map((row) => toActivity(row, actors, lists, tasks, bills)).filter((event): event is FamilyActivity => event !== null)
  return limit ? activities.slice(0, limit) : activities
}

function collectNames(rows: AuditRow[], table: string) {
  const names = new Map<string, string>()
  rows.forEach((row) => {
    if (row.table_name !== table || !row.record_id || names.has(row.record_id)) return
    const name = textValue(currentPayload(row), 'name')
    if (name) names.set(row.record_id, name)
  })
  return names
}

function toActivity(row: AuditRow, actors: Map<string, string>, lists: Map<string, string>, tasks: Map<string, string>, bills: Map<string, string>): FamilyActivity | null {
  const actor = row.user_id ? actors.get(row.user_id) ?? 'Um membro' : 'A família'
  const make = (module: ActivityModule, description: string): FamilyActivity => ({ id: row.id, module, description, createdAt: row.created_at })
  const payload = currentPayload(row)
  const previous = previousPayload(row)

  if (row.table_name === 'shopping_lists') {
    const name = textValue(payload, 'name') ?? 'Lista de compras'
    if (row.action === 'insert') return make('shopping', `${actor} criou a lista “${name}”.`)
    if (row.action === 'update' && textValue(previous, 'status') === 'active' && textValue(payload, 'status') === 'archived') return make('shopping', `${actor} concluiu a lista “${name}”.`)
  }
  if (row.table_name === 'shopping_items' && row.action === 'insert') {
    const name = textValue(payload, 'name') ?? 'Novo item'
    const listId = textValue(payload, 'list_id')
    const listName = listId ? lists.get(listId) : null
    return make('shopping', `${actor} adicionou “${name}” à ${listName ? `lista “${listName}”` : 'lista de compras'}.`)
  }
  if (row.table_name === 'routine_tasks' && row.action === 'insert') return make('tasks', `${actor} criou a tarefa “${textValue(payload, 'name') ?? 'Nova tarefa'}”.`)
  if (row.table_name === 'routine_entries' && payload?.completed === true && (row.action === 'insert' || previous?.completed === false)) {
    const taskId = textValue(payload, 'task_id')
    return make('tasks', `${actor} concluiu “${(taskId && tasks.get(taskId)) || 'uma tarefa'}”.`)
  }
  if (row.table_name === 'finance_bills' && row.action === 'insert') return make('finance', `${actor} adicionou a conta “${textValue(payload, 'name') ?? 'Nova conta'}”.`)
  if (row.table_name === 'finance_bill_payments' && row.action === 'insert') {
    const billId = textValue(payload, 'bill_id')
    return make('finance', `${actor} marcou “${(billId && bills.get(billId)) || 'uma conta'}” como paga.`)
  }
  if (row.table_name === 'finance_transactions' && row.action === 'insert' && textValue(payload, 'type') === 'income') {
    const amount = Number(payload?.amount)
    const detail = Number.isFinite(amount) ? ` de ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(amount)}` : ''
    const name = textValue(payload, 'name')
    return make('finance', `${actor} registrou ${name ? `a receita “${name}”` : 'uma receita'}${detail}.`)
  }
  return null
}

function textValue(payload: Record<string, unknown> | null, key: string) {
  const value = payload?.[key]
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function currentPayload(row: AuditRow) {
  const nested = row.payload?.new
  return nested && typeof nested === 'object' && !Array.isArray(nested) ? nested as Record<string, unknown> : row.payload
}

function previousPayload(row: AuditRow) {
  const nested = row.payload?.old
  return nested && typeof nested === 'object' && !Array.isArray(nested) ? nested as Record<string, unknown> : null
}

export function formatRelativeActivityTime(value: string, now = new Date()) {
  const date = new Date(value)
  const minutes = Math.floor(Math.max(0, now.getTime() - date.getTime()) / 60_000)
  const hours = Math.floor(minutes / 60)
  if (minutes < 1) return 'Agora mesmo'
  if (minutes < 60) return `Há ${minutes} min`
  if (hours < 24) return `Há ${hours} h`
  const formatter = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' })
  const today = new Date(`${formatter.format(now)}T12:00:00-03:00`)
  const eventDay = new Date(`${formatter.format(date)}T12:00:00-03:00`)
  const days = Math.round((today.getTime() - eventDay.getTime()) / 86_400_000)
  if (days === 1) return 'Ontem'
  if (days < 7) {
    const weekday = new Intl.DateTimeFormat('pt-BR', { weekday: 'long', timeZone: 'America/Sao_Paulo' }).format(date)
    return weekday.charAt(0).toUpperCase() + weekday.slice(1)
  }
  const weeks = Math.floor(days / 7)
  if (weeks < 5) return `Há ${weeks} ${weeks === 1 ? 'semana' : 'semanas'}`
  const months = Math.max(1, Math.floor(days / 30))
  return `Há ${months} ${months === 1 ? 'mês' : 'meses'}`
}

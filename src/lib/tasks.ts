import type { SupabaseClient } from '@supabase/supabase-js'

export type TaskGoalType = 'check' | 'quantity'
export type TaskFrequency = 'daily' | 'weekly' | 'biweekly' | 'monthly'
export type TaskStatus = 'active' | 'archived'

export type RoutineTask = {
  id: string
  familyId: string
  userId: string
  emoji: string
  name: string
  description: string | null
  goalType: TaskGoalType
  goalValue: number
  goalUnit: string | null
  quickValues: number[]
  frequency: TaskFrequency
  weekdays: number[] | null
  startDate: string
  notificationEnabled: boolean
  notificationTime: string | null
  status: TaskStatus
  createdAt: string
  updatedAt: string
}

export type RoutineEntry = {
  id: string
  taskId: string
  familyId: string
  userId: string
  entryDate: string
  value: number
  completed: boolean
  completedAt: string | null
  createdAt: string
  updatedAt: string
}

export type TaskInput = {
  emoji: string
  name: string
  description: string | null
  goalType: TaskGoalType
  goalValue: number
  goalUnit: string | null
  quickValues: number[]
  frequency: TaskFrequency
  weekdays: number[] | null
  startDate: string
  notificationEnabled: boolean
  notificationTime: string | null
}

type TaskRow = {
  id: string
  family_id: string
  user_id: string
  emoji: string
  name: string
  description: string | null
  goal_type: TaskGoalType
  goal_value: number | string
  goal_unit: string | null
  quick_values: Array<number | string> | null
  frequency: TaskFrequency
  weekdays: number[] | null
  start_date: string
  notification_enabled: boolean
  notification_time: string | null
  status: TaskStatus
  created_at: string
  updated_at: string
}

type EntryRow = {
  id: string
  task_id: string
  family_id: string
  user_id: string
  entry_date: string
  value: number | string
  completed: boolean
  completed_at: string | null
  created_at: string
  updated_at: string
}

export function getTodayKey() {
  return new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: 'America/Sao_Paulo',
  }).format(new Date())
}

function mapTask(row: TaskRow): RoutineTask {
  return {
    id: row.id,
    familyId: row.family_id,
    userId: row.user_id,
    emoji: row.emoji,
    name: row.name,
    description: row.description,
    goalType: row.goal_type,
    goalValue: Number(row.goal_value),
    goalUnit: row.goal_unit,
    quickValues: (row.quick_values ?? []).map(Number).filter((value) => value > 0),
    frequency: row.frequency,
    weekdays: row.weekdays,
    startDate: row.start_date,
    notificationEnabled: row.notification_enabled,
    notificationTime: row.notification_time,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function mapEntry(row: EntryRow): RoutineEntry {
  return {
    id: row.id,
    taskId: row.task_id,
    familyId: row.family_id,
    userId: row.user_id,
    entryDate: row.entry_date,
    value: Number(row.value),
    completed: row.completed,
    completedAt: row.completed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

async function getFamilyId(supabase: SupabaseClient, userId: string): Promise<string> {
  const { data, error } = await supabase
    .from('family_members')
    .select('family_id')
    .eq('user_id', userId)
    .single()

  if (error || !data) throw error ?? new Error('Familia nao encontrada.')
  return data.family_id as string
}

export async function getTasksData(supabase: SupabaseClient, userId: string) {
  const familyId = await getFamilyId(supabase, userId)
  const [tasksResult, entriesResult] = await Promise.all([
    supabase
      .from('routine_tasks')
      .select('*')
      .eq('family_id', familyId)
      .eq('user_id', userId)
      .order('created_at', { ascending: true }),
    supabase
      .from('routine_entries')
      .select('*')
      .eq('family_id', familyId)
      .eq('user_id', userId)
      .order('entry_date', { ascending: false }),
  ])

  const error = tasksResult.error ?? entriesResult.error
  if (error) throw error

  return {
    familyId,
    userId,
    tasks: ((tasksResult.data ?? []) as TaskRow[]).map(mapTask),
    entries: ((entriesResult.data ?? []) as EntryRow[]).map(mapEntry),
  }
}

export async function createTask(
  supabase: SupabaseClient,
  familyId: string,
  userId: string,
  input: TaskInput,
): Promise<RoutineTask> {
  const { data, error } = await supabase
    .from('routine_tasks')
    .insert(toTaskPayload(familyId, userId, input))
    .select('*')
    .single()

  if (error) throw error
  return mapTask(data as TaskRow)
}

export async function updateTask(
  supabase: SupabaseClient,
  taskId: string,
  userId: string,
  input: TaskInput,
): Promise<void> {
  const { error } = await supabase
    .from('routine_tasks')
    .update(toTaskPayload(undefined, userId, input))
    .eq('id', taskId)
    .eq('user_id', userId)

  if (error) throw error
}

export async function deleteTask(
  supabase: SupabaseClient,
  taskId: string,
  userId: string,
): Promise<void> {
  const { error } = await supabase
    .from('routine_tasks')
    .delete()
    .eq('id', taskId)
    .eq('user_id', userId)
  if (error) throw error
}

export async function saveTaskEntry(
  supabase: SupabaseClient,
  task: RoutineTask,
  date: string,
  value: number,
): Promise<RoutineEntry> {
  const cleanValue = Math.max(0, value)
  const completed = task.goalType === 'check' ? cleanValue >= 1 : cleanValue >= task.goalValue
  const { data, error } = await supabase
    .from('routine_entries')
    .upsert({
      task_id: task.id,
      family_id: task.familyId,
      user_id: task.userId,
      entry_date: date,
      value: cleanValue,
      completed,
      completed_at: completed ? new Date().toISOString() : null,
    }, { onConflict: 'task_id,entry_date' })
    .select('*')
    .single()

  if (error) throw error
  return mapEntry(data as EntryRow)
}

function toTaskPayload(familyId: string | undefined, userId: string, input: TaskInput) {
  return {
    ...(familyId ? { family_id: familyId } : {}),
    user_id: userId,
    emoji: input.emoji,
    name: input.name.trim(),
    description: input.description?.trim() || null,
    goal_type: input.goalType,
    goal_value: input.goalValue,
    goal_unit: input.goalUnit?.trim() || null,
    quick_values: input.goalType === 'quantity' ? input.quickValues.filter((value) => value > 0).slice(0, 3) : [],
    frequency: input.frequency,
    weekdays: input.frequency === 'weekly' ? input.weekdays : null,
    start_date: input.startDate,
    notification_enabled: false,
    notification_time: input.notificationTime,
    status: 'active',
  }
}

export function isTaskDueOn(task: RoutineTask, dateKey: string) {
  if (dateKey < task.startDate || task.status !== 'active') return false
  const date = parseDateKey(dateKey)
  const start = parseDateKey(task.startDate)
  if (task.frequency === 'daily') return true
  if (task.frequency === 'weekly') {
    const weekdays = task.weekdays && task.weekdays.length > 0 ? task.weekdays : [start.getDay()]
    return weekdays.includes(date.getDay())
  }
  if (task.frequency === 'biweekly') {
    const days = daysBetween(start, date)
    return days >= 0 && days % 14 === 0
  }
  return date.getDate() === start.getDate()
}

export function calculateTaskStreak(task: RoutineTask, entries: RoutineEntry[], todayKey: string) {
  const entryByDate = new Map(entries.filter((entry) => entry.taskId === task.id).map((entry) => [entry.entryDate, entry]))
  let date = parseDateKey(todayKey)
  let streak = 0

  for (let scanned = 0; scanned < 370; scanned += 1) {
    const key = formatDateKey(date)
    if (key < task.startDate) break
    if (isTaskDueOn(task, key)) {
      const entry = entryByDate.get(key)
      if (entry?.completed) {
        streak += 1
      } else {
        break
      }
    }
    date = addDays(date, -1)
  }

  return streak
}

export function previousDateKey(dateKey: string) {
  return formatDateKey(addDays(parseDateKey(dateKey), -1))
}

export function nextDateKey(dateKey: string) {
  return formatDateKey(addDays(parseDateKey(dateKey), 1))
}

function parseDateKey(value: string) {
  return new Date(`${value}T12:00:00`)
}

function formatDateKey(date: Date) {
  return date.toISOString().slice(0, 10)
}

function addDays(date: Date, days: number) {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

function daysBetween(start: Date, end: Date) {
  const dayMs = 24 * 60 * 60 * 1000
  return Math.round((start.getTime() - end.getTime()) / -dayMs)
}

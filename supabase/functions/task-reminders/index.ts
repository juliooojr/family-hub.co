import { createClient } from 'npm:@supabase/supabase-js@2'
import webpush from 'npm:web-push@3'

type SubscriptionRow = { id: string; user_id: string; endpoint: string; p256dh: string; auth: string; timezone: string }
type TaskRow = {
  id: string; user_id: string; emoji: string; name: string; description: string | null
  frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly'; weekdays: number[] | null
  start_date: string; notification_time: string | null
}
type CalendarEventRow = {
  id: string; family_id: string; created_by: string; name: string; description: string | null; audience: 'family' | 'selected' | 'self'
  all_day: boolean; starts_on: string; start_time: string | null; recurrence: 'none' | 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'yearly'
  recurrence_until: string | null; reminder_minutes: number | null; reminder_at: string | null
  calendar_event_participants: { user_id: string; reminder_minutes: number | null; reminder_at: string | null }[]
}

Deno.serve(async (request) => {
  const cronSecret = Deno.env.get('CRON_SECRET')
  if (!cronSecret || request.headers.get('authorization') !== `Bearer ${cronSecret}`) {
    return json({ error: 'Não autorizado.' }, 401)
  }
  const url = Deno.env.get('SUPABASE_URL')
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  const publicKey = Deno.env.get('VAPID_PUBLIC_KEY')
  const privateKey = Deno.env.get('VAPID_PRIVATE_KEY')
  const subject = Deno.env.get('VAPID_SUBJECT')
  if (!url || !serviceKey || !publicKey || !privateKey || !subject) return json({ error: 'Configuração incompleta.' }, 503)

  webpush.setVapidDetails(subject, publicKey, privateKey)
  const supabase = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } })
  const [{ data: subscriptions, error: subscriptionError }, { data: tasks, error: taskError }, { data: calendarEvents, error: calendarError }, { data: familyMembers, error: membersError }] = await Promise.all([
    supabase.from('push_subscriptions').select('*'),
    supabase.from('routine_tasks').select('id,user_id,emoji,name,description,frequency,weekdays,start_date,notification_time').eq('status', 'active').eq('notification_enabled', true).not('notification_time', 'is', null),
    supabase.from('calendar_events').select('id,family_id,created_by,name,description,audience,all_day,starts_on,start_time,recurrence,recurrence_until,reminder_minutes,reminder_at,calendar_event_participants(user_id,reminder_minutes,reminder_at)').or('reminder_minutes.not.is.null,reminder_at.not.is.null'),
    supabase.from('family_members').select('family_id,user_id'),
  ])
  if (subscriptionError || taskError || calendarError || membersError) return json({ error: subscriptionError?.message || taskError?.message || calendarError?.message || membersError?.message }, 500)

  let delivered = 0
  const requestNow = new Date()
  for (const subscription of (subscriptions ?? []) as SubscriptionRow[]) {
    const local = localSchedule(requestNow, subscription.timezone)
    const { data: completedEntries, error: completedEntriesError } = await supabase
      .from('routine_entries')
      .select('task_id')
      .eq('user_id', subscription.user_id)
      .eq('entry_date', local.date)
      .eq('completed', true)
    if (completedEntriesError) {
      console.error('Não foi possível verificar tarefas concluídas.', completedEntriesError.message)
      continue
    }
    const completedTaskIds = new Set((completedEntries ?? []).map((entry) => entry.task_id as string))
    for (const task of ((tasks ?? []) as TaskRow[]).filter((item) => item.user_id === subscription.user_id && item.notification_time?.slice(0, 5) === local.time)) {
      if (completedTaskIds.has(task.id)) continue
      if (!isDue(task, local.date)) continue
      const { data: claim } = await supabase.from('routine_notification_deliveries')
        .insert({ task_id: task.id, subscription_id: subscription.id, scheduled_date: local.date, scheduled_time: local.time }).select('id').maybeSingle()
      if (!claim) continue
      try {
        await webpush.sendNotification({ endpoint: subscription.endpoint, keys: { p256dh: subscription.p256dh, auth: subscription.auth } }, JSON.stringify({
          title: `${task.emoji} ${task.name}`,
          body: task.description || 'Hora da sua tarefa no Family Hub.',
          tag: `routine-task-${task.id}-${local.date}`,
          url: '/tarefas',
        }))
        delivered += 1
      } catch (error) {
        await supabase.from('routine_notification_deliveries').delete().eq('task_id', task.id).eq('subscription_id', subscription.id).eq('scheduled_date', local.date).eq('scheduled_time', local.time)
        if (expired(error)) await supabase.from('push_subscriptions').delete().eq('id', subscription.id)
      }
    }
    for (const event of (calendarEvents ?? []) as CalendarEventRow[]) {
      if (!calendarEventVisibleTo(event, subscription.user_id, familyMembers ?? [])) continue
      const participant = event.calendar_event_participants.find((item) => item.user_id === subscription.user_id)
      const reminderMinutes = participant?.reminder_minutes ?? event.reminder_minutes
      const reminderAt = participant?.reminder_at ?? event.reminder_at
      let occurrenceDate: string
      let deliveryKey: string
      let reminderBody: string
      if (reminderAt) {
        const anchorReminder = localSchedule(new Date(reminderAt), subscription.timezone)
        if (local.time !== anchorReminder.time) continue
        const reminderDayOffset = differenceInDays(event.starts_on, anchorReminder.date)
        occurrenceDate = shiftDate(local.date, -reminderDayOffset)
        if (!isCalendarDue(event, occurrenceDate)) continue
        deliveryKey = `custom:${occurrenceDate}:${anchorReminder.time}:${reminderDayOffset}`
        reminderBody = 'Este é o lembrete personalizado do seu evento.'
      } else if (reminderMinutes !== null) {
        const target = addLocalMinutes(local, reminderMinutes)
        const eventTime = event.all_day ? '09:00' : event.start_time?.slice(0, 5)
        if (!eventTime || target.time !== eventTime || !isCalendarDue(event, target.date)) continue
        occurrenceDate = target.date
        deliveryKey = `relative:${target.date}:${reminderMinutes}`
        reminderBody = calendarReminderCopy(reminderMinutes)
      } else continue
      const { data: override } = await supabase.from('calendar_event_overrides').select('cancelled,start_time,all_day,starts_on').eq('event_id', event.id).eq('occurrence_date', occurrenceDate).maybeSingle()
      if (override?.cancelled) continue
      const { data: claim } = await supabase.from('calendar_notification_deliveries').insert({ event_id: event.id, user_id: subscription.user_id, subscription_id: subscription.id, occurrence_date: occurrenceDate, reminder_minutes: reminderMinutes, reminder_at: reminderAt, delivery_key: deliveryKey }).select('id').maybeSingle()
      if (!claim) continue
      try {
        await webpush.sendNotification({ endpoint: subscription.endpoint, keys: { p256dh: subscription.p256dh, auth: subscription.auth } }, JSON.stringify({
          title: `📅 ${event.name}`,
          body: event.description || reminderBody,
          tag: `calendar-event-${event.id}-${deliveryKey}`,
          url: '/agenda',
        }))
        delivered += 1
      } catch (error) {
        await supabase.from('calendar_notification_deliveries').delete().eq('event_id', event.id).eq('subscription_id', subscription.id).eq('delivery_key', deliveryKey)
        if (expired(error)) await supabase.from('push_subscriptions').delete().eq('id', subscription.id)
      }
    }
  }
  return json({ ok: true, delivered })
})

function isDue(task: TaskRow, dateKey: string) {
  if (dateKey < task.start_date) return false
  const date = new Date(`${dateKey}T12:00:00Z`)
  const start = new Date(`${task.start_date}T12:00:00Z`)
  if (task.frequency === 'daily') return true
  if (task.frequency === 'weekly') return (task.weekdays?.length ? task.weekdays : [start.getUTCDay()]).includes(date.getUTCDay())
  if (task.frequency === 'biweekly') return Math.round((date.getTime() - start.getTime()) / 86400000) % 14 === 0
  return date.getUTCDate() === start.getUTCDate()
}

function calendarEventVisibleTo(event: CalendarEventRow, userId: string, members: { family_id: string; user_id: string }[]) {
  if (event.created_by === userId) return true
  if (event.audience === 'family') return members.some((member) => member.family_id === event.family_id && member.user_id === userId)
  return event.audience === 'selected' && event.calendar_event_participants.some((participant) => participant.user_id === userId)
}

function isCalendarDue(event: CalendarEventRow, dateKey: string) {
  if (dateKey < event.starts_on || (event.recurrence_until && dateKey > event.recurrence_until)) return false
  if (event.recurrence === 'none') return dateKey === event.starts_on
  const date = new Date(`${dateKey}T12:00:00Z`); const start = new Date(`${event.starts_on}T12:00:00Z`)
  const days = Math.round((date.getTime() - start.getTime()) / 86400000)
  if (event.recurrence === 'daily') return true
  if (event.recurrence === 'weekly') return days % 7 === 0
  if (event.recurrence === 'biweekly') return days % 14 === 0
  if (event.recurrence === 'monthly') {
    const lastDay = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate()
    return date.getUTCDate() === Math.min(start.getUTCDate(), lastDay)
  }
  const lastDay = new Date(Date.UTC(date.getUTCFullYear(), start.getUTCMonth() + 1, 0)).getUTCDate()
  return date.getUTCMonth() === start.getUTCMonth() && date.getUTCDate() === Math.min(start.getUTCDate(), lastDay)
}

function addLocalMinutes(local: { date: string; time: string }, minutes: number) {
  const date = new Date(`${local.date}T${local.time}:00Z`); date.setUTCMinutes(date.getUTCMinutes() + minutes)
  return { date: date.toISOString().slice(0, 10), time: date.toISOString().slice(11, 16) }
}

function differenceInDays(from: string, to: string) {
  return Math.round((new Date(`${to}T12:00:00Z`).getTime() - new Date(`${from}T12:00:00Z`).getTime()) / 86400000)
}

function shiftDate(dateKey: string, days: number) {
  const date = new Date(`${dateKey}T12:00:00Z`)
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

function calendarReminderCopy(minutes: number) {
  if (minutes === 0) return 'Seu evento começa agora.'
  if (minutes === 15) return 'Seu evento começa em 15 minutos.'
  if (minutes === 60) return 'Seu evento começa em 1 hora.'
  return 'Seu evento acontece amanhã.'
}

function localSchedule(now: Date, timezone: string) {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(now)
  const value = (type: string) => parts.find((part) => part.type === type)?.value ?? ''
  return { date: `${value('year')}-${value('month')}-${value('day')}`, time: `${value('hour')}:${value('minute')}` }
}

function expired(error: unknown) {
  return typeof error === 'object' && error !== null && 'statusCode' in error && (error.statusCode === 404 || error.statusCode === 410)
}

function json(body: object, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })
}

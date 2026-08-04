import { createClient } from 'npm:@supabase/supabase-js@2'
import webpush from 'npm:web-push@3'

type SubscriptionRow = { id: string; user_id: string; endpoint: string; p256dh: string; auth: string; timezone: string }
type TaskRow = {
  id: string; user_id: string; emoji: string; name: string; description: string | null
  frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly'; weekdays: number[] | null
  start_date: string; notification_time: string | null
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
  const [{ data: subscriptions, error: subscriptionError }, { data: tasks, error: taskError }] = await Promise.all([
    supabase.from('push_subscriptions').select('*'),
    supabase.from('routine_tasks').select('id,user_id,emoji,name,description,frequency,weekdays,start_date,notification_time').eq('status', 'active').eq('notification_enabled', true).not('notification_time', 'is', null),
  ])
  if (subscriptionError || taskError) return json({ error: subscriptionError?.message || taskError?.message }, 500)

  let delivered = 0
  for (const subscription of (subscriptions ?? []) as SubscriptionRow[]) {
    const local = localSchedule(new Date(), subscription.timezone)
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

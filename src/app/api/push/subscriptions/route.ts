import { createClient } from '@/lib/supabase/server'

type SubscriptionBody = {
  endpoint?: string
  keys?: { p256dh?: string; auth?: string }
  timezone?: string
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Sessão inválida.' }, { status: 401 })

  const body = await request.json().catch(() => null) as SubscriptionBody | null
  if (!body?.endpoint || body.endpoint.length > 4096 || !body.keys?.p256dh || !body.keys.auth) {
    return Response.json({ error: 'Assinatura de notificação inválida.' }, { status: 400 })
  }
  const timezone = validTimezone(body.timezone) ? body.timezone : 'America/Sao_Paulo'

  const { data: member, error: memberError } = await supabase
    .from('family_members')
    .select('family_id')
    .eq('user_id', user.id)
    .limit(1)
    .single()
  if (memberError || !member) return Response.json({ error: 'Família não encontrada.' }, { status: 403 })

  const payload = {
    family_id: member.family_id,
    user_id: user.id,
    endpoint: body.endpoint,
    p256dh: body.keys.p256dh,
    auth: body.keys.auth,
    timezone,
  }
  const { data: current } = await supabase
    .from('push_subscriptions')
    .select('id')
    .eq('user_id', user.id)
    .eq('endpoint', body.endpoint)
    .maybeSingle()
  const result = current
    ? await supabase.from('push_subscriptions').update(payload).eq('id', current.id)
    : await supabase.from('push_subscriptions').insert(payload)

  if (result.error) return Response.json({ error: result.error.message }, { status: 500 })
  return Response.json({ ok: true })
}

function validTimezone(value: string | undefined): value is string {
  if (!value || value.length > 80) return false
  try {
    new Intl.DateTimeFormat('pt-BR', { timeZone: value }).format()
    return true
  } catch {
    return false
  }
}

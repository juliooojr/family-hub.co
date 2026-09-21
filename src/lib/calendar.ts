import type { SupabaseClient } from '@supabase/supabase-js'

export type CalendarAudience = 'family' | 'selected' | 'self'
export type CalendarRecurrence = 'none' | 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'yearly'
export type CalendarEditScope = 'occurrence' | 'future' | 'series'

export type CalendarEvent = {
  id: string; familyId: string; createdBy: string; name: string; description: string | null; location: string | null
  audience: CalendarAudience; allDay: boolean; startsOn: string; startTime: string | null; endTime: string | null; endsNextDay: boolean
  recurrence: CalendarRecurrence; recurrenceUntil: string | null; reminderMinutes: number | null; reminderAt: string | null
  participantIds: string[]; createdAt: string; updatedAt: string
}

export type CalendarOverride = {
  id: string; eventId: string; occurrenceDate: string; cancelled: boolean; name: string | null
  description: string | null; location: string | null; allDay: boolean | null; startsOn: string | null
  startTime: string | null; endTime: string | null; endsNextDay: boolean | null
}

export type CalendarEventInput = Omit<CalendarEvent, 'id' | 'familyId' | 'createdBy' | 'createdAt' | 'updatedAt'>
export type CalendarOccurrence = CalendarEvent & { occurrenceDate: string; sourceDate: string; occurrenceKey: string }

type EventRow = {
  id: string; family_id: string; created_by: string; name: string; description: string | null; location: string | null
  audience: CalendarAudience; all_day: boolean; starts_on: string; start_time: string | null; end_time: string | null; ends_next_day: boolean
  recurrence: CalendarRecurrence; recurrence_until: string | null; reminder_minutes: number | null; reminder_at: string | null; created_at: string; updated_at: string
  calendar_event_participants?: { user_id: string }[]
}
type OverrideRow = {
  id: string; event_id: string; occurrence_date: string; cancelled: boolean; name: string | null; description: string | null
  location: string | null; all_day: boolean | null; starts_on: string | null; start_time: string | null; end_time: string | null; ends_next_day: boolean | null
}

export async function getCalendarData(supabase: SupabaseClient) {
  const [eventsResult, overridesResult] = await Promise.all([
    supabase.from('calendar_events').select('*,calendar_event_participants(user_id)').order('starts_on'),
    supabase.from('calendar_event_overrides').select('*').order('occurrence_date'),
  ])
  if (eventsResult.error) throw eventsResult.error
  if (overridesResult.error) throw overridesResult.error
  return {
    events: ((eventsResult.data ?? []) as EventRow[]).map(mapEvent),
    overrides: ((overridesResult.data ?? []) as OverrideRow[]).map(mapOverride),
  }
}

export async function createCalendarEvent(supabase: SupabaseClient, familyId: string, userId: string, input: CalendarEventInput) {
  const { participantIds, ...values } = input
  const { data, error } = await supabase.from('calendar_events').insert(toRow(familyId, userId, values)).select('*').single()
  if (error) throw error
  const event = mapEvent(data as EventRow)
  if (input.audience === 'selected' && participantIds.length) await replaceParticipants(supabase, event.id, familyId, participantIds, input.reminderMinutes, input.reminderAt)
  return { ...event, participantIds: input.audience === 'selected' ? participantIds : [] }
}

export async function updateCalendarEvent(supabase: SupabaseClient, event: CalendarEvent, input: CalendarEventInput) {
  const { participantIds, ...values } = input
  const { data, error } = await supabase.from('calendar_events').update(toUpdateRow(values)).eq('id', event.id).select('*').single()
  if (error) throw error
  await replaceParticipants(supabase, event.id, event.familyId, input.audience === 'selected' ? participantIds : [], input.reminderMinutes, input.reminderAt)
  return { ...mapEvent(data as EventRow), participantIds: input.audience === 'selected' ? participantIds : [] }
}

export async function updateCalendarOccurrence(supabase: SupabaseClient, event: CalendarEvent, occurrenceDate: string, input: CalendarEventInput, userId: string) {
  const payload = {
    event_id: event.id, family_id: event.familyId, occurrence_date: occurrenceDate, cancelled: false,
    name: input.name, description: input.description, location: input.location, all_day: input.allDay,
    starts_on: input.startsOn, start_time: input.allDay ? null : input.startTime, end_time: input.allDay ? null : input.endTime, ends_next_day: input.allDay ? false : input.endsNextDay, updated_by: userId,
  }
  const { data, error } = await supabase.from('calendar_event_overrides').upsert(payload, { onConflict: 'event_id,occurrence_date' }).select('*').single()
  if (error) throw error
  return mapOverride(data as OverrideRow)
}

export async function splitCalendarSeries(supabase: SupabaseClient, event: CalendarEvent, occurrenceDate: string, input: CalendarEventInput, userId: string) {
  const previousDate = addDays(occurrenceDate, -1)
  const { error } = await supabase.from('calendar_events').update({ recurrence_until: previousDate }).eq('id', event.id)
  if (error) throw error
  return createCalendarEvent(supabase, event.familyId, userId, { ...input, startsOn: input.startsOn || occurrenceDate })
}

export async function deleteCalendarEvent(supabase: SupabaseClient, eventId: string) {
  const { error } = await supabase.from('calendar_events').delete().eq('id', eventId)
  if (error) throw error
}

export async function cancelCalendarOccurrence(supabase: SupabaseClient, event: CalendarEvent, occurrenceDate: string, userId: string) {
  const { data, error } = await supabase.from('calendar_event_overrides').upsert({
    event_id: event.id, family_id: event.familyId, occurrence_date: occurrenceDate, cancelled: true, updated_by: userId,
  }, { onConflict: 'event_id,occurrence_date' }).select('*').single()
  if (error) throw error
  return mapOverride(data as OverrideRow)
}

export async function deleteCalendarFuture(supabase: SupabaseClient, eventId: string, occurrenceDate: string) {
  const { error } = await supabase.from('calendar_events').update({ recurrence_until: addDays(occurrenceDate, -1) }).eq('id', eventId)
  if (error) throw error
}

async function replaceParticipants(supabase: SupabaseClient, eventId: string, familyId: string, participantIds: string[], reminderMinutes: number | null, reminderAt: string | null) {
  const { error: deleteError } = await supabase.from('calendar_event_participants').delete().eq('event_id', eventId)
  if (deleteError) throw deleteError
  if (!participantIds.length) return
  const { error } = await supabase.from('calendar_event_participants').insert(participantIds.map((userId) => ({ event_id: eventId, family_id: familyId, user_id: userId, reminder_minutes: reminderMinutes, reminder_at: reminderAt })))
  if (error) throw error
}

export function expandCalendarEvents(events: CalendarEvent[], overrides: CalendarOverride[], from: string, to: string) {
  const overrideMap = new Map(overrides.map((item) => [`${item.eventId}:${item.occurrenceDate}`, item]))
  const result: CalendarOccurrence[] = []
  events.forEach((event) => {
    let cursor = event.startsOn
    let guard = 0
    while (cursor <= to && guard < 1500) {
      if (cursor >= from && (!event.recurrenceUntil || cursor <= event.recurrenceUntil)) {
        const override = overrideMap.get(`${event.id}:${cursor}`)
        if (!override?.cancelled) {
          const occurrenceDate = override?.startsOn ?? cursor
          result.push({
            ...event,
            name: override?.name ?? event.name,
            description: override ? override.description : event.description,
            location: override ? override.location : event.location,
            allDay: override?.allDay ?? event.allDay,
            startsOn: occurrenceDate,
            startTime: override?.startTime ?? event.startTime,
            endTime: override?.endTime ?? event.endTime,
            endsNextDay: override?.endsNextDay ?? event.endsNextDay,
            occurrenceDate,
            sourceDate: cursor,
            occurrenceKey: `${event.id}:${cursor}`,
          })
        }
      }
      if (event.recurrence === 'none') break
      cursor = nextOccurrence(cursor, event.recurrence, event.startsOn)
      if (event.recurrenceUntil && cursor > event.recurrenceUntil) break
      guard += 1
    }
  })
  return result.sort((a, b) => `${a.occurrenceDate}T${a.startTime ?? '00:00'}`.localeCompare(`${b.occurrenceDate}T${b.startTime ?? '00:00'}`))
}

export function addDays(dateKey: string, amount: number) {
  const date = new Date(`${dateKey}T12:00:00Z`); date.setUTCDate(date.getUTCDate() + amount); return date.toISOString().slice(0, 10)
}
function nextOccurrence(dateKey: string, recurrence: CalendarRecurrence, anchorKey: string) {
  const date = new Date(`${dateKey}T12:00:00Z`)
  if (recurrence === 'daily') date.setUTCDate(date.getUTCDate() + 1)
  if (recurrence === 'weekly') date.setUTCDate(date.getUTCDate() + 7)
  if (recurrence === 'biweekly') date.setUTCDate(date.getUTCDate() + 14)
  const anchor = new Date(`${anchorKey}T12:00:00Z`)
  if (recurrence === 'monthly') {
    const targetMonth = date.getUTCMonth() + 1; date.setUTCDate(1); date.setUTCMonth(targetMonth)
    const lastDay = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate()
    date.setUTCDate(Math.min(anchor.getUTCDate(), lastDay))
  }
  if (recurrence === 'yearly') {
    const targetYear = date.getUTCFullYear() + 1; date.setUTCDate(1); date.setUTCFullYear(targetYear); date.setUTCMonth(anchor.getUTCMonth())
    const lastDay = new Date(Date.UTC(targetYear, anchor.getUTCMonth() + 1, 0)).getUTCDate()
    date.setUTCDate(Math.min(anchor.getUTCDate(), lastDay))
  }
  return date.toISOString().slice(0, 10)
}

function mapEvent(row: EventRow): CalendarEvent {
  return { id: row.id, familyId: row.family_id, createdBy: row.created_by, name: row.name, description: row.description, location: row.location,
    audience: row.audience, allDay: row.all_day, startsOn: row.starts_on, startTime: row.start_time?.slice(0, 5) ?? null, endTime: row.end_time?.slice(0, 5) ?? null, endsNextDay: row.ends_next_day,
    recurrence: row.recurrence, recurrenceUntil: row.recurrence_until, reminderMinutes: row.reminder_minutes, reminderAt: row.reminder_at,
    participantIds: row.calendar_event_participants?.map((item) => item.user_id) ?? [], createdAt: row.created_at, updatedAt: row.updated_at }
}
function mapOverride(row: OverrideRow): CalendarOverride {
  return { id: row.id, eventId: row.event_id, occurrenceDate: row.occurrence_date, cancelled: row.cancelled, name: row.name,
    description: row.description, location: row.location, allDay: row.all_day, startsOn: row.starts_on,
    startTime: row.start_time?.slice(0, 5) ?? null, endTime: row.end_time?.slice(0, 5) ?? null, endsNextDay: row.ends_next_day }
}
function toRow(familyId: string, userId: string, values: Omit<CalendarEventInput, 'participantIds'>) { return { family_id: familyId, created_by: userId, ...toUpdateRow(values) } }
function toUpdateRow(values: Omit<CalendarEventInput, 'participantIds'>) {
  return { name: values.name.trim(), description: values.description || null, location: values.location || null, audience: values.audience,
    all_day: values.allDay, starts_on: values.startsOn, start_time: values.allDay ? null : values.startTime, end_time: values.allDay ? null : values.endTime, ends_next_day: values.allDay ? false : values.endsNextDay,
    recurrence: values.recurrence, recurrence_until: values.recurrence === 'none' ? null : values.recurrenceUntil, reminder_minutes: values.reminderMinutes, reminder_at: values.reminderAt }
}

'use client'

import Link from 'next/link'
import { CalendarDays, Clock, MapPin, Users } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import type { CalendarOccurrence } from '@/lib/calendar'
import { createClient } from '@/lib/supabase/client'

export type HubCalendarDay = { date: string; events: CalendarOccurrence[] }

export default function HubCalendarPreview({ days, familyId }: { days: HubCalendarDay[]; familyId: string }) {
  const [selected, setSelected] = useState<CalendarOccurrence | null>(null)
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    const refresh = () => router.refresh()
    const channel = supabase.channel(`hub-calendar-${familyId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'calendar_events', filter: `family_id=eq.${familyId}` }, refresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'calendar_event_participants', filter: `family_id=eq.${familyId}` }, refresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'calendar_event_overrides', filter: `family_id=eq.${familyId}` }, refresh)
      .subscribe()
    window.addEventListener('focus', refresh)
    return () => { window.removeEventListener('focus', refresh); void supabase.removeChannel(channel) }
  }, [familyId, router, supabase])

  return <>
    <div className="dashboard-calendar" aria-label="Eventos dos próximos sete dias">
      {days.map((day, index) => <section className={index === 0 ? 'today' : ''} key={day.date}>
        <header><span>{index === 0 ? 'Hoje' : formatWeekday(day.date)}</span><strong>{formatDayMonth(day.date)}</strong></header>
        <div>{day.events.slice(0, 2).map((event) => <button type="button" title={event.name} onClick={() => setSelected(event)} key={event.occurrenceKey}><small>{event.allDay ? 'Dia inteiro' : event.startTime}</small><strong>{event.name}</strong></button>)}{day.events.length > 2 ? <Link className="more" href="/agenda">+{day.events.length - 2} {day.events.length - 2 === 1 ? 'evento' : 'eventos'}</Link> : null}{day.events.length === 0 ? <span className="empty" aria-label="Sem eventos">—</span> : null}</div>
      </section>)}
    </div>
    {selected ? <div className="modal-overlay dashboard-event-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelected(null) }}><section className="modal-card dashboard-event-modal" role="dialog" aria-modal="true" aria-label={`Detalhes de ${selected.name}`}><header><h2>DETALHES DO EVENTO</h2><button type="button" onClick={() => setSelected(null)} aria-label="Fechar">×</button></header><div className="dashboard-event-title"><span><CalendarDays /></span><div><strong>{selected.name}</strong><small>{formatLongDate(selected.occurrenceDate)}</small></div></div><dl><div><dt><Clock /> Horário</dt><dd>{selected.allDay ? 'Dia inteiro' : `${selected.startTime}${selected.endTime ? ` – ${selected.endTime}${selected.endsNextDay ? ' (dia seguinte)' : ''}` : ''}`}</dd></div><div><dt><Users /> Para quem</dt><dd>{audienceLabel(selected)}</dd></div>{selected.location ? <div><dt><MapPin /> Local</dt><dd>{selected.location}</dd></div> : null}</dl>{selected.description ? <div className="dashboard-event-notes"><small>OBSERVAÇÕES</small><p>{selected.description}</p></div> : null}<div className="modal-actions"><button className="button button-ghost" type="button" onClick={() => setSelected(null)}>Fechar</button><Link className="button button-primary" href="/agenda">Ver na agenda</Link></div></section></div> : null}
  </>
}

function audienceLabel(event: CalendarOccurrence) {
  if (event.audience === 'family') return 'Toda a família'
  if (event.audience === 'self') return 'Somente eu'
  return `${event.participantIds.length + 1} pessoas`
}

function formatWeekday(date: string) {
  return new Intl.DateTimeFormat('pt-BR', { weekday: 'short' }).format(new Date(`${date}T12:00:00`)).replace('.', '').replace(/^./, (letter) => letter.toUpperCase())
}

function formatDayMonth(date: string) {
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit' }).format(new Date(`${date}T12:00:00`))
}

function formatLongDate(date: string) {
  return new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' }).format(new Date(`${date}T12:00:00`)).replace(/^./, (letter) => letter.toUpperCase())
}

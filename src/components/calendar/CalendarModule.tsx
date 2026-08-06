'use client'

import Link from 'next/link'
import Image from 'next/image'
import { CalendarDays, ChevronLeft, ChevronRight, MapPin, Users, X } from 'lucide-react'
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import {
  addDays, cancelCalendarOccurrence, createCalendarEvent, deleteCalendarEvent, deleteCalendarFuture, expandCalendarEvents,
  getCalendarData, splitCalendarSeries, updateCalendarEvent, updateCalendarOccurrence,
  type CalendarAudience, type CalendarEditScope, type CalendarEvent, type CalendarEventInput, type CalendarOccurrence,
  type CalendarOverride, type CalendarRecurrence,
} from '@/lib/calendar'
import { displayMemberName, type FamilyMember } from '@/lib/family'
import { subscribeCurrentDevice } from '@/lib/push-notifications'
import { createClient } from '@/lib/supabase/client'

type View = 'agenda' | 'month'
type Filter = 'all' | 'mine'

export default function CalendarModule({ familyId, userId, canManageAll, members, initialEvents, initialOverrides, initialError = '' }: {
  familyId: string; userId: string; canManageAll: boolean; members: FamilyMember[]; initialEvents: CalendarEvent[]; initialOverrides: CalendarOverride[]; initialError?: string
}) {
  const supabase = useMemo(() => createClient(), [])
  const today = todayKey()
  const [events, setEvents] = useState(initialEvents)
  const [overrides, setOverrides] = useState(initialOverrides)
  const [view, setView] = useState<View>('agenda')
  const [filter, setFilter] = useState<Filter>('all')
  const [month, setMonth] = useState(today.slice(0, 7))
  const [modal, setModal] = useState<CalendarOccurrence | 'new' | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<CalendarOccurrence | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(initialError)

  async function refresh() {
    try { const data = await getCalendarData(supabase); setEvents(data.events); setOverrides(data.overrides); setError('') }
    catch { /* Mantém os dados atuais durante uma reconexão breve. */ }
  }

  useEffect(() => {
    const channel = supabase.channel(`calendar-${familyId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'calendar_events', filter: `family_id=eq.${familyId}` }, refresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'calendar_event_participants', filter: `family_id=eq.${familyId}` }, refresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'calendar_event_overrides', filter: `family_id=eq.${familyId}` }, refresh)
      .subscribe()
    const onFocus = () => void refresh()
    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onFocus)
    return () => { window.removeEventListener('focus', onFocus); document.removeEventListener('visibilitychange', onFocus); void supabase.removeChannel(channel) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [familyId, supabase])

  const range = view === 'month' ? monthRange(month) : { from: today, to: addDays(today, 365) }
  const occurrences = useMemo(() => expandCalendarEvents(events, overrides, range.from, range.to).filter((item) => matchesFilter(item, filter, userId)), [events, overrides, range.from, range.to, filter, userId])
  const grouped = useMemo(() => groupOccurrences(occurrences), [occurrences])

  async function save(input: CalendarEventInput, scope: CalendarEditScope) {
    setBusy(true)
    try {
      if (input.reminderMinutes !== null) await subscribeCurrentDevice()
      if (modal === 'new') {
        const created = await createCalendarEvent(supabase, familyId, userId, input); setEvents((current) => [...current, created])
      } else if (modal) {
        const source = events.find((item) => item.id === modal.id)!
        if (scope === 'occurrence' && source.recurrence !== 'none') {
          const override = await updateCalendarOccurrence(supabase, source, modal.sourceDate, input, userId)
          setOverrides((current) => [...current.filter((item) => !(item.eventId === override.eventId && item.occurrenceDate === override.occurrenceDate)), override])
        } else if (scope === 'future' && source.recurrence !== 'none') {
          const created = await splitCalendarSeries(supabase, source, modal.sourceDate, input, userId)
          setEvents((current) => [...current.map((item) => item.id === source.id ? { ...item, recurrenceUntil: addDays(modal.sourceDate, -1) } : item), created])
        } else {
          const updated = await updateCalendarEvent(supabase, source, input); setEvents((current) => current.map((item) => item.id === updated.id ? updated : item))
        }
      }
      setModal(null); setError('')
    } catch (saveError) { setError(saveError instanceof Error ? saveError.message : 'Não foi possível salvar o evento.') }
    finally { setBusy(false) }
  }

  async function remove(scope: CalendarEditScope) {
    if (!deleteTarget) return
    setBusy(true)
    try {
      const source = events.find((item) => item.id === deleteTarget.id)!
      if (scope === 'occurrence' && source.recurrence !== 'none') {
        const override = await cancelCalendarOccurrence(supabase, source, deleteTarget.sourceDate, userId); setOverrides((current) => [...current, override])
      } else if (scope === 'future' && source.recurrence !== 'none') {
        await deleteCalendarFuture(supabase, source.id, deleteTarget.sourceDate); setEvents((current) => current.map((item) => item.id === source.id ? { ...item, recurrenceUntil: addDays(deleteTarget.sourceDate, -1) } : item))
      } else { await deleteCalendarEvent(supabase, source.id); setEvents((current) => current.filter((item) => item.id !== source.id)) }
      setDeleteTarget(null); setModal(null); setError('')
    } catch (removeError) { setError(removeError instanceof Error ? removeError.message : 'Não foi possível excluir o evento.') }
    finally { setBusy(false) }
  }

  return <main className="calendar-shell">
    <header className="tasks-topbar calendar-topbar">
      <div className="tasks-topbar-main">
        <Link className="finance-back" href="/hub" aria-label="Voltar ao início">‹</Link>
        <div className="tasks-heading"><h1>Agenda</h1><p>Compromissos da família</p></div>
        <div className="tasks-tabs" role="tablist" aria-label="Visualização da agenda"><button className={view === 'agenda' ? 'active' : ''} onClick={() => setView('agenda')}>Agenda</button><button className={view === 'month' ? 'active' : ''} onClick={() => setView('month')}>Mês</button></div>
      </div>
      <div className="tasks-actions calendar-actions"><button className="button button-primary" onClick={() => setModal('new')}>+ Evento</button></div>
    </header>
    <section className="calendar-content">
      {error ? <div className="error-banner module-error" role="alert">{error}<button onClick={() => setError('')}>×</button></div> : null}
      <div className="tasks-tabs calendar-filters" role="tablist" aria-label="Filtrar eventos"><button className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}>Todos</button><button className={filter === 'mine' ? 'active' : ''} onClick={() => setFilter('mine')}>Meus eventos</button></div>
      {view === 'month' ? <MonthView month={month} occurrences={occurrences} onMonth={setMonth} onSelect={setModal} /> : <AgendaView grouped={grouped} onSelect={setModal} />}
    </section>
    {modal ? <EventModal initial={modal === 'new' ? null : modal} members={members} userId={userId} busy={busy} error={error} canManage={modal === 'new' || canManageAll || modal.createdBy === userId} onClose={() => setModal(null)} onSave={save} onError={setError} onDelete={modal === 'new' ? undefined : () => setDeleteTarget(modal)} /> : null}
    {deleteTarget ? <ScopeModal title="EXCLUIR EVENTO" recurrence={deleteTarget.recurrence} destructive busy={busy} onClose={() => setDeleteTarget(null)} onChoose={remove} /> : null}
  </main>
}

function AgendaView({ grouped, onSelect }: { grouped: [string, CalendarOccurrence[]][]; onSelect: (item: CalendarOccurrence) => void }) {
  if (!grouped.length) return <EmptyState />
  return <div className="calendar-agenda">{grouped.map(([date, items]) => <section className="calendar-day" key={date}><header><strong>{formatDayHeading(date)}</strong><small>{formatDate(date)}</small></header><div>{items.map((item) => <EventCard event={item} onClick={() => onSelect(item)} key={item.occurrenceKey} />)}</div></section>)}</div>
}

function MonthView({ month, occurrences, onMonth, onSelect }: { month: string; occurrences: CalendarOccurrence[]; onMonth: (value: string) => void; onSelect: (item: CalendarOccurrence) => void }) {
  const cells = monthCells(month); const byDate = new Map<string, CalendarOccurrence[]>()
  occurrences.forEach((item) => byDate.set(item.occurrenceDate, [...(byDate.get(item.occurrenceDate) ?? []), item]))
  return <div className="calendar-month"><header><button onClick={() => onMonth(shiftMonth(month, -1))} aria-label="Mês anterior"><ChevronLeft /></button><h2>{formatMonth(month)}</h2><button onClick={() => onMonth(shiftMonth(month, 1))} aria-label="Próximo mês"><ChevronRight /></button></header><div className="calendar-weekdays">{['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'].map((day) => <span key={day}>{day}</span>)}</div><div className="calendar-grid">{cells.map((date) => <div className={`${date.slice(0, 7) !== month ? 'outside' : ''} ${date === todayKey() ? 'today' : ''}`} key={date}><b>{Number(date.slice(8))}</b>{(byDate.get(date) ?? []).slice(0, 3).map((item) => <button onClick={() => onSelect(item)} key={item.occurrenceKey}><span>{item.allDay ? '' : item.startTime}</span>{item.name}</button>)}{(byDate.get(date)?.length ?? 0) > 3 ? <small>+{byDate.get(date)!.length - 3}</small> : null}</div>)}</div></div>
}

function EventCard({ event, onClick }: { event: CalendarOccurrence; onClick: () => void }) {
  return <button className="calendar-event-card" onClick={onClick}><span className="calendar-event-time">{event.allDay ? 'Dia inteiro' : event.startTime}{event.endTime ? ` – ${event.endTime}` : ''}</span><div><strong>{event.name}</strong>{event.location ? <small><MapPin />{event.location}</small> : null}</div><span className="calendar-event-audience"><Users />{audienceLabel(event)}</span></button>
}

function EventModal({ initial, members, userId, busy, error, canManage, onClose, onSave, onError, onDelete }: { initial: CalendarOccurrence | null; members: FamilyMember[]; userId: string; busy: boolean; error: string; canManage: boolean; onClose: () => void; onSave: (input: CalendarEventInput, scope: CalendarEditScope) => void; onError: (message: string) => void; onDelete?: () => void }) {
  const [name, setName] = useState(initial?.name ?? '')
  const [date, setDate] = useState(initial?.occurrenceDate ?? todayKey())
  const [allDay, setAllDay] = useState(initial?.allDay ?? false)
  const [startTime, setStartTime] = useState(initial?.startTime ?? '09:00')
  const [endTime, setEndTime] = useState(initial?.endTime ?? '10:00')
  const [audience, setAudience] = useState<CalendarAudience>(initial?.audience ?? 'family')
  const [participants, setParticipants] = useState<string[]>(initial?.participantIds ?? [])
  const [recurrence, setRecurrence] = useState<CalendarRecurrence>(initial?.recurrence ?? 'none')
  const [until, setUntil] = useState(initial?.recurrenceUntil ?? '')
  const [notificationEnabled, setNotificationEnabled] = useState(initial?.reminderMinutes !== null && initial?.reminderMinutes !== undefined)
  const [reminder, setReminder] = useState(initial?.reminderMinutes === null || initial?.reminderMinutes === undefined ? '15' : String(initial.reminderMinutes))
  const [enablingNotification, setEnablingNotification] = useState(false)
  const [location, setLocation] = useState(initial?.location ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [scopeOpen, setScopeOpen] = useState(false)
  const [pendingInput, setPendingInput] = useState<CalendarEventInput | null>(null)
  const [formError, setFormError] = useState('')
  function saveForm() {
    if (busy || enablingNotification) return
    if (!name.trim()) { setFormError('Informe o nome do evento.'); return }
    if (!date) { setFormError('Informe a data do evento.'); return }
    if (!allDay && !startTime) { setFormError('Informe o horário de início.'); return }
    if (!allDay && endTime && endTime <= startTime) { setFormError('O horário de término deve ser posterior ao início.'); return }
    if (audience === 'selected' && !participants.length) { setFormError('Selecione pelo menos uma pessoa.'); return }
    setFormError('')
    const input: CalendarEventInput = { name: name.trim(), description: description.trim() || null, location: location.trim() || null, audience, allDay, startsOn: date, startTime: allDay ? null : startTime, endTime: allDay ? null : endTime || null, recurrence, recurrenceUntil: recurrence === 'none' ? null : until || null, reminderMinutes: notificationEnabled ? Number(reminder) : null, participantIds: audience === 'selected' ? participants : [] }
    if (initial && initial.recurrence !== 'none') { setPendingInput(input); setScopeOpen(true) } else onSave(input, 'series')
  }
  async function toggleNotification() {
    if (notificationEnabled) { setNotificationEnabled(false); return }
    setNotificationEnabled(true); setEnablingNotification(true)
    try { await subscribeCurrentDevice() }
    catch (error) { setNotificationEnabled(false); onError(error instanceof Error ? error.message : 'Não foi possível ativar as notificações.') }
    finally { setEnablingNotification(false) }
  }
  return <><div className="modal-overlay calendar-modal-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) onClose() }}><section className="modal-card task-modal calendar-modal" role="dialog" aria-modal="true" aria-label={initial ? 'Editar evento' : 'Novo evento'}><header><h2>{initial ? 'EDITAR EVENTO' : 'NOVO EVENTO'}</h2><button type="button" onClick={onClose} aria-label="Fechar" disabled={busy}>×</button></header><form onSubmit={(event: FormEvent) => { event.preventDefault(); saveForm() }} noValidate>
    {formError || error ? <div className="error-banner calendar-modal-error" role="alert">{formError || error}</div> : null}
    <label className="field-label" htmlFor="event-name">NOME</label><input id="event-name" className="field" value={name} onChange={(e) => setName(e.target.value)} maxLength={120} required disabled={!canManage} placeholder="Ex: Almoço em família" />
    <div className="calendar-form-row"><div><label className="field-label" htmlFor="event-date">DATA</label><input id="event-date" className="field" type="date" value={date} onChange={(e) => setDate(e.target.value)} disabled={!canManage} required /></div><label className="calendar-check"><input type="checkbox" checked={allDay} onChange={(e) => setAllDay(e.target.checked)} disabled={!canManage} /> Dia inteiro</label></div>
    {!allDay ? <div className="calendar-form-row"><div><label className="field-label" htmlFor="event-start">INÍCIO</label><input id="event-start" className="field" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} disabled={!canManage} required /></div><div><label className="field-label" htmlFor="event-end">TÉRMINO</label><input id="event-end" className="field" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} disabled={!canManage} /></div></div> : null}
    <label className="field-label">PARA QUEM</label><div className="calendar-audience">{([['family','Toda a família'],['selected','Pessoas específicas'],['self','Somente eu']] as [CalendarAudience,string][]).map(([value,label]) => <button type="button" className={audience === value ? 'active' : ''} onClick={() => setAudience(value)} disabled={!canManage} key={value}>{label}</button>)}</div>
    {audience === 'selected' ? <div className="calendar-members">{members.filter((member) => member.userId !== userId).map((member) => <label key={member.id}><input type="checkbox" checked={participants.includes(member.userId)} disabled={!canManage} onChange={() => setParticipants((current) => current.includes(member.userId) ? current.filter((id) => id !== member.userId) : [...current, member.userId])} />{member.avatarUrl ? <Image src={member.avatarUrl} width={25} height={25} unoptimized alt="" /> : <span>{displayMemberName(member).slice(0, 1)}</span>}<strong>{displayMemberName(member)}</strong></label>)}</div> : null}
    <div className="calendar-form-row"><div><label className="field-label" htmlFor="event-repeat">FREQUÊNCIA</label><select id="event-repeat" className="field" value={recurrence} onChange={(e) => setRecurrence(e.target.value as CalendarRecurrence)} disabled={!canManage}><option value="none">Não repetir</option><option value="daily">Todos os dias</option><option value="weekly">Toda semana</option><option value="biweekly">A cada duas semanas</option><option value="monthly">Todo mês</option><option value="yearly">Todo ano</option></select></div>{recurrence !== 'none' ? <div><label className="field-label" htmlFor="event-until">REPETIR ATÉ (OPCIONAL)</label><input id="event-until" className="field" type="date" min={date} value={until} onChange={(e) => setUntil(e.target.value)} disabled={!canManage} /></div> : null}</div>
    <label className="field-label" htmlFor="event-location">LOCAL OPCIONAL</label><input id="event-location" className="field" value={location} onChange={(e) => setLocation(e.target.value)} maxLength={160} disabled={!canManage} placeholder="Ex: Consultório ou endereço" />
    <label className="field-label" htmlFor="event-notes">OBSERVAÇÕES OPCIONAIS</label><textarea id="event-notes" className="field" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={600} disabled={!canManage} placeholder="Informações úteis para a família" />
    <div className={`task-notification ${notificationEnabled ? 'enabled' : ''}`}>
      <div><strong>Lembrete no celular</strong><small>{enablingNotification ? 'Ativando neste aparelho…' : notificationEnabled ? 'Lembrete ativo para este evento' : 'Receba um aviso mesmo com o app fechado'}</small></div>
      <button type="button" className="task-notification-switch" role="switch" aria-checked={notificationEnabled} aria-label="Ativar lembrete no celular" disabled={!canManage || enablingNotification} onClick={() => void toggleNotification()}><span /></button>
    </div>
    {notificationEnabled ? <div className="task-reminder-time"><label htmlFor="event-reminder"><strong>Quando lembrar</strong><small>Escolha a antecedência do aviso</small></label><select id="event-reminder" value={reminder} onChange={(e) => setReminder(e.target.value)} disabled={!canManage}><option value="0">Na hora</option><option value="15">15 minutos antes</option><option value="60">1 hora antes</option><option value="1440">1 dia antes</option></select></div> : null}
    {!canManage ? <p className="calendar-readonly">Somente quem criou o evento ou um administrador pode alterá-lo.</p> : null}
    <div className="modal-actions">{onDelete && canManage ? <button className="button button-danger button-left" type="button" onClick={onDelete}>Excluir</button> : null}<button className="button button-ghost" type="button" onClick={onClose}>Cancelar</button>{canManage ? <button type="submit" className="button button-primary calendar-save-button" disabled={busy || enablingNotification}>{busy ? 'Salvando...' : enablingNotification ? 'Ativando...' : 'Salvar'}</button> : null}</div>
  </form></section></div>{scopeOpen && pendingInput ? <ScopeModal title="APLICAR ALTERAÇÃO" recurrence={initial?.recurrence ?? 'none'} busy={busy} onClose={() => setScopeOpen(false)} onChoose={(scope) => onSave(pendingInput, scope)} /> : null}</>
}

function ScopeModal({ title, recurrence, busy, destructive = false, onClose, onChoose }: { title: string; recurrence: CalendarRecurrence; busy: boolean; destructive?: boolean; onClose: () => void; onChoose: (scope: CalendarEditScope) => void }) {
  return <div className="modal-overlay calendar-scope-overlay"><section className="modal-card calendar-scope"><header><h2>{title}</h2><button onClick={onClose}><X /></button></header><p>Como deseja aplicar esta ação?</p><div>{recurrence !== 'none' ? <><button disabled={busy} onClick={() => onChoose('occurrence')}>Somente este evento</button><button disabled={busy} onClick={() => onChoose('future')}>Este e os próximos</button></> : null}<button className={destructive ? 'danger' : ''} disabled={busy} onClick={() => onChoose('series')}>{recurrence === 'none' ? 'Confirmar' : 'Toda a série'}</button></div></section></div>
}

function EmptyState() { return <div className="calendar-empty"><CalendarDays /><strong>Nenhum evento por aqui</strong><small>Crie um compromisso e escolha quem deve vê-lo na agenda.</small></div> }
function matchesFilter(event: CalendarOccurrence, filter: Filter, userId: string) { return filter === 'all' || event.createdBy === userId || event.participantIds.includes(userId) }
function audienceLabel(event: CalendarOccurrence) { if (event.audience === 'family') return 'Família'; if (event.audience === 'self') return 'Pessoal'; return `${event.participantIds.length + 1} pessoas` }
function groupOccurrences(items: CalendarOccurrence[]) { const map = new Map<string, CalendarOccurrence[]>(); items.forEach((item) => map.set(item.occurrenceDate, [...(map.get(item.occurrenceDate) ?? []), item])); return [...map.entries()] }
function todayKey() { return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date()) }
function formatDate(value: string) { return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'long' }).format(new Date(`${value}T12:00:00`)) }
function formatDayHeading(value: string) { const diff = Math.round((new Date(`${value}T12:00:00Z`).getTime() - new Date(`${todayKey()}T12:00:00Z`).getTime()) / 86400000); if (diff === 0) return 'Hoje'; if (diff === 1) return 'Amanhã'; return new Intl.DateTimeFormat('pt-BR', { weekday: 'long' }).format(new Date(`${value}T12:00:00`)).replace(/^./, (letter) => letter.toUpperCase()) }
function monthRange(month: string) { const first = `${month}-01`; const start = addDays(first, -new Date(`${first}T12:00:00Z`).getUTCDay()); return { from: start, to: addDays(start, 41) } }
function monthCells(month: string) { const range = monthRange(month); return Array.from({ length: 42 }, (_, index) => addDays(range.from, index)) }
function shiftMonth(month: string, amount: number) { const date = new Date(`${month}-01T12:00:00Z`); date.setUTCMonth(date.getUTCMonth() + amount); return date.toISOString().slice(0, 7) }
function formatMonth(month: string) { return new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(new Date(`${month}-01T12:00:00`)).replace(/^./, (letter) => letter.toUpperCase()) }

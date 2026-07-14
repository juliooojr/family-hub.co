'use client'

import Link from 'next/link'
import { useMemo, useState, type FormEvent } from 'react'
import { createClient } from '@/lib/supabase/client'
import { subscribeCurrentDevice } from '@/lib/push-notifications'
import {
  calculateTaskStreak,
  createTask,
  deleteTask,
  getTodayKey,
  isTaskDueOn,
  nextDateKey,
  previousDateKey,
  saveTaskEntry,
  updateTask,
  type RoutineEntry,
  type RoutineTask,
  type TaskFrequency,
  type TaskGoalType,
  type TaskInput,
} from '@/lib/tasks'

type Tab = 'today' | 'all'
type Modal = RoutineTask | 'new' | null

const EMOJIS = ['✓', '💊', '💧', '🛏️', '🧴', '📚', '🏃', '🧘', '🧹', '🍼', '🐾', '☀️', '🌙', '➕']
const WEEKDAYS = [
  { value: 0, label: 'Dom' },
  { value: 1, label: 'Seg' },
  { value: 2, label: 'Ter' },
  { value: 3, label: 'Qua' },
  { value: 4, label: 'Qui' },
  { value: 5, label: 'Sex' },
  { value: 6, label: 'Sab' },
]

export default function TasksModule({
  familyId,
  userId,
  initialTasks,
  initialEntries,
  initialError = '',
}: {
  familyId: string
  userId: string
  initialTasks: RoutineTask[]
  initialEntries: RoutineEntry[]
  initialError?: string
}) {
  const supabase = useMemo(() => createClient(), [])
  const todayKey = getTodayKey()
  const [selectedDate, setSelectedDate] = useState(todayKey)
  const [tab, setTab] = useState<Tab>('today')
  const [tasks, setTasks] = useState(initialTasks)
  const [entries, setEntries] = useState(initialEntries)
  const [modal, setModal] = useState<Modal>(null)
  const [deleteCandidate, setDeleteCandidate] = useState<RoutineTask | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(initialError)
  const [manualAmounts, setManualAmounts] = useState<Record<string, string>>({})

  const activeTasks = useMemo(() => tasks.filter((task) => task.status === 'active'), [tasks])
  const entriesByTaskDate = useMemo(() => {
    const map = new Map<string, RoutineEntry>()
    entries.forEach((entry) => map.set(`${entry.taskId}:${entry.entryDate}`, entry))
    return map
  }, [entries])
  const dueTasks = activeTasks.filter((task) => isTaskDueOn(task, selectedDate))
  const completedToday = dueTasks.filter((task) => getEntry(task.id)?.completed).length

  function getEntry(taskId: string) {
    return entriesByTaskDate.get(`${taskId}:${selectedDate}`) ?? null
  }

  function upsertLocalEntry(entry: RoutineEntry) {
    setEntries((current) => {
      const exists = current.some((item) => item.id === entry.id || (item.taskId === entry.taskId && item.entryDate === entry.entryDate))
      return exists
        ? current.map((item) => item.id === entry.id || (item.taskId === entry.taskId && item.entryDate === entry.entryDate) ? entry : item)
        : [entry, ...current]
    })
  }

  async function setTaskValue(task: RoutineTask, value: number) {
    setBusy(true)
    try {
      const entry = await saveTaskEntry(supabase, task, selectedDate, value)
      upsertLocalEntry(entry)
      setError('')
    } catch (entryError) {
      setError(entryError instanceof Error ? entryError.message : 'Não foi possível atualizar a tarefa.')
    } finally {
      setBusy(false)
    }
  }

  function toggleCheck(task: RoutineTask) {
    const entry = getEntry(task.id)
    void setTaskValue(task, entry?.completed ? 0 : 1)
  }

  function addQuantity(task: RoutineTask, amount: number) {
    const entry = getEntry(task.id)
    void setTaskValue(task, (entry?.value ?? 0) + amount)
  }

  function addManualQuantity(task: RoutineTask) {
    const amount = Number((manualAmounts[task.id] ?? '').replace(',', '.'))
    if (!Number.isFinite(amount) || amount <= 0) return
    setManualAmounts((current) => ({ ...current, [task.id]: '' }))
    addQuantity(task, amount)
  }

  async function submitTask(input: TaskInput) {
    setBusy(true)
    try {
      if (modal && modal !== 'new') {
        await updateTask(supabase, modal.id, userId, input)
        setTasks((current) => current.map((task) => task.id === modal.id ? { ...task, ...input } : task))
      } else {
        const created = await createTask(supabase, familyId, userId, input)
        setTasks((current) => [...current, created])
      }
      setModal(null)
      setError('')
    } catch (taskError) {
      setError(taskError instanceof Error ? taskError.message : 'Não foi possível salvar a tarefa.')
    } finally {
      setBusy(false)
    }
  }

  async function removeTask(task: RoutineTask) {
    setBusy(true)
    try {
      await deleteTask(supabase, task.id, userId)
      setTasks((current) => current.filter((item) => item.id !== task.id))
      setEntries((current) => current.filter((entry) => entry.taskId !== task.id))
      setModal(null)
      setDeleteCandidate(null)
    } catch (taskError) {
      setError(taskError instanceof Error ? taskError.message : 'Não foi possível excluir a tarefa.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="tasks-shell">
      <header className="tasks-topbar">
        <div className="tasks-topbar-main">
          <Link className="finance-back" href="/hub" prefetch aria-label="Voltar ao início">‹</Link>
          <div className="tasks-heading">
            <h1>Tarefas</h1>
            <p>{formatLongDate(selectedDate)}</p>
          </div>
          <div className="tasks-tabs" role="tablist" aria-label="Visualização de tarefas">
            <button className={tab === 'today' ? 'active' : ''} onClick={() => setTab('today')}>Hoje</button>
            <button className={tab === 'all' ? 'active' : ''} onClick={() => setTab('all')}>Todas</button>
          </div>
        </div>
        <div className="tasks-actions">
          <div className="tasks-date-picker">
            <button onClick={() => setSelectedDate(previousDateKey(selectedDate))} aria-label="Dia anterior">‹</button>
            <strong>{selectedDate === todayKey ? 'Hoje' : formatShortDate(selectedDate)}</strong>
            <button onClick={() => setSelectedDate(nextDateKey(selectedDate))} aria-label="Próximo dia">›</button>
          </div>
          <button className="button button-primary" onClick={() => setModal('new')}>+ Tarefa</button>
        </div>
      </header>

      <section className="tasks-content">
        {error ? <div className="error-banner module-error" role="alert">{error}<button onClick={() => setError('')}>×</button></div> : null}

        <div className="tasks-day-status">
          <span>{completedToday} de {dueTasks.length} concluídas</span>
          <div className="progress-track"><span style={{ width: `${dueTasks.length ? Math.round((completedToday / dueTasks.length) * 100) : 0}%` }} /></div>
        </div>

        {tab === 'today' ? (
          <div className="tasks-list">
            {dueTasks.length === 0 ? <EmptyState title="Nada previsto" copy="Crie uma tarefa ou altere a frequência para ela aparecer aqui." /> : null}
            {dueTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                entry={getEntry(task.id)}
                streak={calculateTaskStreak(task, entries, selectedDate)}
                manualAmount={manualAmounts[task.id] ?? ''}
                busy={busy}
                onToggle={() => toggleCheck(task)}
                onAdd={(amount) => addQuantity(task, amount)}
                onReset={() => void setTaskValue(task, 0)}
                onManualChange={(value) => setManualAmounts((current) => ({ ...current, [task.id]: value }))}
                onManualAdd={() => addManualQuantity(task)}
              />
            ))}
          </div>
        ) : (
          <div className="tasks-all-grid">
            {activeTasks.length === 0 ? <EmptyState title="Nenhuma tarefa ativa" copy="Cadastre a primeira rotina para começar pequeno." /> : null}
            {activeTasks.map((task) => (
              <AllTaskCard
                key={task.id}
                task={task}
                streak={calculateTaskStreak(task, entries, selectedDate)}
                onEdit={() => setModal(task)}
              />
            ))}
          </div>
        )}
      </section>

      {modal ? (
        <TaskModal
          initial={modal === 'new' ? null : modal}
          busy={busy}
          todayKey={todayKey}
          onClose={() => setModal(null)}
          onSubmit={submitTask}
          onError={setError}
          onDelete={modal === 'new' ? undefined : () => setDeleteCandidate(modal)}
        />
      ) : null}
      {deleteCandidate ? (
        <DeleteTaskModal
          task={deleteCandidate}
          busy={busy}
          onClose={() => setDeleteCandidate(null)}
          onConfirm={() => void removeTask(deleteCandidate)}
        />
      ) : null}
    </main>
  )
}

function TaskCard({
  task,
  entry,
  streak,
  manualAmount,
  busy,
  onToggle,
  onAdd,
  onReset,
  onManualChange,
  onManualAdd,
}: {
  task: RoutineTask
  entry: RoutineEntry | null
  streak: number
  manualAmount: string
  busy: boolean
  onToggle: () => void
  onAdd: (amount: number) => void
  onReset: () => void
  onManualChange: (value: string) => void
  onManualAdd: () => void
}) {
  const value = entry?.value ?? 0
  const completed = entry?.completed ?? false
  const percent = task.goalType === 'check' ? (completed ? 100 : 0) : Math.min(100, Math.round((value / task.goalValue) * 100))
  return (
    <article className={`task-card ${task.goalType === 'quantity' ? 'quantity' : ''} ${completed ? 'done' : ''}`}>
      <div className="task-leading">
        {task.goalType === 'check' ? (
          <button className={`task-check-button ${completed ? 'checked' : ''}`} disabled={busy} onClick={onToggle} aria-label={completed ? 'Desfazer conclusão' : 'Concluir tarefa'}>
            {completed ? '✓' : ''}
          </button>
        ) : (
          <span className="task-icon">{task.emoji}</span>
        )}
      </div>
      <div className="task-card-body">
        <div className="task-card-main">
          <div className="task-title-row">
            {task.goalType === 'check' ? <span className="task-title-emoji">{task.emoji}</span> : null}
            <h2>{task.name}</h2>
            {streak > 0 ? <span>🔥 {streak}</span> : null}
          </div>
          {task.description ? <p>{task.description}</p> : null}
          <div className="task-progress-label">
            <span>{formatProgress(task, value)}</span>
            <span>{frequencyLabel(task)}</span>
          </div>
          <div className="progress-track task-progress"><span style={{ width: `${percent}%` }} /></div>
        </div>
        {task.goalType === 'quantity' ? (
          <div className="task-quantity-actions">
            <div>
              {task.quickValues.map((amount) => <button key={amount} disabled={busy} onClick={() => onAdd(amount)}>+{formatAmount(amount, task.goalUnit)}</button>)}
              <button disabled={busy || value === 0} onClick={onReset}>Zerar</button>
            </div>
            <label>
              <input value={manualAmount} onChange={(event) => onManualChange(event.target.value)} inputMode="decimal" placeholder="Valor" />
              <button disabled={busy} onClick={onManualAdd}>Adicionar</button>
            </label>
          </div>
        ) : null}
      </div>
    </article>
  )
}

function AllTaskCard({ task, streak, onEdit }: { task: RoutineTask; streak: number; onEdit: () => void }) {
  return (
    <button className="task-mini-card" onClick={onEdit}>
      <span>{task.emoji}</span>
      <strong>{task.name}</strong>
      <small>{frequencyLabel(task)} · {task.goalType === 'quantity' ? `${formatAmount(task.goalValue, task.goalUnit)} por vez` : 'concluir'}</small>
      <b>{streak > 0 ? `🔥 ${streak}` : 'Editar'}</b>
    </button>
  )
}

function TaskModal({
  initial,
  busy,
  todayKey,
  onClose,
  onSubmit,
  onError,
  onDelete,
}: {
  initial: RoutineTask | null
  busy: boolean
  todayKey: string
  onClose: () => void
  onSubmit: (input: TaskInput) => void
  onError: (message: string) => void
  onDelete?: () => void
}) {
  const [emoji, setEmoji] = useState(initial?.emoji ?? '✓')
  const [name, setName] = useState(initial?.name ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [goalType, setGoalType] = useState<TaskGoalType>(initial?.goalType ?? 'check')
  const [goalValue, setGoalValue] = useState(String(initial?.goalValue ?? 1).replace('.', ','))
  const [goalUnit, setGoalUnit] = useState(initial?.goalUnit ?? '')
  const [quickValues, setQuickValues] = useState(() => {
    const values = initial?.quickValues.length ? initial.quickValues : [250, 500, 1000]
    return values.map((value) => String(value).replace('.', ','))
  })
  const [frequency, setFrequency] = useState<TaskFrequency>(initial?.frequency ?? 'daily')
  const [weekdays, setWeekdays] = useState<number[]>(initial?.weekdays ?? [new Date(`${todayKey}T12:00:00`).getDay()])
  const [startDate, setStartDate] = useState(initial?.startDate ?? todayKey)
  const [notificationEnabled, setNotificationEnabled] = useState(initial?.notificationEnabled ?? false)
  const [notificationTime, setNotificationTime] = useState(initial?.notificationTime?.slice(0, 5) ?? '12:00')
  const [enablingNotification, setEnablingNotification] = useState(false)

  function submit(event: FormEvent) {
    event.preventDefault()
    const parsedGoal = Number(goalValue.replace(',', '.'))
    const parsedQuickValues = quickValues.map((value) => Number(value.replace(',', '.'))).filter((value) => Number.isFinite(value) && value > 0)
    if (!name.trim() || !Number.isFinite(parsedGoal) || parsedGoal <= 0) return
    onSubmit({
      emoji,
      name,
      description: description || null,
      goalType,
      goalValue: goalType === 'check' ? 1 : parsedGoal,
      goalUnit: goalType === 'check' ? null : goalUnit || null,
      quickValues: goalType === 'quantity' ? parsedQuickValues : [],
      frequency,
      weekdays: frequency === 'weekly' ? weekdays : null,
      startDate,
      notificationEnabled,
      notificationTime: notificationEnabled ? notificationTime : null,
    })
  }

  function toggleWeekday(value: number) {
    setWeekdays((current) => {
      if (current.includes(value)) return current.length === 1 ? current : current.filter((item) => item !== value)
      return [...current, value].sort((a, b) => a - b)
    })
  }

  async function toggleNotification() {
    if (notificationEnabled) {
      setNotificationEnabled(false)
      return
    }
    setNotificationEnabled(true)
    setEnablingNotification(true)
    try {
      await subscribeCurrentDevice()
      if (!notificationTime) setNotificationTime('12:00')
    } catch (error) {
      setNotificationEnabled(false)
      onError(error instanceof Error ? error.message : 'Não foi possível ativar as notificações.')
    } finally {
      setEnablingNotification(false)
    }
  }

  return (
    <div className="modal-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <section className="modal-card task-modal" role="dialog" aria-modal="true" aria-label={initial ? 'Editar tarefa' : 'Nova tarefa'}>
        <header>
          <h2>{initial ? 'EDITAR TAREFA' : 'NOVA TAREFA'}</h2>
          <button onClick={onClose} aria-label="Fechar">×</button>
        </header>
        <form onSubmit={submit}>
          <label className="field-label">ÍCONE</label>
          <div className="emoji-grid">{EMOJIS.map((option) => <button type="button" className={emoji === option ? 'selected' : ''} key={option} onClick={() => setEmoji(option)}>{option}</button>)}</div>
          <label className="field-label" htmlFor="task-name">NOME</label>
          <input id="task-name" className="field" value={name} onChange={(event) => setName(event.target.value)} placeholder="Ex: Beber água" required maxLength={100} />
          <label className="field-label" htmlFor="task-description">DESCRIÇÃO OPCIONAL</label>
          <input id="task-description" className="field" value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Ex: Meta do dia ou observação rápida" maxLength={180} />

          <label className="field-label">TIPO</label>
          <div className="task-segmented">
            <button type="button" className={goalType === 'check' ? 'active' : ''} onClick={() => setGoalType('check')}><span>✓</span> Concluir</button>
            <button type="button" className={goalType === 'quantity' ? 'active' : ''} onClick={() => setGoalType('quantity')}><span>#</span> Quantidade</button>
          </div>

          {goalType === 'quantity' ? (
            <>
              <div className="field-row">
                <div><label className="field-label" htmlFor="task-goal">META</label><input id="task-goal" className="field" value={goalValue} onChange={(event) => setGoalValue(event.target.value)} inputMode="decimal" placeholder="3000" /></div>
                <div><label className="field-label" htmlFor="task-unit">UNIDADE</label><input id="task-unit" className="field" value={goalUnit} onChange={(event) => setGoalUnit(event.target.value)} placeholder="ml, min, g" maxLength={12} /></div>
              </div>
              <label className="field-label">ATALHOS RÁPIDOS</label>
              <div className="task-quick-fields">
                {[0, 1, 2].map((index) => <input key={index} className="field" value={quickValues[index] ?? ''} onChange={(event) => setQuickValues((current) => current.map((value, currentIndex) => currentIndex === index ? event.target.value : value))} inputMode="decimal" placeholder="250" />)}
              </div>
            </>
          ) : null}

          <div className="field-row">
            <div>
              <label className="field-label" htmlFor="task-frequency">FREQUÊNCIA</label>
              <select id="task-frequency" className="field" value={frequency} onChange={(event) => setFrequency(event.target.value as TaskFrequency)}>
                <option value="daily">Diária</option>
                <option value="weekly">Semanal / dias específicos</option>
                <option value="biweekly">Quinzenal</option>
                <option value="monthly">Mensal</option>
              </select>
            </div>
            <div>
              <label className="field-label" htmlFor="task-start">INÍCIO</label>
              <input id="task-start" className="field" type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
            </div>
          </div>

          {frequency === 'weekly' ? (
            <>
              <label className="field-label">DIAS ESPECÍFICOS</label>
              <div className="task-weekdays" aria-label="Dias da semana">
                {WEEKDAYS.map((day) => <button type="button" className={weekdays.includes(day.value) ? 'active' : ''} key={day.value} onClick={() => toggleWeekday(day.value)}>{day.label}</button>)}
              </div>
            </>
          ) : null}

          <div className={`task-notification ${notificationEnabled ? 'enabled' : ''}`}>
            <div>
              <strong>Lembrete no celular</strong>
              <small>{enablingNotification ? 'Ativando neste aparelho…' : notificationEnabled ? 'Lembrete ativo para esta tarefa' : 'Receba um aviso mesmo com o app fechado'}</small>
            </div>
            <button
              type="button"
              className="task-notification-switch"
              role="switch"
              aria-checked={notificationEnabled}
              aria-label="Ativar lembrete no celular"
              disabled={enablingNotification}
              onClick={() => void toggleNotification()}
            ><span /></button>
          </div>
          {notificationEnabled ? (
            <div className="task-reminder-time">
              <label htmlFor="task-notification-time">
                <strong>Horário do lembrete</strong>
                <small>Use o formato de 24 horas</small>
              </label>
              <input id="task-notification-time" type="time" lang="pt-BR" value={notificationTime} onChange={(event) => setNotificationTime(event.target.value)} required />
            </div>
          ) : null}

          <div className="modal-actions">
            {onDelete ? <button type="button" className="button button-danger" onClick={onDelete} disabled={busy}>Excluir</button> : null}
            <button type="button" className="button button-ghost" onClick={onClose}>Cancelar</button>
            <button className="button button-primary" disabled={busy || enablingNotification}>{busy ? 'Salvando...' : enablingNotification ? 'Ativando...' : 'Salvar'}</button>
          </div>
        </form>
      </section>
    </div>
  )
}

function DeleteTaskModal({
  task,
  busy,
  onClose,
  onConfirm,
}: {
  task: RoutineTask
  busy: boolean
  onClose: () => void
  onConfirm: () => void
}) {
  return (
    <div className="modal-overlay task-delete-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <section className="modal-card task-delete-modal" role="dialog" aria-modal="true" aria-label="Confirmar exclusão de tarefa">
        <header>
          <h2>EXCLUIR TAREFA</h2>
          <button onClick={onClose} aria-label="Fechar">×</button>
        </header>
        <div className="confirm-copy">
          <p>A tarefa <strong>{task.emoji} {task.name}</strong> será excluída.</p>
          <p>O histórico dessa tarefa também será removido.</p>
        </div>
        <div className="modal-actions">
          <button type="button" className="button button-ghost" onClick={onClose} disabled={busy}>Cancelar</button>
          <button type="button" className="button button-danger" onClick={onConfirm} disabled={busy}>{busy ? 'Excluindo...' : 'Excluir tarefa'}</button>
        </div>
      </section>
    </div>
  )
}

function EmptyState({ title, copy }: { title: string; copy: string }) {
  return <div className="empty-state"><span>📋</span><h2>{title}</h2><p>{copy}</p></div>
}

function formatProgress(task: RoutineTask, value: number) {
  if (task.goalType === 'check') return value >= 1 ? '1/1 concluído' : '0/1 pendente'
  return `${formatAmount(value, task.goalUnit)} / ${formatAmount(task.goalValue, task.goalUnit)}`
}

function formatAmount(value: number, unit: string | null) {
  const formatted = Number.isInteger(value) ? String(value) : value.toLocaleString('pt-BR', { maximumFractionDigits: 2 })
  return unit ? `${formatted} ${unit}` : formatted
}

function frequencyLabel(task: RoutineTask) {
  if (task.frequency === 'daily') return 'Diária'
  if (task.frequency === 'weekly') return `Semanal · ${(task.weekdays ?? []).map((day) => WEEKDAYS.find((item) => item.value === day)?.label).filter(Boolean).join(', ')}`
  if (task.frequency === 'biweekly') return 'Quinzenal'
  return 'Mensal'
}

function formatLongDate(value: string) {
  return new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' }).format(new Date(`${value}T12:00:00`))
}

function formatShortDate(value: string) {
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit' }).format(new Date(`${value}T12:00:00`))
}

'use client'

import { useEffect, useMemo, useState, type FormEvent, type MouseEvent } from 'react'
import Link from 'next/link'
import { Pencil, SquareArrowOutUpRight, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import {
  createShoppingItem,
  createShoppingList,
  deleteShoppingItem,
  finishShoppingList,
  getShoppingLists,
  reopenShoppingList,
  setShoppingItemChecked,
  updateShoppingItem,
  type ItemInput,
  updateShoppingList,
  type ListInput,
  type ShoppingItem,
  type ShoppingList,
} from '@/lib/shopping'

type View = 'lists' | 'detail' | 'archive'
type Modal = 'list' | 'item' | 'reopen' | 'finish' | null

const EMOJIS = ['🛒', '🐕', '💊', '🏠', '👶', '🥩', '🧹', '🍕', '📦', '🎁', '🌿', '⚡', '🔧', '🐾']
const collator = new Intl.Collator('pt-BR', { sensitivity: 'base' })

function sortItems(items: ShoppingItem[]) {
  return [...items].sort((a, b) => {
    if (a.checked !== b.checked) return Number(a.checked) - Number(b.checked)
    return collator.compare(a.name, b.name)
  })
}

function sortLists(lists: ShoppingList[]) {
  return [...lists].sort((a, b) => {
    if (!a.scheduledDate && !b.scheduledDate) return collator.compare(a.name, b.name)
    if (!a.scheduledDate) return 1
    if (!b.scheduledDate) return -1
    return a.scheduledDate.localeCompare(b.scheduledDate)
  })
}

function formatDate(value: string | null) {
  if (!value) return 'SEM DATA'
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit' }).format(
    new Date(`${value}T12:00:00`),
  )
}

function formatArchivedAt(value: string | null) {
  if (!value) return 'DATA NÃO INFORMADA'
  return new Intl.DateTimeFormat('pt-BR').format(new Date(value))
}

function formatItemPrice(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

function progress(list: ShoppingList) {
  const checked = list.items.filter((item) => item.checked).length
  const total = list.items.length
  return { checked, total, percent: total ? Math.round((checked / total) * 100) : 0 }
}

export default function ShoppingModule({
  initialLists,
  initialError = '',
  responsibleOptions = ['Família'],
  familyId,
  demo = false,
}: {
  initialLists: ShoppingList[]
  initialError?: string
  responsibleOptions?: string[]
  familyId?: string
  demo?: boolean
}) {
  const supabase = useMemo(() => createClient(), [])
  const [lists, setLists] = useState<ShoppingList[]>(initialLists)
  const [history, setHistory] = useState<View[]>(['lists'])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [modal, setModal] = useState<Modal>(null)
  const [editingItem, setEditingItem] = useState<ShoppingItem | null>(null)
  const [marketMode, setMarketMode] = useState(false)
  const [editing, setEditing] = useState(false)
  const [loading] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(initialError)
  const [syncStatus, setSyncStatus] = useState<'connecting' | 'online' | 'offline'>('connecting')

  const currentView = history.at(-1) ?? 'lists'
  const selected = lists.find((list) => list.id === selectedId) ?? null
  const activeLists = useMemo(
    () => sortLists(lists.filter((list) => list.status === 'active')),
    [lists],
  )
  const archivedLists = useMemo(
    () => [...lists.filter((list) => list.status === 'archived')].sort((a, b) =>
      (b.archivedAt ?? '').localeCompare(a.archivedAt ?? ''),
    ),
    [lists],
  )

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0 })
    document.querySelector<HTMLElement>('.internal-content')?.scrollTo({ top: 0, left: 0 })
  }, [])

  useEffect(() => {
    if (demo || !familyId) return
    let active = true
    let refreshTimer: ReturnType<typeof setTimeout> | null = null

    const refresh = () => {
      if (refreshTimer) clearTimeout(refreshTimer)
      refreshTimer = setTimeout(async () => {
        try {
          const refreshed = await getShoppingLists(supabase)
          if (active) setLists(refreshed)
        } catch {
          if (active) setSyncStatus('offline')
        }
      }, 180)
    }

    const channel = supabase
      .channel(`shopping-family-${familyId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'shopping_lists', filter: `family_id=eq.${familyId}` }, refresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'shopping_items', filter: `family_id=eq.${familyId}` }, refresh)
      .subscribe((status) => {
        if (!active) return
        if (status === 'SUBSCRIBED') setSyncStatus('online')
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') setSyncStatus('offline')
      })

    const refreshWhenVisible = () => {
      if (document.visibilityState === 'visible') refresh()
    }
    document.addEventListener('visibilitychange', refreshWhenVisible)
    window.addEventListener('focus', refresh)
    const fallbackRefresh = window.setInterval(refresh, 20_000)

    return () => {
      active = false
      if (refreshTimer) clearTimeout(refreshTimer)
      window.clearInterval(fallbackRefresh)
      document.removeEventListener('visibilitychange', refreshWhenVisible)
      window.removeEventListener('focus', refresh)
      void supabase.removeChannel(channel)
    }
  }, [demo, familyId, supabase])

  function openView(view: View) {
    setHistory((previous) => [...previous, view])
    window.requestAnimationFrame(() => {
      window.scrollTo({ top: 0, left: 0 })
      document.querySelector<HTMLElement>('.internal-content')?.scrollTo({ top: 0, left: 0 })
    })
  }

  function goBack() {
    setHistory((previous) => previous.slice(0, -1))
  }

  function openDetail(list: ShoppingList) {
    setSelectedId(list.id)
    openView('detail')
  }

  function updateLocalList(listId: string, update: (list: ShoppingList) => ShoppingList) {
    setLists((previous) => previous.map((list) => (list.id === listId ? update(list) : list)))
  }

  async function toggleItem(item: ShoppingItem) {
    const nextChecked = !item.checked
    updateLocalList(item.listId, (list) => ({
      ...list,
      items: list.items.map((current) =>
        current.id === item.id
          ? { ...current, checked: nextChecked, checkedAt: nextChecked ? new Date().toISOString() : null }
          : current,
      ),
    }))
    if (demo) return
    try {
      await setShoppingItemChecked(supabase, item.id, nextChecked)
    } catch {
      updateLocalList(item.listId, (list) => ({
        ...list,
        items: list.items.map((current) => (current.id === item.id ? item : current)),
      }))
      setError('Não foi possível atualizar o item.')
    }
  }

  async function removeItem(event: MouseEvent, item: ShoppingItem) {
    event.stopPropagation()
    const snapshot = lists
    setLists((previous) => previous.map((list) => ({
      ...list,
      items: list.items.filter((current) => current.id !== item.id),
    })))
    if (demo) return
    try {
      await deleteShoppingItem(supabase, item.id)
    } catch {
      setLists(snapshot)
      setError('Não foi possível excluir o item.')
    }
  }

  function openNewItem(list: ShoppingList) {
    setSelectedId(list.id)
    setEditingItem(null)
    setModal('item')
  }

  function openEditItem(event: MouseEvent, item: ShoppingItem) {
    event.stopPropagation()
    setSelectedId(item.listId)
    setEditingItem(item)
    setModal('item')
  }

  async function submitItem(input: ItemInput) {
    if (!selected || !input.name.trim()) return
    const cleanInput = { ...input, name: input.name.trim() }
    if (demo) {
      if (editingItem) {
        updateLocalList(editingItem.listId, (list) => ({
          ...list,
          items: list.items.map((item) => item.id === editingItem.id ? { ...item, ...cleanInput } : item),
        }))
      } else {
        const item: ShoppingItem = {
          id: `demo-${crypto.randomUUID()}`, listId: selected.id, familyId: 'demo', ...cleanInput,
          checked: false, checkedAt: null, createdAt: new Date().toISOString(),
        }
        updateLocalList(selected.id, (list) => ({ ...list, items: [...list.items, item] }))
      }
      setModal(null)
      setEditingItem(null)
      return
    }
    setBusy(true)
    try {
      if (editingItem) {
        await updateShoppingItem(supabase, editingItem.id, cleanInput)
        updateLocalList(editingItem.listId, (list) => ({
          ...list,
          items: list.items.map((item) => item.id === editingItem.id ? { ...item, ...cleanInput } : item),
        }))
      } else {
        const item = await createShoppingItem(supabase, selected, cleanInput)
        updateLocalList(selected.id, (list) => ({ ...list, items: [...list.items, item] }))
      }
      setModal(null)
      setEditingItem(null)
    } catch (itemError) {
      setError(itemError instanceof Error ? itemError.message : 'Não foi possível salvar o item.')
    } finally {
      setBusy(false)
    }
  }

  async function submitList(input: ListInput) {
    if (demo) {
      if (editing && selected) {
        updateLocalList(selected.id, (list) => ({ ...list, ...input }))
      } else {
        setLists((previous) => [...previous, {
          id: `demo-${crypto.randomUUID()}`, familyId: 'demo', ...input,
          status: 'active', createdAt: new Date().toISOString(), archivedAt: null, items: [],
        }])
      }
      setModal(null)
      setEditing(false)
      return
    }
    setBusy(true)
    try {
      if (editing && selected) {
        await updateShoppingList(supabase, selected.id, input)
        updateLocalList(selected.id, (list) => ({ ...list, ...input }))
      } else {
        const created = await createShoppingList(supabase, input)
        setLists((previous) => [...previous, created])
      }
      setModal(null)
      setEditing(false)
    } catch (listError) {
      setError(listError instanceof Error ? listError.message : 'Não foi possível salvar a lista.')
    } finally {
      setBusy(false)
    }
  }

  async function finishSelected(movePendingItems: boolean) {
    if (!selected) return
    if (demo) {
      const pending = selected.items.filter((item) => !item.checked)
      const nextDate = new Date()
      nextDate.setDate(nextDate.getDate() + 7)
      const scheduledDate = nextDate.toISOString().slice(0, 10)
      setLists((previous) => {
        const archived = previous.map((list) => list.id === selected.id
          ? { ...list, status: 'archived' as const, archivedAt: new Date().toISOString(), items: movePendingItems ? list.items.filter((item) => item.checked) : list.items }
          : list)
        if (!movePendingItems || pending.length === 0) return archived
        const newId = `demo-${crypto.randomUUID()}`
        return [...archived, {
          ...selected, id: newId, name: `${selected.name} - Pendentes`, scheduledDate,
          status: 'active' as const, createdAt: new Date().toISOString(), archivedAt: null,
          items: pending.map((item) => ({ ...item, id: `demo-${crypto.randomUUID()}`, listId: newId, checked: false, checkedAt: null })),
        }]
      })
      setModal(null)
      setMarketMode(false)
      setHistory(['lists'])
      setSelectedId(null)
      return
    }
    setBusy(true)
    try {
      setLists(await finishShoppingList(supabase, selected.id, movePendingItems))
      setModal(null)
      setMarketMode(false)
      setHistory(['lists'])
      setSelectedId(null)
    } catch {
      setError('Não foi possível finalizar a lista.')
    } finally {
      setBusy(false)
    }
  }

  async function reopenSelected() {
    if (!selected) return
    if (demo) {
      updateLocalList(selected.id, (list) => ({
        ...list, status: 'active', archivedAt: null,
        items: list.items.map((item) => ({ ...item, checked: false, checkedAt: null })),
      }))
      setModal(null)
      setHistory(['lists'])
      setSelectedId(null)
      return
    }
    setBusy(true)
    try {
      await reopenShoppingList(supabase, selected)
      updateLocalList(selected.id, (list) => ({
        ...list,
        status: 'active',
        archivedAt: null,
        items: list.items.map((item) => ({ ...item, checked: false, checkedAt: null })),
      }))
      setModal(null)
      setHistory(['lists'])
      setSelectedId(null)
    } catch {
      setError('Não foi possível reabrir a lista.')
    } finally {
      setBusy(false)
    }
  }

  const title = currentView === 'archive'
    ? 'ARQUIVO'
    : currentView === 'detail' && selected
      ? `${selected.emoji} ${selected.name.toUpperCase()}`
      : 'LISTA DE COMPRAS'
  const subtitle = currentView === 'archive'
    ? `${archivedLists.length} listas arquivadas`
    : currentView === 'detail' && selected
      ? `${selected.items.length} itens`
      : `${activeLists.length} listas ativas`

  return (
    <main className="shopping-shell">
      <header className="topbar">
        <div className="topbar-left">
          {history.length > 1 ? (
            <button className="icon-button" onClick={goBack} aria-label="Voltar">‹</button>
          ) : (
            <Link className="icon-button" href="/hub" prefetch aria-label="Voltar ao início">‹</Link>
          )}
          <div>
            <h1 className="topbar-title">{title}</h1>
            <p className="topbar-subtitle">{subtitle}</p>
          </div>
        </div>
        <div className="topbar-actions">
          {currentView === 'lists' ? (
            <>
              <button className="button button-ghost" onClick={() => openView('archive')}>Arquivo</button>
              <button className="button button-primary" onClick={() => { setEditing(false); setModal('list') }}>+ Nova Lista</button>
            </>
          ) : null}
          {currentView === 'detail' && selected ? (
            <>
              <button className="button button-ghost" onClick={() => { setEditing(true); setModal('list') }}>Editar</button>
              <button className="button button-primary" onClick={() => setMarketMode(true)}>🛒 Modo Mercado</button>
            </>
          ) : null}
        </div>
      </header>

      <section className="shopping-content">
        {!demo ? <div className={`shopping-sync ${syncStatus}`}><span />{syncStatus === 'online' ? 'Sincronização ativa' : syncStatus === 'offline' ? 'Reconectando...' : 'Conectando...'}</div> : null}
        {demo ? <div className="demo-banner">MODO DE DEMONSTRAÇÃO LOCAL · alterações não serão salvas</div> : null}
        {error ? <div className="error-banner module-error" role="alert">{error}<button onClick={() => setError('')}>×</button></div> : null}
        {loading ? <EmptyState title="CARREGANDO LISTAS" copy="Buscando os dados da família..." /> : null}

        {!loading && currentView === 'lists' ? (
          <ListsView
            lists={activeLists}
            onOpen={openDetail}
            onToggle={toggleItem}
            onDelete={removeItem}
            onEdit={openEditItem}
            onAdd={openNewItem}
            onNew={() => { setEditing(false); setModal('list') }}
          />
        ) : null}

        {!loading && currentView === 'detail' && selected ? (
          <DetailView
            list={selected}
            busy={busy}
            onToggle={toggleItem}
            onDelete={removeItem}
            onEdit={openEditItem}
            onAdd={() => { setEditingItem(null); setModal('item') }}
            onFinish={() => setModal('finish')}
          />
        ) : null}

        {!loading && currentView === 'archive' ? (
          <ArchiveView
            lists={archivedLists}
            onReopen={(list) => { setSelectedId(list.id); setModal('reopen') }}
          />
        ) : null}
      </section>

      {modal === 'list' ? (
        <ListModal
          initial={editing ? selected : null}
          responsibleOptions={responsibleOptions}
          busy={busy}
          onClose={() => { setModal(null); setEditing(false) }}
          onSubmit={submitList}
        />
      ) : null}
      {modal === 'item' ? <ItemModal initial={editingItem} busy={busy} onClose={() => { setModal(null); setEditingItem(null) }} onSubmit={submitItem} /> : null}
      {modal === 'reopen' && selected ? (
        <ConfirmModal
          title="REABRIR LISTA"
          busy={busy}
          onClose={() => setModal(null)}
          onConfirm={reopenSelected}
        >
          <p>A lista <strong>{selected.emoji} {selected.name}</strong> voltará para as listas ativas.</p>
          <p>Todos os itens serão desmarcados para uma nova compra.</p>
        </ConfirmModal>
      ) : null}
      {modal === 'finish' && selected ? (
        <FinishListModal list={selected} busy={busy} onClose={() => setModal(null)} onFinish={finishSelected} />
      ) : null}
      {marketMode && selected ? (
        <MarketMode
          list={selected}
          onExit={() => setMarketMode(false)}
          onToggle={toggleItem}
          onDelete={removeItem}
          onEdit={openEditItem}
          onAdd={() => { setEditingItem(null); setModal('item') }}
          onFinish={() => setModal('finish')}
        />
      ) : null}
    </main>
  )
}

function ListsView({ lists, onOpen, onToggle, onDelete, onEdit, onAdd, onNew }: {
  lists: ShoppingList[]
  onOpen: (list: ShoppingList) => void
  onToggle: (item: ShoppingItem) => void
  onDelete: (event: MouseEvent, item: ShoppingItem) => void
  onEdit: (event: MouseEvent, item: ShoppingItem) => void
  onAdd: (list: ShoppingList) => void
  onNew: () => void
}) {
  return (
    <>
      <div className="shopping-grid">
        {lists.length === 0 ? <EmptyState title="NENHUMA LISTA ATIVA" copy="Crie a primeira lista para começar." /> : null}
        {lists.map((list) => (
          <ShoppingCard key={list.id} list={list} onOpen={onOpen} onToggle={onToggle} onDelete={onDelete} onEdit={onEdit} onAdd={onAdd} />
        ))}
        <button className="new-list-card" onClick={onNew}><span>+</span> Nova Lista</button>
      </div>
    </>
  )
}

function ShoppingCard({ list, onOpen, onToggle, onDelete, onEdit, onAdd }: {
  list: ShoppingList
  onOpen: (list: ShoppingList) => void
  onToggle: (item: ShoppingItem) => void
  onDelete: (event: MouseEvent, item: ShoppingItem) => void
  onEdit: (event: MouseEvent, item: ShoppingItem) => void
  onAdd: (list: ShoppingList) => void
}) {
  const stats = progress(list)
  return (
    <article className="shopping-card">
      <button className="shopping-card-header" onClick={() => onOpen(list)}>
        <div className="shopping-card-title-row">
          <strong>{list.emoji} {list.name}</strong><span>{formatDate(list.scheduledDate)}</span>
        </div>
        <p>{list.responsible.toUpperCase()} {list.scheduledDate ? `· ${formatDate(list.scheduledDate)}` : ''}</p>
        <div className="progress-track"><span style={{ width: `${stats.percent}%` }} /></div>
        <small>{stats.checked} DE {stats.total} COMPRADOS</small>
      </button>
      <div className="check-list">
        {sortItems(list.items).map((item) => <CheckRow key={item.id} item={item} onToggle={onToggle} onDelete={onDelete} onEdit={onEdit} />)}
      </div>
      <button className="add-item-inline" onClick={() => onAdd(list)}>+ item</button>
    </article>
  )
}

function CheckRow({ item, onToggle, onDelete, onEdit }: {
  item: ShoppingItem
  onToggle: (item: ShoppingItem) => void
  onDelete: (event: MouseEvent, item: ShoppingItem) => void
  onEdit: (event: MouseEvent, item: ShoppingItem) => void
}) {
  return (
    <div className={`check-row ${item.checked ? 'done' : ''}`} role="checkbox" aria-checked={item.checked} tabIndex={0}
      onClick={() => onToggle(item)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') onToggle(item) }}>
      <span className="check-box">{item.checked ? '✓' : ''}</span>
      <span className="check-text"><span className="check-name">{item.name}</span>{item.estimatedPrice !== null ? <span className="check-price">{formatItemPrice(item.estimatedPrice)}</span> : null}</span>
      <button className="item-action-icon edit-item" onClick={(event) => onEdit(event, item)} aria-label={`Editar ${item.name}`} title="Editar"><Pencil aria-hidden /></button>
      {item.productUrl ? <ProductLink url={item.productUrl} name={item.name} /> : null}
      <button className="item-action-icon delete-item" onClick={(event) => onDelete(event, item)} aria-label={`Excluir ${item.name}`} title="Excluir"><Trash2 aria-hidden /></button>
    </div>
  )
}

function DetailView({ list, busy, onToggle, onDelete, onEdit, onAdd, onFinish }: {
  list: ShoppingList
  busy: boolean
  onToggle: (item: ShoppingItem) => void
  onDelete: (event: MouseEvent, item: ShoppingItem) => void
  onEdit: (event: MouseEvent, item: ShoppingItem) => void
  onAdd: () => void
  onFinish: () => void
}) {
  const stats = progress(list)
  return (
    <div className="detail-view">
      <div className="detail-heading"><div><h2>{list.emoji} {list.name}</h2><p>{stats.total} ITENS · {list.responsible.toUpperCase()}</p></div></div>
      <div className="surface-card progress-card">
        <div><span>{stats.checked} de {stats.total} comprados</span><span>{stats.percent}%</span></div>
        <div className="progress-track"><span style={{ width: `${stats.percent}%` }} /></div>
      </div>
      <button className="button button-success finish-list-button" onClick={onFinish} disabled={busy}>✓ Finalizar lista</button>
      <div className="surface-card detail-items">
        <div className="section-heading"><h3>ITENS</h3><button className="button button-ghost" onClick={onAdd}>+ Adicionar item</button></div>
        {stats.total === 0 ? <p className="muted-copy">A lista ainda não tem itens.</p> : null}
        <div className="check-list">{sortItems(list.items).map((item) => <CheckRow key={item.id} item={item} onToggle={onToggle} onDelete={onDelete} onEdit={onEdit} />)}</div>
        {stats.total > 0 && stats.checked === stats.total ? (
          <div className="archive-ready"><div><strong>Todos os itens comprados!</strong><p>Esta lista já pode ser finalizada.</p></div><button className="button button-success" onClick={onFinish} disabled={busy}>Finalizar lista</button></div>
        ) : null}
      </div>
    </div>
  )
}

function ArchiveView({ lists, onReopen }: { lists: ShoppingList[]; onReopen: (list: ShoppingList) => void }) {
  const [expanded, setExpanded] = useState<string | null>(null)
  return (
    <div className="archive-view">
      <div className="section-intro"><h2>LISTAS ARQUIVADAS</h2><p>Ordenadas pela mais recente</p></div>
      {lists.length === 0 ? <EmptyState title="ARQUIVO VAZIO" copy="Listas concluídas aparecerão aqui." /> : null}
      {lists.map((list) => (
        <article className="archive-card" key={list.id}>
          <div className="archive-card-main"><div><strong>{list.emoji} {list.name}</strong><p>ARQUIVADO EM {formatArchivedAt(list.archivedAt)} · {list.items.length} ITENS · {list.responsible.toUpperCase()}</p></div>
            <div><button className="button button-ghost" onClick={() => setExpanded(expanded === list.id ? null : list.id)}>{expanded === list.id ? 'Fechar' : 'Ver itens'}</button><button className="button button-primary" onClick={() => onReopen(list)}>↶ Reabrir</button></div>
          </div>
          {expanded === list.id ? <div className="archive-items">{[...list.items].sort((a, b) => collator.compare(a.name, b.name)).map((item) => <span key={item.id}>{item.name}{item.estimatedPrice !== null ? <b>{formatItemPrice(item.estimatedPrice)}</b> : null}{item.productUrl ? <ProductLink url={item.productUrl} name={item.name} /> : null}</span>)}</div> : null}
        </article>
      ))}
    </div>
  )
}

function MarketMode({ list, onExit, onToggle, onDelete, onEdit, onAdd, onFinish }: {
  list: ShoppingList
  onExit: () => void
  onToggle: (item: ShoppingItem) => void
  onDelete: (event: MouseEvent, item: ShoppingItem) => void
  onEdit: (event: MouseEvent, item: ShoppingItem) => void
  onAdd: () => void
  onFinish: () => void
}) {
  const remaining = list.items.filter((item) => !item.checked).length
  return (
    <div className="market-mode">
      <button className="market-close-mobile" type="button" onClick={onExit} aria-label="Sair do Modo Mercado">×</button>
      <header><div><h2>{list.emoji} {list.name.toUpperCase()}</h2><p>{remaining} itens restantes</p></div><div className="market-actions"><button className="button button-ghost" onClick={onAdd}>+ Item</button><button className="button button-success" onClick={onFinish}>✓ Finalizar</button><button className="button button-danger market-exit-desktop" onClick={onExit}>× Sair</button></div></header>
      <div className="market-list">{sortItems(list.items).map((item) => (
        <div className={`market-item ${item.checked ? 'done' : ''}`} key={item.id} onClick={() => onToggle(item)}>
          <span className="market-check">{item.checked ? '✓' : ''}</span><strong>{item.name}{item.estimatedPrice !== null ? <small>{formatItemPrice(item.estimatedPrice)}</small> : null}</strong><button className="item-action-icon market-edit" onClick={(event) => onEdit(event, item)} aria-label={`Editar ${item.name}`} title="Editar"><Pencil aria-hidden /></button>{item.productUrl ? <ProductLink url={item.productUrl} name={item.name} /> : null}<button className="item-action-icon market-delete" onClick={(event) => onDelete(event, item)} aria-label={`Excluir ${item.name}`} title="Excluir"><Trash2 aria-hidden /></button>
        </div>
      ))}</div>
    </div>
  )
}

function ListModal({ initial, responsibleOptions, busy, onClose, onSubmit }: {
  initial: ShoppingList | null
  responsibleOptions: string[]
  busy: boolean
  onClose: () => void
  onSubmit: (input: ListInput) => void
}) {
  const [emoji, setEmoji] = useState(initial?.emoji ?? '🛒')
  const [name, setName] = useState(initial?.name ?? '')
  const [date, setDate] = useState(initial?.scheduledDate ?? '')
  const initialResponsible = responsibleOptions.includes(initial?.responsible ?? '')
    ? initial!.responsible
    : responsibleOptions[0] ?? 'Família'
  const [responsible, setResponsible] = useState(initialResponsible)
  function submit(event: FormEvent) { event.preventDefault(); if (name.trim()) onSubmit({ emoji, name, scheduledDate: date || null, responsible }) }
  return (
    <ModalShell title={initial ? 'EDITAR LISTA' : 'NOVA LISTA'} onClose={onClose}>
      <form onSubmit={submit}>
        <label className="field-label">ÍCONE</label><div className="emoji-grid">{EMOJIS.map((option) => <button type="button" className={emoji === option ? 'selected' : ''} key={option} onClick={() => setEmoji(option)}>{option}</button>)}</div>
        <label className="field-label" htmlFor="list-name">NOME DA LISTA</label><input id="list-name" className="field" value={name} onChange={(event) => setName(event.target.value)} placeholder="Ex: Mercado da Semana" required maxLength={100} />
        <div className="field-row"><div><label className="field-label" htmlFor="list-date">DATA PREVISTA</label><input id="list-date" className="field" type="date" value={date} onChange={(event) => setDate(event.target.value)} /></div><div><label className="field-label" htmlFor="list-owner">RESPONSÁVEL</label><select id="list-owner" className="field" value={responsible} onChange={(event) => setResponsible(event.target.value)}>{responsibleOptions.map((option) => <option key={option}>{option}</option>)}</select></div></div>
        <div className="modal-actions"><button type="button" className="button button-ghost" onClick={onClose}>Cancelar</button><button className="button button-primary" disabled={busy}>{busy ? 'Salvando...' : initial ? 'Salvar' : 'Criar Lista'}</button></div>
      </form>
    </ModalShell>
  )
}

function ItemModal({ initial, busy, onClose, onSubmit }: { initial: ShoppingItem | null; busy: boolean; onClose: () => void; onSubmit: (input: ItemInput) => void }) {
  const [name, setName] = useState(initial?.name ?? '')
  const [price, setPrice] = useState(initial?.estimatedPrice === null || initial?.estimatedPrice === undefined ? '' : String(initial.estimatedPrice).replace('.', ','))
  const [productUrl, setProductUrl] = useState(initial?.productUrl ?? '')
  function submit(event: FormEvent) {
    event.preventDefault()
    const normalizedPrice = price.trim().replace(',', '.')
    const estimatedPrice = normalizedPrice ? Number(normalizedPrice) : null
    if (estimatedPrice !== null && (Number.isNaN(estimatedPrice) || estimatedPrice < 0)) return
    const normalizedUrl = normalizeProductUrl(productUrl)
    if (productUrl.trim() && !normalizedUrl) return
    onSubmit({ name, estimatedPrice, productUrl: normalizedUrl })
  }
  return <ModalShell title={initial ? 'EDITAR ITEM' : 'ADICIONAR ITEM'} onClose={onClose}><form onSubmit={submit}><label className="field-label" htmlFor="item-name">NOME DO ITEM</label><input id="item-name" className="field" value={name} onChange={(event) => setName(event.target.value)} placeholder="Ex: Arroz 5kg" required maxLength={160} /><div className="item-price-field"><label className="field-label" htmlFor="item-price">PREÇO OPCIONAL</label><input id="item-price" className="field" value={price} onChange={(event) => setPrice(event.target.value)} inputMode="decimal" placeholder="Ex: 12,90" /></div><div className="item-url-field"><label className="field-label" htmlFor="item-url">LINK DO PRODUTO (OPCIONAL)</label><input id="item-url" className="field" type="url" value={productUrl} onChange={(event) => setProductUrl(event.target.value)} placeholder="https://loja.com/produto" maxLength={2048} /></div><div className="modal-actions"><button type="button" className="button button-ghost" onClick={onClose}>Cancelar</button><button className="button button-primary" disabled={busy}>{busy ? 'Salvando...' : initial ? 'Salvar' : 'Adicionar'}</button></div></form></ModalShell>
}

function FinishListModal({ list, busy, onClose, onFinish }: { list: ShoppingList; busy: boolean; onClose: () => void; onFinish: (movePendingItems: boolean) => void }) {
  const pending = list.items.filter((item) => !item.checked).length
  return <ModalShell title="FINALIZAR LISTA" onClose={onClose}><div className="confirm-copy"><p>Deseja finalizar <strong>{list.emoji} {list.name}</strong>?</p>{pending > 0 ? <p>Ainda há <strong>{pending} {pending === 1 ? 'item pendente' : 'itens pendentes'}</strong>. Você pode movê-los para uma nova lista com data prevista para daqui a 7 dias.</p> : <p>Todos os itens foram comprados. A lista será enviada ao arquivo.</p>}</div><div className={`modal-actions finish-list-actions ${pending > 0 ? 'has-pending' : ''}`}><button className="button button-ghost" onClick={onClose} disabled={busy}>Cancelar</button>{pending > 0 ? <button className="button button-danger" onClick={() => onFinish(false)} disabled={busy}>Finalizar sem mover</button> : null}<button className="button button-success" onClick={() => onFinish(pending > 0)} disabled={busy}>{busy ? 'Finalizando...' : pending > 0 ? 'Mover e finalizar' : 'Finalizar lista'}</button></div></ModalShell>
}

function ProductLink({ url, name }: { url: string; name: string }) {
  return <a className="product-link item-action-icon" href={url} target="_blank" rel="noopener noreferrer" onClick={(event) => event.stopPropagation()} aria-label={`Abrir link de ${name} em nova página`} title="Abrir produto"><SquareArrowOutUpRight aria-hidden /></a>
}

function normalizeProductUrl(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return null
  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
  try {
    const parsed = new URL(withProtocol)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:' ? parsed.toString() : null
  } catch {
    return null
  }
}

function ConfirmModal({ title, busy, onClose, onConfirm, children }: { title: string; busy: boolean; onClose: () => void; onConfirm: () => void; children: React.ReactNode }) {
  return <ModalShell title={title} onClose={onClose}><div className="confirm-copy">{children}</div><div className="modal-actions"><button className="button button-ghost" onClick={onClose}>Cancelar</button><button className="button button-primary" onClick={onConfirm} disabled={busy}>{busy ? 'Reabrindo...' : 'Reabrir lista'}</button></div></ModalShell>
}

function ModalShell({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return <div className="modal-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}><section className="modal-card" role="dialog" aria-modal="true" aria-label={title}><header><h2>{title}</h2><button onClick={onClose} aria-label="Fechar">×</button></header>{children}</section></div>
}

function EmptyState({ title, copy }: { title: string; copy: string }) {
  return <div className="empty-state"><span>🛒</span><h2>{title}</h2><p>{copy}</p></div>
}

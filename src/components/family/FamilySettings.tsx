'use client'

import { useMemo, useState, type FormEvent, type ReactNode } from 'react'
import {
  canManageFamily,
  createFamilyInvite,
  deleteFamilyInvite,
  displayMemberName,
  removeFamilyMember,
  updateFamilyName,
  type Family,
  type FamilyInvite,
  type FamilyMember,
  type FamilyRole,
} from '@/lib/family'
import { createClient } from '@/lib/supabase/client'

type Confirmation =
  | { type: 'invite'; invite: FamilyInvite }
  | { type: 'member'; member: FamilyMember }
  | null

export default function FamilySettings({
  family: initialFamily,
  currentMember,
  members: initialMembers,
  initialInvites,
  nowIso,
}: {
  family: Family
  currentMember: FamilyMember
  members: FamilyMember[]
  initialInvites: FamilyInvite[]
  nowIso: string
}) {
  const supabase = useMemo(() => createClient(), [])
  const [family, setFamily] = useState(initialFamily)
  const [members, setMembers] = useState(initialMembers)
  const [invites, setInvites] = useState(initialInvites)
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'admin' | 'member'>('member')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)
  const [editingName, setEditingName] = useState(false)
  const [familyName, setFamilyName] = useState(initialFamily.name)
  const [copiedInviteId, setCopiedInviteId] = useState<string | null>(null)
  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null)
  const [deletingInviteId, setDeletingInviteId] = useState<string | null>(null)
  const [confirmation, setConfirmation] = useState<Confirmation>(null)
  const canManage = canManageFamily(currentMember.role)

  async function submitFamilyName(event: FormEvent) {
    event.preventDefault()
    if (!canManage || busy) return
    setBusy(true)
    setNotice('')
    try {
      const updated = await updateFamilyName(supabase, family.id, familyName)
      setFamily(updated)
      setFamilyName(updated.name)
      setEditingName(false)
    } catch (error) {
      setNotice(familyNameError(error))
    } finally {
      setBusy(false)
    }
  }

  async function submitInvite(event: FormEvent) {
    event.preventDefault()
    if (!canManage || busy) return
    setBusy(true)
    setNotice('')
    setCopiedInviteId(null)
    try {
      const invite = await createFamilyInvite(supabase, family.id, email, role)
      setInvites((current) => [invite, ...current])
      setEmail('')
      setRole('member')
      setNotice('Convite criado. Copie o link na lista abaixo e envie para a pessoa convidada.')
    } catch (error) {
      setNotice(inviteError(error))
    } finally {
      setBusy(false)
    }
  }

  async function copyInvite(invite: FamilyInvite) {
    const link = `${window.location.origin}/convite/${invite.token}`
    await window.navigator.clipboard.writeText(link)
    setCopiedInviteId(invite.id)
    setNotice('')
  }

  async function deleteInvite(invite: FamilyInvite) {
    if (!canManage || deletingInviteId) return

    setDeletingInviteId(invite.id)
    setNotice('')
    try {
      await deleteFamilyInvite(supabase, invite.id)
      setInvites((current) => current.filter((item) => item.id !== invite.id))
      if (copiedInviteId === invite.id) setCopiedInviteId(null)
      setConfirmation(null)
    } catch (error) {
      setNotice(deleteInviteError(error))
    } finally {
      setDeletingInviteId(null)
    }
  }

  async function removeMember(member: FamilyMember) {
    if (!canRemoveMember(currentMember, member) || removingMemberId) return

    setRemovingMemberId(member.id)
    setNotice('')
    try {
      await removeFamilyMember(supabase, member.id)
      setMembers((current) => current.filter((item) => item.id !== member.id))
      setConfirmation(null)
    } catch (error) {
      setNotice(removeMemberError(error))
    } finally {
      setRemovingMemberId(null)
    }
  }

  return (
    <main className="family-main">
      <header className="dashboard-heading family-heading">
        <div>
          {editingName ? (
            <form className="family-name-form" onSubmit={submitFamilyName}>
              <input className="field" value={familyName} onChange={(event) => setFamilyName(event.target.value)} minLength={2} maxLength={80} autoFocus />
              <button className="button button-primary" type="submit" disabled={busy}>Salvar</button>
              <button className="button button-ghost" type="button" onClick={() => { setEditingName(false); setFamilyName(family.name) }}>Cancelar</button>
            </form>
          ) : (
            <div className="family-title-row">
              <h1>{family.name}</h1>
              {canManage ? <button className="family-edit-name" type="button" onClick={() => setEditingName(true)} aria-label="Editar nome da família">✎</button> : null}
            </div>
          )}
          <p>Gerencie membros e convites da sua família.</p>
        </div>
      </header>

      {notice ? <div className="module-notice">{notice}</div> : null}

      <section className="family-grid">
        <article className="family-panel">
          <div className="family-panel-head">
            <span>Membros</span>
            <strong>{members.length}</strong>
          </div>
          <div className="family-list">
            {members.map((member) => (
              <div className="family-row" key={member.id}>
                <span>
                  <strong>{displayMemberName(member)}</strong>
                  <small>{member.email}</small>
                </span>
                <div className="family-row-actions">
                  <b>{roleLabel(member.role)}</b>
                  {canRemoveMember(currentMember, member) ? (
                    <button className="button button-danger family-remove-member" type="button" disabled={removingMemberId === member.id} onClick={() => setConfirmation({ type: 'member', member })}>
                      {removingMemberId === member.id ? 'Removendo...' : 'Remover'}
                    </button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="family-panel">
          <div className="family-panel-head">
            <span>Novo convite</span>
          </div>
          {canManage ? (
            <form className="family-invite-form" onSubmit={submitInvite}>
              <label htmlFor="invite-email">E-mail</label>
              <input id="invite-email" className="field" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="pessoa@email.com" required />
              <label htmlFor="invite-role">Papel</label>
              <select id="invite-role" className="field" value={role} onChange={(event) => setRole(event.target.value as 'admin' | 'member')}>
                <option value="member">Membro</option>
                <option value="admin">Administrador</option>
              </select>
              <button className="button button-primary" type="submit" disabled={busy}>{busy ? 'Criando...' : 'Criar convite'}</button>
            </form>
          ) : (
            <p className="family-muted">Seu papel permite usar os módulos, mas não gerenciar convites.</p>
          )}
        </article>
      </section>

      <section className="family-panel">
        <div className="family-panel-head">
          <span>Convites</span>
          <strong>{invites.length}</strong>
        </div>
        <div className="family-list">
          {invites.length === 0 ? <p className="family-muted">Nenhum convite criado ainda.</p> : null}
          {invites.map((invite) => {
            const expired = invite.expiresAt <= nowIso
            const accepted = Boolean(invite.acceptedAt)
            const copied = copiedInviteId === invite.id
            return (
              <div className={`family-row ${copied ? 'copied' : ''}`} key={invite.id}>
                <span>
                  <strong>{invite.email}</strong>
                  <small>{accepted ? 'Aceito' : expired ? 'Expirado' : `Expira em ${formatDateTime(invite.expiresAt)}`}</small>
                </span>
                <div className="family-invite-actions">
                  {!accepted && !expired ? (
                    <button className={`button ${copied ? 'button-primary' : 'button-ghost'}`} type="button" onClick={() => copyInvite(invite)}>
                      {copied ? 'Link copiado' : 'Copiar link'}
                    </button>
                  ) : <b>{accepted ? 'aceito' : 'expirado'}</b>}
                  {!accepted && canManage ? (
                    <button className="button button-danger family-remove-member" type="button" disabled={deletingInviteId === invite.id} onClick={() => setConfirmation({ type: 'invite', invite })}>
                      {deletingInviteId === invite.id ? 'Excluindo...' : 'Excluir'}
                    </button>
                  ) : null}
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {confirmation ? (
        <FamilyConfirmModal
          busy={confirmation.type === 'invite' ? deletingInviteId === confirmation.invite.id : removingMemberId === confirmation.member.id}
          confirmLabel={confirmation.type === 'invite' ? 'Excluir convite' : 'Remover membro'}
          title={confirmation.type === 'invite' ? 'EXCLUIR CONVITE' : 'REMOVER MEMBRO'}
          onClose={() => setConfirmation(null)}
          onConfirm={() => confirmation.type === 'invite' ? deleteInvite(confirmation.invite) : removeMember(confirmation.member)}
        >
          {confirmation.type === 'invite' ? (
            <>
              <p>O convite para <strong>{confirmation.invite.email}</strong> sera excluido.</p>
              <p>O link deixa de funcionar imediatamente e a pessoa precisara receber um novo convite.</p>
            </>
          ) : (
            <>
              <p><strong>{displayMemberName(confirmation.member)}</strong> perdera o acesso a esta familia.</p>
              <p>O historico do que esse usuario ja fez sera mantido.</p>
            </>
          )}
        </FamilyConfirmModal>
      ) : null}
    </main>
  )
}

function FamilyConfirmModal({
  busy,
  children,
  confirmLabel,
  onClose,
  onConfirm,
  title,
}: {
  busy: boolean
  children: ReactNode
  confirmLabel: string
  onClose: () => void
  onConfirm: () => void
  title: string
}) {
  return (
    <div className="modal-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) onClose() }}>
      <section className="modal-card family-confirm-modal" role="dialog" aria-modal="true" aria-label={title}>
        <header>
          <h2>{title}</h2>
          <button type="button" onClick={onClose} disabled={busy} aria-label="Fechar">×</button>
        </header>
        <div className="confirm-copy">{children}</div>
        <div className="modal-actions">
          <button className="button button-ghost" type="button" onClick={onClose} disabled={busy}>Cancelar</button>
          <button className="button button-danger" type="button" onClick={onConfirm} disabled={busy}>{busy ? 'Excluindo...' : confirmLabel}</button>
        </div>
      </section>
    </div>
  )
}

function deleteInviteError(error: unknown) {
  const message = error instanceof Error ? error.message : ''
  if (message.includes('FORBIDDEN')) return 'Seu papel nao permite excluir convites.'
  return 'Nao foi possivel excluir o convite.'
}

function roleLabel(role: FamilyRole) {
  if (role === 'owner') return 'Responsável'
  if (role === 'admin') return 'Administrador'
  return 'Membro'
}

function canRemoveMember(currentMember: FamilyMember, target: FamilyMember) {
  if (currentMember.id === target.id || target.role === 'owner') return false
  if (currentMember.role === 'owner') return true
  return currentMember.role === 'admin' && target.role === 'member'
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

function inviteError(error: unknown) {
  const message = error instanceof Error ? error.message : ''
  if (message.includes('ALREADY_MEMBER')) return 'Este e-mail já é membro da família.'
  if (message.includes('INVALID_EMAIL')) return 'Informe um e-mail válido.'
  if (message.includes('FORBIDDEN')) return 'Seu papel não permite criar convites.'
  return 'Não foi possível criar o convite.'
}

function familyNameError(error: unknown) {
  const message = error instanceof Error ? error.message : ''
  if (message.includes('INVALID_FAMILY_NAME')) return 'Use um nome de família entre 2 e 80 caracteres.'
  if (message.includes('FORBIDDEN')) return 'Seu papel não permite editar o nome da família.'
  return 'Não foi possível salvar o nome da família.'
}

function removeMemberError(error: unknown) {
  const message = error instanceof Error ? error.message : ''
  if (message.includes('CANNOT_REMOVE_OWNER')) return 'O responsável da família não pode ser removido.'
  if (message.includes('CANNOT_REMOVE_SELF')) return 'Você não pode remover seu próprio acesso.'
  if (message.includes('FORBIDDEN')) return 'Seu papel não permite remover este membro.'
  return 'Não foi possível remover o membro.'
}

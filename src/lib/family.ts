import type { SupabaseClient, User } from '@supabase/supabase-js'

export type FamilyRole = 'owner' | 'admin' | 'member'

export type Family = {
  id: string
  name: string
  createdBy: string | null
  createdAt: string
  updatedAt: string | null
}

export type FamilyMember = {
  id: string
  familyId: string
  userId: string
  name: string | null
  email: string
  role: FamilyRole
  avatarUrl: string | null
  createdAt: string
  updatedAt: string | null
}

export type FamilyInvite = {
  id: string
  familyId: string
  email: string
  role: Exclude<FamilyRole, 'owner'>
  token: string
  invitedBy: string | null
  acceptedBy: string | null
  acceptedAt: string | null
  expiresAt: string
  createdAt: string
}

export type PublicFamilyInvite = {
  id: string
  familyId: string
  familyName: string
  email: string
  role: Exclude<FamilyRole, 'owner'>
  acceptedAt: string | null
  expiresAt: string
  createdAt: string
}

type FamilyRow = {
  id: string
  name: string
  created_by: string | null
  created_at: string
  updated_at: string | null
}

type MemberRow = {
  id: string
  family_id: string
  user_id: string
  name: string | null
  email: string
  role: FamilyRole
  avatar_url: string | null
  created_at: string
  updated_at: string | null
}

type InviteRow = {
  id: string
  family_id: string
  email: string
  role: Exclude<FamilyRole, 'owner'>
  token: string
  invited_by: string | null
  accepted_by: string | null
  accepted_at: string | null
  expires_at: string
  created_at: string
}

type PublicInviteRow = {
  id: string
  family_id: string
  family_name: string
  email: string
  role: Exclude<FamilyRole, 'owner'>
  accepted_at: string | null
  expires_at: string
  created_at: string
}

export type CurrentFamilyContext = {
  user: User
  family: Family
  member: FamilyMember
  members: FamilyMember[]
}

export function canManageFamily(role: FamilyRole) {
  return role === 'owner' || role === 'admin'
}

export function displayMemberName(member: Pick<FamilyMember, 'name' | 'email'>) {
  return member.name?.trim() || member.email.split('@')[0] || 'Membro'
}

export function responsibleOptions(members: FamilyMember[]) {
  return ['Família', ...members.map(displayMemberName)]
}

function mapFamily(row: FamilyRow): Family {
  return {
    id: row.id,
    name: row.name,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function mapMember(row: MemberRow): FamilyMember {
  return {
    id: row.id,
    familyId: row.family_id,
    userId: row.user_id,
    name: row.name,
    email: row.email,
    role: row.role,
    avatarUrl: row.avatar_url,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function mapInvite(row: InviteRow): FamilyInvite {
  return {
    id: row.id,
    familyId: row.family_id,
    email: row.email,
    role: row.role,
    token: row.token,
    invitedBy: row.invited_by,
    acceptedBy: row.accepted_by,
    acceptedAt: row.accepted_at,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
  }
}

function mapPublicInvite(row: PublicInviteRow): PublicFamilyInvite {
  return {
    id: row.id,
    familyId: row.family_id,
    familyName: row.family_name,
    email: row.email,
    role: row.role,
    acceptedAt: row.accepted_at,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
  }
}

export async function getAuthenticatedUser(supabase: SupabaseClient) {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    throw new Error('Sessão expirada. Entre novamente.')
  }

  return user
}

export async function getCurrentFamilyContext(
  supabase: SupabaseClient,
  userId?: string,
): Promise<CurrentFamilyContext | null> {
  const user = userId
    ? (await supabase.auth.getUser()).data.user
    : await getAuthenticatedUser(supabase)

  if (!user) return null

  const { data: membership, error: membershipError } = await supabase
    .from('family_members')
    .select('*')
    .eq('user_id', userId ?? user.id)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (membershipError) throw membershipError
  if (!membership) return null

  const member = mapMember(membership as MemberRow)

  const [familyResult, membersResult] = await Promise.all([
    supabase.from('families').select('*').eq('id', member.familyId).single(),
    supabase.from('family_members').select('*').eq('family_id', member.familyId).order('created_at'),
  ])

  if (familyResult.error) throw familyResult.error
  if (membersResult.error) throw membersResult.error

  return {
    user,
    family: mapFamily(familyResult.data as FamilyRow),
    member,
    members: ((membersResult.data ?? []) as MemberRow[]).map(mapMember),
  }
}

export async function ensureFamilyForCurrentUser(
  supabase: SupabaseClient,
  familyName?: string,
) {
  const { data, error } = await supabase.rpc('create_family_for_current_user', {
    family_name: familyName ?? null,
  })

  if (error) throw error
  return data as string
}

export async function getFamilyInvites(
  supabase: SupabaseClient,
  familyId: string,
) {
  const { data, error } = await supabase
    .from('family_invites')
    .select('*')
    .eq('family_id', familyId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return ((data ?? []) as InviteRow[]).map(mapInvite)
}

export async function createFamilyInvite(
  supabase: SupabaseClient,
  familyId: string,
  email: string,
  role: Exclude<FamilyRole, 'owner'>,
) {
  const { data, error } = await supabase.rpc('create_family_invite', {
    target_family_id: familyId,
    invite_email: email,
    invite_role: role,
  })

  if (error) throw error
  return mapInvite(data as InviteRow)
}

export async function deleteFamilyInvite(
  supabase: SupabaseClient,
  inviteId: string,
) {
  const { error } = await supabase
    .from('family_invites')
    .delete()
    .eq('id', inviteId)

  if (error) throw error
}

export async function updateFamilyName(
  supabase: SupabaseClient,
  familyId: string,
  name: string,
) {
  const { data, error } = await supabase.rpc('update_family_name', {
    target_family_id: familyId,
    new_family_name: name,
  })

  if (error) throw error
  return mapFamily(data as FamilyRow)
}

export async function removeFamilyMember(
  supabase: SupabaseClient,
  memberId: string,
) {
  const { data, error } = await supabase.rpc('remove_family_member', {
    target_member_id: memberId,
  })

  if (error) throw error
  return data as string
}

export async function getPublicFamilyInvite(
  supabase: SupabaseClient,
  token: string,
) {
  const { data, error } = await supabase.rpc('get_family_invite', {
    invite_token: token,
  })

  if (error) throw error
  const rows = (data ?? []) as PublicInviteRow[]
  return rows[0] ? mapPublicInvite(rows[0]) : null
}

export async function acceptFamilyInvite(
  supabase: SupabaseClient,
  token: string,
) {
  const { data, error } = await supabase.rpc('accept_family_invite', {
    invite_token: token,
  })

  if (error) throw error
  return data as string
}

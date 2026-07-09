import { redirect } from 'next/navigation'
import FamilySettings from '@/components/family/FamilySettings'
import InternalShell from '@/components/layout/InternalShell'
import { canManageFamily, getCurrentFamilyContext, getFamilyInvites } from '@/lib/family'
import { createClient } from '@/lib/supabase/server'

export default async function FamilyPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/?next=/familia')

  const context = await getCurrentFamilyContext(supabase, user.id)
  if (!context) redirect('/familia/criar')

  const invites = await getFamilyInvites(supabase, context.family.id).catch(() => [])

  return (
    <InternalShell active="family" canManageFamily={canManageFamily(context.member.role)}>
      <FamilySettings
        family={context.family}
        currentMember={context.member}
        members={context.members}
        initialInvites={invites}
        nowIso={new Date().toISOString()}
      />
    </InternalShell>
  )
}

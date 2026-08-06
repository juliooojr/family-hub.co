import { redirect } from 'next/navigation'
import CalendarModule from '@/components/calendar/CalendarModule'
import InternalShell from '@/components/layout/InternalShell'
import { getCalendarData } from '@/lib/calendar'
import { canManageFamily, getCurrentFamilyContext } from '@/lib/family'
import { createClient } from '@/lib/supabase/server'

export default async function CalendarPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/?next=/agenda')
  const familyContext = await getCurrentFamilyContext(supabase, user.id)
  if (!familyContext) redirect('/familia/criar')

  let events: Awaited<ReturnType<typeof getCalendarData>>['events'] = []
  let overrides: Awaited<ReturnType<typeof getCalendarData>>['overrides'] = []
  let initialError = ''
  try {
    const data = await getCalendarData(supabase)
    events = data.events
    overrides = data.overrides
  } catch (error) {
    initialError = error instanceof Error ? error.message : 'Não foi possível carregar a agenda.'
  }

  return (
    <InternalShell active="calendar" canManageFamily={canManageFamily(familyContext.member.role)}>
      <CalendarModule
        familyId={familyContext.family.id}
        userId={user.id}
        canManageAll={canManageFamily(familyContext.member.role)}
        members={familyContext.members}
        initialEvents={events}
        initialOverrides={overrides}
        initialError={initialError}
      />
    </InternalShell>
  )
}

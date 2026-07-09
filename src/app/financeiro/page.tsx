import { redirect } from 'next/navigation'
import FinanceModule from '@/components/finance/FinanceModule'
import InternalShell from '@/components/layout/InternalShell'
import { canManageFamily, getCurrentFamilyContext } from '@/lib/family'
import { getFinanceData } from '@/lib/finance'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export default async function FinancePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/?next=/financeiro')
  const familyContext = await getCurrentFamilyContext(supabase, user.id)
  if (!familyContext) redirect('/familia/criar')

  const data = await getFinanceData(supabase, user.id)
  return (
    <InternalShell active="finance" canManageFamily={canManageFamily(familyContext.member.role)}>
      <FinanceModule {...data} />
    </InternalShell>
  )
}

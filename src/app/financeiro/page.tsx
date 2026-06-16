import { redirect } from 'next/navigation'
import FinanceModule from '@/components/finance/FinanceModule'
import { getFinanceData } from '@/lib/finance'
import { createClient } from '@/lib/supabase/server'

export default async function FinancePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login?next=/financeiro')

  const data = await getFinanceData(supabase, user.id)
  return <FinanceModule {...data} />
}

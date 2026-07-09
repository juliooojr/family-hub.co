import { redirect } from 'next/navigation'
import { ensureFamilyForCurrentUser, getCurrentFamilyContext } from '@/lib/family'
import { createClient } from '@/lib/supabase/server'

export default async function CreateFamilyPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/?next=/familia/criar')

  const context = await getCurrentFamilyContext(supabase, user.id)
  if (!context) {
    const name = user.user_metadata.full_name ?? user.email?.split('@')[0] ?? 'Família'
    await ensureFamilyForCurrentUser(supabase, `Família de ${String(name).split(' ')[0]}`)
  }

  redirect('/hub')
}

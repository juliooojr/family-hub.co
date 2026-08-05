import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import FamilyActivityFeed from '@/components/activity/FamilyActivityFeed'
import InternalShell from '@/components/layout/InternalShell'
import { getFamilyActivities } from '@/lib/activity'
import { canManageFamily, getCurrentFamilyContext } from '@/lib/family'
import { createClient } from '@/lib/supabase/server'

export default async function ActivitiesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/?next=/atividades')
  const familyContext = await getCurrentFamilyContext(supabase, user.id)
  if (!familyContext) redirect('/familia/criar')
  let activities: Awaited<ReturnType<typeof getFamilyActivities>> = []
  try { activities = await getFamilyActivities(supabase, familyContext.family.id, familyContext.members) } catch {}
  return <InternalShell active="home" canManageFamily={canManageFamily(familyContext.member.role)}>
    <main className="activity-history-main">
      <Link className="activity-history-back" href="/hub"><ArrowLeft aria-hidden /> Voltar para o início</Link>
      <header className="activity-history-heading"><span>Histórico</span><h1>Atividade da Família</h1><p>Os acontecimentos mais relevantes da casa, do mais recente para o mais antigo.</p></header>
      <section className="activity-history-card" aria-label="Histórico de atividades"><FamilyActivityFeed activities={activities} history /></section>
    </main>
  </InternalShell>
}

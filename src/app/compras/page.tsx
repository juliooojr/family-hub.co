import { redirect } from 'next/navigation'
import InternalShell from '@/components/layout/InternalShell'
import ShoppingModule from '@/components/shopping/ShoppingModule'
import { canManageFamily, getCurrentFamilyContext, responsibleOptions } from '@/lib/family'
import { getShoppingLists, type ShoppingList } from '@/lib/shopping'
import { createClient } from '@/lib/supabase/server'

export default async function ShoppingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/?next=/compras')
  const familyContext = await getCurrentFamilyContext(supabase, user.id)
  if (!familyContext) redirect('/familia/criar')

  let lists: ShoppingList[] = []
  let initialError = ''
  try {
    lists = await getShoppingLists(supabase)
  } catch (error) {
    initialError = error instanceof Error ? error.message : 'Não foi possível carregar as listas.'
  }

  return (
    <InternalShell active="shopping" canManageFamily={canManageFamily(familyContext.member.role)}>
      <ShoppingModule
        initialLists={lists}
        initialError={initialError}
        responsibleOptions={responsibleOptions(familyContext.members)}
        familyId={familyContext.family.id}
      />
    </InternalShell>
  )
}

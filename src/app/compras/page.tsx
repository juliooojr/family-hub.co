import { redirect } from 'next/navigation'
import InternalShell from '@/components/layout/InternalShell'
import ShoppingModule from '@/components/shopping/ShoppingModule'
import { getShoppingLists, type ShoppingList } from '@/lib/shopping'
import { createClient } from '@/lib/supabase/server'

export default async function ShoppingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/?next=/compras')

  let lists: ShoppingList[] = []
  let initialError = ''
  try {
    lists = await getShoppingLists(supabase)
  } catch (error) {
    initialError = error instanceof Error ? error.message : 'Não foi possível carregar as listas.'
  }

  return (
    <InternalShell active="shopping">
      <ShoppingModule initialLists={lists} initialError={initialError} />
    </InternalShell>
  )
}

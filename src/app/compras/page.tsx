import { redirect } from 'next/navigation'
import ShoppingModule from '@/components/shopping/ShoppingModule'
import { getShoppingLists, type ShoppingList } from '@/lib/shopping'
import { createClient } from '@/lib/supabase/server'

export default async function ShoppingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  let lists: ShoppingList[] = []
  let initialError = ''
  try {
    lists = await getShoppingLists(supabase)
  } catch (error) {
    initialError = error instanceof Error ? error.message : 'Não foi possível carregar as listas.'
  }

  return <ShoppingModule initialLists={lists} initialError={initialError} />
}

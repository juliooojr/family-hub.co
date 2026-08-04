import type { SupabaseClient } from '@supabase/supabase-js'
import { getCurrentFamilyContext } from '@/lib/family'

export type ShoppingStatus = 'active' | 'archived'

export type ShoppingItem = {
  id: string
  listId: string
  familyId: string
  name: string
  estimatedPrice: number | null
  productUrl: string | null
  checked: boolean
  checkedAt: string | null
  createdAt: string
}

export type ShoppingList = {
  id: string
  familyId: string
  emoji: string
  name: string
  scheduledDate: string | null
  responsible: string
  status: ShoppingStatus
  createdAt: string
  archivedAt: string | null
  items: ShoppingItem[]
}

type ListRow = {
  id: string
  family_id: string
  emoji: string
  name: string
  scheduled_date: string | null
  responsible: string
  status: ShoppingStatus
  created_at: string
  archived_at: string | null
  shopping_items: ItemRow[] | null
}

type ItemRow = {
  id: string
  list_id: string
  family_id: string
  name: string
  estimated_price: number | string | null
  product_url: string | null
  checked: boolean
  checked_at: string | null
  created_at: string
}

export type ItemInput = {
  name: string
  estimatedPrice: number | null
  productUrl: string | null
}

export type ListInput = {
  emoji: string
  name: string
  scheduledDate: string | null
  responsible: string
}

function mapItem(row: ItemRow): ShoppingItem {
  return {
    id: row.id,
    listId: row.list_id,
    familyId: row.family_id,
    name: row.name,
    estimatedPrice: row.estimated_price == null ? null : Number(row.estimated_price),
    productUrl: row.product_url,
    checked: row.checked,
    checkedAt: row.checked_at,
    createdAt: row.created_at,
  }
}

function mapList(row: ListRow): ShoppingList {
  return {
    id: row.id,
    familyId: row.family_id,
    emoji: row.emoji,
    name: row.name,
    scheduledDate: row.scheduled_date,
    responsible: row.responsible,
    status: row.status,
    createdAt: row.created_at,
    archivedAt: row.archived_at,
    items: (row.shopping_items ?? []).map(mapItem),
  }
}

async function getFamilyId(supabase: SupabaseClient): Promise<string> {
  const context = await getCurrentFamilyContext(supabase)
  if (!context) throw new Error('Crie ou aceite uma família para usar Compras.')
  return context.family.id
}

export async function getShoppingLists(supabase: SupabaseClient): Promise<ShoppingList[]> {
  const familyId = await getFamilyId(supabase)
  const { data, error } = await supabase
    .from('shopping_lists')
    .select('*, shopping_items(*)')
    .eq('family_id', familyId)

  if (error) throw error
  return ((data ?? []) as ListRow[]).map(mapList)
}

export async function createShoppingList(
  supabase: SupabaseClient,
  input: ListInput,
): Promise<ShoppingList> {
  const familyId = await getFamilyId(supabase)
  const { data, error } = await supabase
    .from('shopping_lists')
    .insert({
      family_id: familyId,
      emoji: input.emoji,
      name: input.name.trim(),
      scheduled_date: input.scheduledDate || null,
      responsible: input.responsible,
    })
    .select('*, shopping_items(*)')
    .single()

  if (error) throw error
  return mapList(data as ListRow)
}

export async function updateShoppingList(
  supabase: SupabaseClient,
  listId: string,
  input: ListInput,
): Promise<void> {
  const { error } = await supabase
    .from('shopping_lists')
    .update({
      emoji: input.emoji,
      name: input.name.trim(),
      scheduled_date: input.scheduledDate || null,
      responsible: input.responsible,
    })
    .eq('id', listId)
  if (error) throw error
}

export async function createShoppingItem(
  supabase: SupabaseClient,
  list: ShoppingList,
  input: ItemInput,
): Promise<ShoppingItem> {
  const { data, error } = await supabase
    .from('shopping_items')
    .insert({
      list_id: list.id,
      family_id: list.familyId,
      name: input.name.trim(),
      estimated_price: input.estimatedPrice,
      product_url: input.productUrl,
    })
    .select('*')
    .single()
  if (error) throw error
  return mapItem(data as ItemRow)
}

export async function updateShoppingItem(
  supabase: SupabaseClient,
  itemId: string,
  input: ItemInput,
): Promise<void> {
  const { error } = await supabase
    .from('shopping_items')
    .update({
      name: input.name.trim(),
      estimated_price: input.estimatedPrice,
      product_url: input.productUrl,
    })
    .eq('id', itemId)
  if (error) throw error
}

export async function setShoppingItemChecked(
  supabase: SupabaseClient,
  itemId: string,
  checked: boolean,
): Promise<void> {
  const { error } = await supabase
    .from('shopping_items')
    .update({ checked, checked_at: checked ? new Date().toISOString() : null })
    .eq('id', itemId)
  if (error) throw error
}

export async function deleteShoppingItem(
  supabase: SupabaseClient,
  itemId: string,
): Promise<void> {
  const { error } = await supabase.from('shopping_items').delete().eq('id', itemId)
  if (error) throw error
}

export async function archiveShoppingList(
  supabase: SupabaseClient,
  listId: string,
): Promise<void> {
  const { error } = await supabase
    .from('shopping_lists')
    .update({ status: 'archived', archived_at: new Date().toISOString() })
    .eq('id', listId)
  if (error) throw error
}

export async function finishShoppingList(
  supabase: SupabaseClient,
  listId: string,
  movePendingItems: boolean,
): Promise<ShoppingList[]> {
  const { error } = await supabase.rpc('finish_shopping_list', {
    target_list_id: listId,
    move_pending_items: movePendingItems,
  })
  if (error) throw error
  return getShoppingLists(supabase)
}

export async function reopenShoppingList(
  supabase: SupabaseClient,
  list: ShoppingList,
): Promise<void> {
  const { error: itemsError } = await supabase
    .from('shopping_items')
    .update({ checked: false, checked_at: null })
    .eq('list_id', list.id)
  if (itemsError) throw itemsError

  const { error: listError } = await supabase
    .from('shopping_lists')
    .update({ status: 'active', archived_at: null })
    .eq('id', list.id)
  if (listError) throw listError
}

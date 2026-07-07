import { redirect } from 'next/navigation'
import InternalShell from '@/components/layout/InternalShell'
import TasksModule from '@/components/tasks/TasksModule'
import { getTasksData, type RoutineEntry, type RoutineTask } from '@/lib/tasks'
import { createClient } from '@/lib/supabase/server'

export default async function TasksPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/?next=/tarefas')

  let familyId = ''
  let tasks: RoutineTask[] = []
  let entries: RoutineEntry[] = []
  let initialError = ''

  try {
    const data = await getTasksData(supabase, user.id)
    familyId = data.familyId
    tasks = data.tasks
    entries = data.entries
  } catch (error) {
    initialError = error instanceof Error ? error.message : 'Não foi possível carregar as tarefas.'
  }

  return (
    <InternalShell active="tasks">
      <TasksModule
        familyId={familyId}
        userId={user.id}
        initialTasks={tasks}
        initialEntries={entries}
        initialError={initialError}
      />
    </InternalShell>
  )
}

import { CalendarDays, ClipboardList, FileText, ShoppingCart, TriangleAlert, Wallet } from 'lucide-react'
import { formatRelativeActivityTime, type ActivityModule, type FamilyActivity } from '@/lib/activity'

const modules = {
  shopping: { label: 'Compras', icon: ShoppingCart }, tasks: { label: 'Tarefas', icon: ClipboardList }, finance: { label: 'Finanças', icon: Wallet },
  calendar: { label: 'Agenda', icon: CalendarDays }, documents: { label: 'Documentos', icon: FileText }, emergency: { label: 'Emergência', icon: TriangleAlert },
} satisfies Record<ActivityModule, { label: string; icon: typeof ShoppingCart }>

export default function FamilyActivityFeed({ activities, history = false }: { activities: FamilyActivity[]; history?: boolean }) {
  return <div className={`family-activity-feed ${history ? 'is-history' : ''}`}>
    {activities.length ? activities.map((event) => {
      const { label, icon: Icon } = modules[event.module]
      return <article className={`family-activity-row module-${event.module}`} key={event.id}>
        <span className="family-activity-icon" title={label}><Icon aria-hidden /></span>
        <p>{event.description}</p><time dateTime={event.createdAt}>{formatRelativeActivityTime(event.createdAt)}</time>
      </article>
    }) : <div className="family-activity-empty"><ClipboardList aria-hidden /><strong>Nenhuma atividade recente</strong><small>Os acontecimentos importantes da família aparecerão aqui.</small></div>}
    {!history && activities.length ? <small className="family-activity-caption">Mostrando os {activities.length} eventos mais recentes.</small> : null}
  </div>
}

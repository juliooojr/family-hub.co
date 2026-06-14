import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

const plannedAreas = [
  { title: 'Transações', copy: 'Receitas, despesas e movimentações da reserva.' },
  { title: 'Contas', copy: 'Compromissos recorrentes, vencimentos e pagamentos.' },
  { title: 'Orçamento', copy: 'Limites mensais por categoria e acompanhamento.' },
  { title: 'Investimentos', copy: 'Aportes e rentabilidade registrados manualmente.' },
]

export default async function FinancePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  return (
    <main className="finance-shell">
      <header className="topbar finance-topbar">
        <div className="topbar-left">
          <Link className="icon-button" href="/" aria-label="Voltar ao Hub">‹</Link>
          <div>
            <h1 className="topbar-title">FINANCEIRO</h1>
            <p className="topbar-subtitle">Primeira etapa em preparação</p>
          </div>
        </div>
        <span className="finance-preview-badge">PREVIEW</span>
      </header>

      <section className="finance-content">
        <div className="finance-intro">
          <span className="eyebrow">MÓDULO LIBERADO PARA CONSTRUÇÃO</span>
          <h2>FINANÇAS DA FAMÍLIA, EM UM SÓ LUGAR.</h2>
          <p>
            O acesso já está disponível nesta versão de testes. Nenhuma informação financeira
            está sendo gravada ainda; o schema e as regras de segurança serão revisados antes da primeira entrega funcional.
          </p>
        </div>

        <nav className="finance-tabs" aria-label="Áreas planejadas do Financeiro">
          <span className="active">Visão Geral</span>
          <span>Transações</span>
          <span>Contas</span>
          <span>Orçamento</span>
          <span>Investimentos</span>
        </nav>

        <div className="finance-stage-card">
          <div>
            <span className="finance-stage-number">01</span>
            <div>
              <h3>FUNDAÇÃO DO MÓDULO</h3>
              <p>Próximo passo: confirmar o modelo financeiro, criar a migration com RLS e entregar o CRUD inicial de transações.</p>
            </div>
          </div>
          <span className="finance-status">EM REVISÃO</span>
        </div>

        <div className="finance-area-grid">
          {plannedAreas.map((area, index) => (
            <article className="finance-area-card" key={area.title}>
              <span>0{index + 2}</span>
              <h3>{area.title}</h3>
              <p>{area.copy}</p>
              <small>Próxima etapa</small>
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}

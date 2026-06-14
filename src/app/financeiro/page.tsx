import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

const tabs = ['Visão Geral', 'Transações', 'Contas', 'Orçamento', 'Investimentos']

export default async function FinancePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login?next=/financeiro')

  const month = new Intl.DateTimeFormat('pt-BR', {
    month: 'long',
    year: 'numeric',
    timeZone: 'America/Sao_Paulo',
  }).format(new Date())

  return (
    <main className="finance-shell">
      <header className="finance-topbar">
        <div className="finance-topbar-main">
          <Link className="finance-back" href="/" aria-label="Voltar ao Hub">‹</Link>
          <div className="finance-heading">
            <h1>FINANCEIRO</h1>
            <p>{month}</p>
          </div>
          <nav className="finance-tabs" aria-label="Áreas do Financeiro">
            {tabs.map((tab, index) => (
              <button className={index === 0 ? 'active' : ''} disabled={index !== 0} key={tab}>
                {tab}
              </button>
            ))}
          </nav>
        </div>

        <div className="finance-actions">
          <div className="finance-owners" aria-label="Responsável selecionado">
            <button className="active">Família</button>
            <button disabled>Julio</button>
            <button disabled>Carol</button>
          </div>
          <button className="button button-ghost" disabled>Exportar</button>
          <button className="button button-primary" disabled>+ Transação</button>
        </div>
      </header>

      <section className="finance-content">
        <div className="finance-local-note">
          <span>AMBIENTE LOCAL</span>
          Estrutura visual em preparação. Nenhum dado financeiro está sendo salvo.
        </div>

        <div className="finance-summary-grid">
          <article className="finance-card">
            <span className="finance-card-label">Receita do mês</span>
            <strong className="finance-value income">R$ 0,00</strong>
            <p>Nenhuma receita registrada</p>
          </article>
          <article className="finance-card">
            <span className="finance-card-label">Despesas do mês</span>
            <strong className="finance-value expense">R$ 0,00</strong>
            <div className="finance-tags"><span>Fixo R$ 0</span><span>Variável R$ 0</span></div>
          </article>
          <article className="finance-card">
            <span className="finance-card-label">Contas do mês</span>
            <strong className="finance-value">R$ 0,00</strong>
            <div className="finance-tags"><span className="paid">R$ 0 pagas</span><span>R$ 0 pend.</span></div>
          </article>
          <article className="finance-card">
            <span className="finance-card-label">Saldo do mês</span>
            <strong className="finance-value balance">R$ 0,00</strong>
            <p>Aguardando transações</p>
          </article>
        </div>

        <div className="finance-main-grid">
          <article className="finance-card finance-chart-card">
            <header className="finance-section-header">
              <h2>FLUXO DE CAIXA</h2>
              <div className="finance-legend"><span className="income">■ Receita</span><span className="expense">■ Despesa</span></div>
            </header>
            <div className="finance-chart" aria-label="Fluxo de caixa sem dados">
              {[1, 2, 3, 4, 5].map((week) => (
                <div className="finance-chart-column" key={week}>
                  <div className="finance-empty-bars"><span /><span /></div>
                  <small>{week === 5 ? 'PREV' : `S${week}`}</small>
                </div>
              ))}
              <p>As movimentações aparecerão aqui</p>
            </div>
          </article>

          <article className="finance-card">
            <header className="finance-section-header"><h2>GASTOS POR CATEGORIA</h2></header>
            <div className="finance-empty-state">
              <span>◎</span>
              <strong>Sem despesas neste mês</strong>
              <p>As categorias serão calculadas a partir das transações.</p>
            </div>
          </article>
        </div>

        <article className="finance-card finance-reserve">
          <header className="finance-section-header">
            <div><h2>RESERVA DE EMERGÊNCIA</h2><p>Meta ainda não configurada</p></div>
            <div className="finance-reserve-actions"><span>0% da meta</span><button className="button button-ghost" disabled>Configurar meta</button></div>
          </header>
          <div className="finance-progress"><span /></div>
          <div className="finance-progress-meta"><span>R$ 0,00 acumulado</span><span>Meta: não definida</span></div>
          <div className="finance-reserve-grid">
            <div><span>Saldo atual</span><strong>R$ 0,00</strong></div>
            <div><span>Meta</span><strong>R$ 0,00</strong></div>
            <div><span>Aporte médio/mês</span><strong>R$ 0,00</strong></div>
          </div>
          <div className="finance-reserve-buttons">
            <button className="button button-primary" disabled>+ Depositar na Reserva</button>
            <button className="button button-ghost" disabled>− Retirar da Reserva</button>
          </div>
        </article>
      </section>

      <nav className="float-nav" aria-label="Módulos">
        <Link className="fn-home" href="/" prefetch aria-label="Hub">⌂</Link>
        <span className="fn-sep" />
        <button disabled>📊 Início</button>
        <button className="active">💰 Finanças</button>
        <button disabled>📅 Agenda</button>
        <Link className="finance-nav-link" href="/compras" prefetch>🛒 Compras</Link>
        <span className="fn-sep" />
        <button disabled>🐾 Flora</button>
        <button disabled>📁 Docs</button>
        <button className="sos-nav" disabled>🚨 SOS</button>
      </nav>
    </main>
  )
}

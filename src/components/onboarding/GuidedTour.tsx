'use client'

import { useCallback, useEffect, useLayoutEffect, useState, type CSSProperties } from 'react'
import { usePathname, useRouter } from 'next/navigation'

const STORAGE_KEY = 'fh-guided-tour-v2'
const TOUR_EVENT = 'fh-start-guided-tour'

type TourStep = { title: string; description: string; target?: string; path?: string; tab?: string }

const steps: TourStep[] = [
  { title: 'Bem-vindo ao Family Hub', description: 'Vamos fazer um passeio rápido pelo módulo Financeiro. Você pode avançar, voltar ou pular quando quiser.' },
  { title: 'Seu espaço financeiro', description: 'Aqui ficam receitas, despesas, contas recorrentes, orçamento e reserva da família.', target: '[data-tour="finance-navigation"]', path: '/financeiro' },
  { title: 'Escolha o que deseja acompanhar', description: 'Use estas abas para alternar entre a visão geral, transações, contas e orçamento.', target: '[data-tour="finance-tabs"]', path: '/financeiro' },
  { title: 'Comece pelo Orçamento', description: 'Crie categorias e defina quanto pretende gastar em cada uma. As categorias cadastradas aqui serão as mesmas disponíveis em Transações e Contas.', target: '[data-tour="finance-budget-content"] .finance-page-toolbar', path: '/financeiro', tab: 'orcamento' },
  { title: 'Transações do dia a dia', description: 'Use Transações para receitas e despesas avulsas: mercado, farmácia, lazer ou qualquer movimentação que não seja uma conta mensal.', target: '[data-tour-tab="transacoes"]', path: '/financeiro', tab: 'transacoes' },
  { title: 'Contas que se repetem', description: 'Use Contas para compromissos fixos ou recorrentes que precisam ser acompanhados e pagos todos os meses, como aluguel, energia e cartão.', target: '[data-tour="finance-bills-content"] .finance-page-toolbar', path: '/financeiro', tab: 'contas' },
  { title: 'Acompanhe o resultado', description: 'A Visão Geral reúne receitas, despesas, saldo e margem planejada do mês para você entender rapidamente como a família está.', target: '[data-tour="finance-summary"]', path: '/financeiro', tab: 'visao' },
  { title: 'Construa sua reserva', description: 'Configure uma meta e registre depósitos ou retiradas. A reserva é uma movimentação patrimonial e não altera o saldo comum do mês.', target: '.finance-reserve', path: '/financeiro', tab: 'visao' },
  { title: 'Tudo pronto!', description: 'Use “Refazer tutorial” no menu lateral.' },
]

export function startGuidedTour() {
  window.dispatchEvent(new Event(TOUR_EVENT))
}

export default function GuidedTour() {
  const pathname = usePathname()
  const router = useRouter()
  const [stepIndex, setStepIndex] = useState<number | null>(null)
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null)

  const start = useCallback(() => {
    setTargetRect(null)
    setStepIndex(0)
  }, [])

  useEffect(() => {
    const initialTimer = !window.localStorage.getItem(STORAGE_KEY) ? window.setTimeout(start, 0) : null
    window.addEventListener(TOUR_EVENT, start)
    return () => {
      if (initialTimer !== null) window.clearTimeout(initialTimer)
      window.removeEventListener(TOUR_EVENT, start)
    }
  }, [start])

  useEffect(() => {
    if (stepIndex === null) return
    const step = steps[stepIndex]
    if (step.path && pathname !== step.path) router.push(step.path)
    if (step.tab && pathname === '/financeiro') {
      document.querySelector<HTMLButtonElement>(`[data-tour-tab="${step.tab}"]`)?.click()
    }
  }, [pathname, router, stepIndex])

  const updateTarget = useCallback(() => {
    if (stepIndex === null) return
    const selector = steps[stepIndex].target
    if (!selector) return setTargetRect(null)
    const element = Array.from(document.querySelectorAll<HTMLElement>(selector)).find((candidate) => {
      const rect = candidate.getBoundingClientRect()
      return rect.width > 0 && rect.height > 0
    })
    const rect = element?.getBoundingClientRect()
    if (element && rect && (rect.top < 8 || rect.bottom > window.innerHeight - 180)) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
    setTargetRect(rect ?? null)
  }, [stepIndex])

  useLayoutEffect(() => {
    const frame = window.requestAnimationFrame(updateTarget)
    const retry = window.setTimeout(updateTarget, 350)
    window.addEventListener('resize', updateTarget)
    window.addEventListener('scroll', updateTarget, true)
    return () => {
      window.cancelAnimationFrame(frame)
      window.clearTimeout(retry)
      window.removeEventListener('resize', updateTarget)
      window.removeEventListener('scroll', updateTarget, true)
    }
  }, [pathname, updateTarget])

  if (stepIndex === null) return null
  const step = steps[stepIndex]
  const isLast = stepIndex === steps.length - 1
  const showTarget = Boolean(targetRect && (!step.path || pathname === step.path))

  function finish() {
    window.localStorage.setItem(STORAGE_KEY, 'completed')
    setStepIndex(null)
    setTargetRect(null)
  }

  function advance() {
    if (isLast) finish()
    else setStepIndex((current) => current === null ? 0 : current + 1)
  }

  const style = showTarget && targetRect ? {
    '--tour-x': `${Math.max(8, targetRect.left - 6)}px`,
    '--tour-y': `${Math.max(8, targetRect.top - 6)}px`,
    '--tour-width': `${Math.min(window.innerWidth - 16, targetRect.width + 12)}px`,
    '--tour-height': `${targetRect.height + 12}px`,
  } as CSSProperties : undefined

  return (
    <div className={`guided-tour ${showTarget ? 'has-target' : 'centered'}`} style={style} role="dialog" aria-modal="true" aria-labelledby="guided-tour-title">
      <div className="guided-tour-shade" aria-hidden="true" />
      {showTarget ? <div className="guided-tour-spotlight" aria-hidden="true" /> : null}
      <section className="guided-tour-card">
        <button className="guided-tour-close" type="button" onClick={finish} aria-label="Fechar tutorial">×</button>
        <div className="guided-tour-progress"><span>PASSO {stepIndex + 1} DE {steps.length}</span><div>{steps.map((_, index) => <i className={index <= stepIndex ? 'active' : ''} key={index} />)}</div></div>
        <h2 id="guided-tour-title">{step.title}</h2>
        <p>{step.description}</p>
        <div className="guided-tour-actions">
          <button className="button button-ghost" type="button" onClick={finish}>Pular tutorial</button><span />
          <button className="button button-ghost" type="button" onClick={() => setStepIndex((current) => Math.max(0, (current ?? 0) - 1))} disabled={stepIndex === 0}>Voltar</button>
          <button className="button button-primary" type="button" onClick={advance}>{isLast ? 'Concluir' : 'Avançar'}</button>
        </div>
      </section>
    </div>
  )
}

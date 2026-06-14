'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type HubSessionUser = { name: string; email: string }

export default function HubUser() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [user, setUser] = useState<HubSessionUser | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(({ data }) => {
      const sessionUser = data.session?.user
      if (sessionUser) {
        setUser({
          name: sessionUser.user_metadata.full_name ?? sessionUser.email?.split('@')[0] ?? 'Família',
          email: sessionUser.email ?? '',
        })
      }
    })
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      const sessionUser = session?.user
      setUser(sessionUser ? {
        name: sessionUser.user_metadata.full_name ?? sessionUser.email?.split('@')[0] ?? 'Família',
        email: sessionUser.email ?? '',
      } : null)
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  if (!user) {
    return <Link className="hub-user hub-login" href="/login"><span className="hub-avatar">↗</span><span className="hub-user-name">Entrar</span></Link>
  }

  async function signOut() {
    await createClient().auth.signOut()
    router.refresh()
  }

  return (
    <div className="hub-account">
      <button className="hub-user" onClick={() => setOpen((value) => !value)} aria-expanded={open}>
        <span className="hub-avatar">{user.name.charAt(0).toUpperCase()}</span><span className="hub-user-name">{user.name.split(' ')[0]}</span>
      </button>
      {open ? <div className="account-menu"><span>{user.email}</span><button onClick={signOut}>Sair</button></div> : null}
    </div>
  )
}

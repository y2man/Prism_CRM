import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { api } from '../lib/api'

export type User = { id: number; name: string; email: string }
type AuthValue = { user: User; signOut: () => void }
const AuthContext = createContext<AuthValue | null>(null)
export const useAuth = () => {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth must be used inside AuthGate')
  return value
}

export function AuthGate({ children }: { children: (value: AuthValue) => ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [checking, setChecking] = useState(true)
  const [refresh, setRefresh] = useState(0)
  useEffect(() => {
    const logout = () => { setUser(null); setChecking(false) }
    window.addEventListener('prism:logout', logout)
    const token = localStorage.getItem('prism-token')
    if (!token) { setChecking(false); return () => window.removeEventListener('prism:logout', logout) }
    api<User>('/api/auth/me').then(setUser).catch(() => { localStorage.removeItem('prism-token'); setUser(null) }).finally(() => setChecking(false))
    return () => window.removeEventListener('prism:logout', logout)
  }, [refresh])
  const signOut = () => { localStorage.removeItem('prism-token'); setUser(null) }
  if (checking) return <div className='auth-loading'><span className='auth-mark'>p.</span><p>Opening your workspace…</p></div>
  return user ? <AuthContext.Provider value={{ user, signOut }}>{children({ user, signOut })}</AuthContext.Provider> : <Login onSuccess={() => { setChecking(true); setRefresh(v => v + 1) }} />
}

function Login({ onSuccess }: { onSuccess: () => void }) {
  const [register, setRegister] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setError('')
    try {
      const result = await api<{ access_token: string }>(`/api/auth/${register ? 'register' : 'login'}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(register ? { name, email, password } : { email, password }) })
      localStorage.setItem('prism-token', result.access_token); onSuccess()
    } catch (e) { setError((e as Error).message) } finally { setBusy(false) }
  }
  return <main className='auth-page'>
    <div className='auth-glow auth-glow-a' /><div className='auth-glow auth-glow-b' />
    <section className='auth-card'>
      <div className='auth-brand'><span className='auth-mark'>p.</span><span>prism<span>.</span></span></div>
      <div className='auth-kicker'>YOUR SALES WORKSPACE</div>
      <h1>{register ? 'A clearer view starts here.' : 'Welcome back.'}</h1>
      <p className='auth-subtitle'>{register ? 'Create your secure workspace and keep every relationship in focus.' : 'Sign in to pick up where your team left off.'}</p>
      <form onSubmit={submit} className='auth-form'>
        {register && <label className='field'><span>Your name</span><input autoComplete='name' required value={name} onChange={e => setName(e.target.value)} placeholder='Alex Carter' /></label>}
        <label className='field'><span>Email address</span><input type='email' autoComplete='email' required value={email} onChange={e => setEmail(e.target.value)} placeholder='you@company.com' /></label>
        <label className='field'><span>Password</span><input type='password' autoComplete={register ? 'new-password' : 'current-password'} minLength={register ? 10 : 1} required value={password} onChange={e => setPassword(e.target.value)} placeholder={register ? 'At least 10 characters' : 'Your password'} /></label>
        {error && <p className='form-error auth-error'>{error}</p>}
        <button className='button button-primary auth-submit' disabled={busy}>{busy ? 'Please wait…' : register ? 'Create workspace' : 'Sign in'} <span>→</span></button>
      </form>
      <div className='auth-switch'>{register ? 'Already have an account?' : 'New to Prism?'} <button onClick={() => { setRegister(!register); setError('') }}>{register ? 'Sign in' : 'Create account'}</button></div>
      <div className='auth-foot'><span>Private by design</span><span>·</span><span>Your CRM belongs to you</span></div>
    </section>
  </main>
}

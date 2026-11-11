export const apiBase = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')
export async function api<T>(url: string, init?: RequestInit): Promise<T> {
  let res: Response
  const headers = new Headers(init?.headers)
  const token = localStorage.getItem('prism-token')
  if (token) headers.set('Authorization', `Bearer ${token}`)
  try { res = await fetch(`${apiBase}${url}`, { ...init, headers }) } catch { throw new Error('Cannot reach the backend. Start it with: uvicorn main:app --reload (in /backend).') }
  if (res.status === 401 && token && !url.startsWith('/api/auth/')) { localStorage.removeItem('prism-token'); window.dispatchEvent(new Event('prism:logout')) }
  if (!res.ok) { const d = await res.json().catch(() => null); throw new Error(d?.detail ? (typeof d.detail === 'string' ? d.detail : 'Please check the form fields.') : res.statusText) }
  return res.json() as Promise<T>
}
export const json = (method: string, body?: unknown): RequestInit => ({ method, headers: { 'Content-Type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body) })
export const money = (n: number) => '$' + n.toLocaleString()
export const initials = (n: string) => n.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase()
export const ago = (iso: string) => { const s = (Date.now() - new Date(iso.endsWith('Z') ? iso : iso + 'Z').getTime()) / 1000; return s < 60 ? 'just now' : s < 3600 ? `${Math.floor(s / 60)} min ago` : s < 86400 ? `${Math.floor(s / 3600)} h ago` : `${Math.floor(s / 86400)} d ago` }
export const stageLabel = (s: string) => s[0].toUpperCase() + s.slice(1)

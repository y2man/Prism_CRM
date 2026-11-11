import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { api } from '../lib/api'
import type { Activity, Customer, Stats, Task } from '../types'

type Ctx = { customers: Customer[]; tasks: Task[]; activities: Activity[]; stats: Stats | null; loading: boolean; error: string; reload: () => Promise<void>; notify: (m: string) => void; toast: string; search: string; setSearch: (s: string) => void; page: number; setPage: (n: number) => void; total: number; sort: string; setSort: (s: string) => void }
const C = createContext<Ctx>(null as unknown as Ctx)
export const useCRM = () => useContext(C)

export function CRMProvider({ children }: { children: ReactNode }) {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [sort, setSort] = useState('newest')
  const notify = useCallback((m: string) => { setToast(m); window.setTimeout(() => setToast(''), 2800) }, [])
  const reload = useCallback(async () => {
    try {
      const params = new URLSearchParams({ q: search, page: '1', per_page: '5000', sort })
      const [c, count, t, a, s] = await Promise.all([api<Customer[]>(`/api/customers?${params}`), api<{total:number}>(`/api/customers/count?q=${encodeURIComponent(search)}`), api<Task[]>('/api/tasks'), api<Activity[]>('/api/activities'), api<Stats>('/api/stats')])
      setCustomers(c); setTotal(count.total); setTasks(t); setActivities(a); setStats(s); setError('')
    } catch (e) { setError((e as Error).message) } finally { setLoading(false) }
  }, [search, page, sort])
  useEffect(() => { const id = window.setTimeout(() => { void reload() }, search ? 250 : 0); return () => window.clearTimeout(id) }, [reload, search])
  const changeSearch = (s: string) => { setSearch(s); setPage(1) }
  const changeSort = (s: string) => { setSort(s); setPage(1) }
  return <C.Provider value={{ customers, tasks, activities, stats, loading, error, reload, notify, toast, search, setSearch: changeSearch, page, setPage, total, sort, setSort: changeSort }}>{children}</C.Provider>
}

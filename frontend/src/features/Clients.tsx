import { useState } from 'react'
import { Copy, Mail, Sparkles, Trash2, ArrowRight } from 'lucide-react'
import { api, initials, json, money, stageLabel } from '../lib/api'
import { useCRM } from '../state/crm'
import type { Customer } from '../types'

export const useFiltered = () => { const { customers, search } = useCRM(); const q = search.toLowerCase(); return customers.filter(c => `${c.name} ${c.company} ${c.email}`.toLowerCase().includes(q)) }

function Card({ c }: { c: Customer }) {
  const { reload, notify } = useCRM()
  const [flip, setFlip] = useState(false)
  const contactLabel = c.last_contact_date ? new Date(`${c.last_contact_date}T12:00:00`).toLocaleDateString() : c.last_contact
  const [out, setOut] = useState(''); const [busy, setBusy] = useState('')
  const run = async (kind: 'insight' | 'email') => {
    setBusy(kind); try { const r = await api<Record<string, string>>(`/api/ai/${kind}/${c.id}`, json('POST')); setOut(r[kind]) } catch (e) { setOut((e as Error).message) } setBusy('')
  }
  const act = async (fn: () => Promise<unknown>, msg: string) => { try { await fn(); await reload(); notify(msg) } catch (e) { notify((e as Error).message) } }
  return <div className='flip-scene'><div className={`flip-card ${flip ? 'on' : ''}`}>
    <div className='flip-face front' onClick={() => setFlip(true)} role='button' tabIndex={0} onKeyDown={e => e.key === 'Enter' && setFlip(true)}>
      <div className='fc-head'><span className='avatar avatar-blue'>{initials(c.name)}</span><span><b>{c.name}</b><small>{c.company}</small></span><span className={`stage-pill stage-${c.stage}`}>{stageLabel(c.stage)}</span></div>
      <p className='fc-mail'>{c.email || 'No email yet'}</p>
      <div className='score'><div><i style={{ width: c.score + '%' }} /></div><span>AI score {c.score}</span></div>
      <div className='fc-foot'><b>{money(c.value)}</b><small>Last contact: {contactLabel}</small></div>
      <small className='hint'>Click to flip for AI tools</small>
    </div>
    <div className='flip-face back'>
      <div className='back-top'><b>{c.name}</b><button className='text-action' onClick={() => setFlip(false)}>Back</button></div>
      <div className='back-out'>{out || c.notes || 'No notes yet. Use the AI tools below.'}</div>
      <div className='back-actions'>
        <button className='chip' onClick={() => run('insight')} disabled={!!busy}><Sparkles size={13} />{busy === 'insight' ? 'Thinking…' : 'AI insight'}</button>
        <button className='chip' onClick={() => run('email')} disabled={!!busy}><Mail size={13} />{busy === 'email' ? 'Writing…' : 'Draft email'}</button>
        {out && <button className='chip' onClick={() => { navigator.clipboard?.writeText(out); notify('Copied.') }}><Copy size={13} />Copy</button>}
        {c.stage !== 'won' && c.stage !== 'lost' && <button className='chip' onClick={() => act(() => api(`/api/customers/${c.id}/advance`, json('POST')), `${c.name} moved forward.`)}><ArrowRight size={13} />Advance</button>}
        <button className='chip danger' onClick={() => confirm(`Delete ${c.name}?`) && act(() => api(`/api/customers/${c.id}`, json('DELETE')), 'Client deleted.')}><Trash2 size={13} />Delete</button>
      </div>
    </div></div></div>
}
export function Clients({ onAdd }: { onAdd: () => void }) {
  const matches = useFiltered(); const { loading, total, page, setPage, sort, setSort } = useCRM()
  const list = matches.slice((page - 1) * 24, page * 24)
  if (loading) return <p className='empty'>Loading clients…</p>
  return <><div className='page-head'><div><h1>Clients</h1><p className='subheading'>Flip a card to get AI insights, draft emails and move deals.</p></div><div className='clients-actions'><label className='sort-control'>Sort by <select value={sort} onChange={e => setSort(e.target.value)}><option value='newest'>Recently added</option><option value='oldest'>Oldest first</option><option value='name'>Name</option><option value='value'>Deal value</option><option value='stage'>Stage</option></select></label><button className='button button-primary' onClick={onAdd}>Add client</button></div></div>
    {list.length ? <div className='card-grid'>{list.map(c => <Card key={c.id} c={c} />)}</div> : <p className='empty'>No clients match. Add one to get started.</p>}
    {total > 24 && <div className='pagination'><span>Showing {(page - 1) * 24 + 1}–{Math.min(page * 24, total)} of {total}</span><div><button className='button button-secondary' disabled={page === 1} onClick={() => setPage(page - 1)}>Previous</button><button className='button button-secondary' disabled={page * 24 >= total} onClick={() => setPage(page + 1)}>Next</button></div></div>}</>
}

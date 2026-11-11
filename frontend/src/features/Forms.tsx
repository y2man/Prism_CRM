import { useState } from 'react'
import { X } from 'lucide-react'
import { api, json } from '../lib/api'
import { useCRM } from '../state/crm'

export type AddKind = 'client' | 'lead' | 'task'
export function AddModal({ kind, onClose }: { kind: AddKind; onClose: () => void }) {
  const { reload, notify } = useCRM()
  const [f, setF] = useState({ name: '', company: '', email: '', value: '', title: '', detail: '', due: 'Today', last_contact_date: '' })
  const [err, setErr] = useState(''); const [busy, setBusy] = useState(false)
  const set = (k: string, v: string) => setF({ ...f, [k]: v })
  const submit = async () => {
    setErr('')
    if (kind === 'task' ? !f.title.trim() : !f.name.trim() || !f.company.trim()) return setErr(kind === 'task' ? 'Enter a task title.' : 'Name and company are required.')
    setBusy(true)
    try {
      if (kind === 'task') await api('/api/tasks', json('POST', { title: f.title, detail: f.detail, due: f.due }))
      else await api('/api/customers', json('POST', { name: f.name, company: f.company, email: f.email, value: Number(f.value) || 0, stage: kind === 'lead' ? 'lead' : 'contacted', last_contact: 'Not contacted', last_contact_date: f.last_contact_date || null }))
      await reload(); notify(kind === 'task' ? 'Task added.' : `${kind === 'lead' ? 'Lead' : 'Client'} added.`); onClose()
    } catch (e) { setErr((e as Error).message) } finally { setBusy(false) }
  }
  const field = (k: keyof typeof f, label: string, type = 'text') => <label className='field'><span>{label}</span><input type={type} value={f[k]} onChange={e => set(k, e.target.value)} onKeyDown={e => e.key === 'Enter' && submit()} /></label>
  return <div className='modal-backdrop' onClick={onClose}><div className='modal' onClick={e => e.stopPropagation()}>
    <div className='modal-heading'><div><h2>New {kind}</h2><p>{kind === 'task' ? 'Plan your next action.' : 'Add the details you have. You can edit them later.'}</p></div><button className='icon-btn' onClick={onClose} aria-label='Close'><X size={18} /></button></div>
    <div className='form-grid'>{kind === 'task' ? <>{field('title', 'Task title')}{field('detail', 'Details')}{field('due', 'Due')}</> : <>{field('name', 'Full name')}{field('company', 'Company')}{field('email', 'Email', 'email')}{field('value', 'Deal value ($)', 'number')}{field('last_contact_date', 'Last contact date', 'date')}</>}</div>
    {err && <p className='form-error'>{err}</p>}
    <div className='form-actions'><button className='button button-secondary' onClick={onClose}>Cancel</button><button className='button button-primary' onClick={submit} disabled={busy}>{busy ? 'Saving…' : 'Save'}</button></div>
  </div></div>
}

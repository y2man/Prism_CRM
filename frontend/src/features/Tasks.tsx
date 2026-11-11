import { Trash2 } from 'lucide-react'
import { api, json } from '../lib/api'
import { useCRM } from '../state/crm'

export function Tasks({ onAdd }: { onAdd: () => void }) {
  const { tasks, reload, notify } = useCRM()
  const act = async (fn: () => Promise<unknown>, m?: string) => { try { await fn(); await reload(); m && notify(m) } catch (e) { notify((e as Error).message) } }
  const open = tasks.filter(t => !t.done).length
  return <><div className='page-head'><div><h1>Tasks & calendar</h1><p className='subheading'>{open} open · {tasks.length - open} done</p></div><button className='button button-primary' onClick={onAdd}>Add task</button></div>
    <div className='panel task-list'>{tasks.map(t => <div key={t.id} className={`task-row ${t.done ? 'task-done' : ''}`}>
      <input type='checkbox' checked={t.done} onChange={() => act(() => api(`/api/tasks/${t.id}/toggle`, json('POST')))} aria-label={`Complete ${t.title}`} />
      <span className='task-copy'><b>{t.title}</b><small>{t.detail}</small></span><span className='task-time'>{t.due}</span>
      <button className='icon-btn' onClick={() => act(() => api(`/api/tasks/${t.id}`, json('DELETE')), 'Task deleted.')} aria-label='Delete task'><Trash2 size={15} /></button></div>)}
      {!tasks.length && <p className='empty'>No tasks yet.</p>}</div></>
}

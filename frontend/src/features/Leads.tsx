import { api, initials, json, money, stageLabel } from '../lib/api'
import { useCRM } from '../state/crm'
import { useFiltered } from './Clients'

export function Leads({ onAdd }: { onAdd: () => void }) {
  const { reload, notify } = useCRM()
  const list = useFiltered().filter(c => !['won', 'lost'].includes(c.stage))
  const act = async (fn: () => Promise<unknown>, m: string) => { try { await fn(); await reload(); notify(m) } catch (e) { notify((e as Error).message) } }
  return <><div className='page-head'><div><h1>Leads</h1><p className='subheading'>Open opportunities, best score first.</p></div><button className='button button-primary' onClick={onAdd}>Add lead</button></div>
    <div className='panel'><div className='table-scroll'><table><thead><tr><th>CONTACT</th><th>STAGE</th><th>VALUE</th><th>SCORE</th><th>ACTIONS</th></tr></thead><tbody>
      {[...list].sort((a, b) => b.score - a.score).map(c => <tr key={c.id}><td><div className='contact-cell'><span className='avatar avatar-violet'>{initials(c.name)}</span><span><b>{c.name}</b><small>{c.company}</small></span></div></td>
        <td><span className={`stage-pill stage-${c.stage}`}>{stageLabel(c.stage)}</span></td><td className='value-cell'>{money(c.value)}</td><td>{c.score}</td>
        <td className='row-actions'><button className='chip' onClick={() => act(() => api(`/api/customers/${c.id}/advance`, json('POST')), `${c.name} moved forward.`)}>Advance</button>
          <button className='chip' onClick={() => act(() => api(`/api/customers/${c.id}`, json('PATCH', { stage: 'lost' })), `${c.name} marked lost.`)}>Mark lost</button></td></tr>)}
    </tbody></table>{!list.length && <p className='empty'>No open leads.</p>}</div></div></>
}

import { useState } from 'react'
import { api, json, money, stageLabel } from '../lib/api'
import { useCRM } from '../state/crm'
import { STAGES, type Customer, type Stage } from '../types'
import { useFiltered } from './Clients'

export function Pipeline() {
  const { reload, notify } = useCRM(); const list = useFiltered()
  const [over, setOver] = useState<Stage | null>(null)
  const move = async (c: Customer, stage: Stage) => { if (c.stage === stage) return; try { await api(`/api/customers/${c.id}`, json('PATCH', { stage })); await reload(); notify(`${c.name} → ${stageLabel(stage)}`) } catch (e) { notify((e as Error).message) } }
  const drop = (e: React.DragEvent, stage: Stage) => { e.preventDefault(); setOver(null); const c = list.find(x => x.id === Number(e.dataTransfer.getData('id'))); if (c) move(c, stage) }
  return <><div className='page-head'><div><h1>Sales pipeline</h1><p className='subheading'>Drag cards between stages, or use the arrows.</p></div></div>
    <div className='kanban'>{STAGES.map((s, si) => { const col = list.filter(c => c.stage === s); return <div key={s} className={`kcol ${over === s ? 'over' : ''}`} onDragOver={e => { e.preventDefault(); setOver(s) }} onDragLeave={() => setOver(null)} onDrop={e => drop(e, s)}>
      <div className='kcol-head'><b>{stageLabel(s)}</b><span>{col.length} · {money(col.reduce((a, c) => a + c.value, 0))}</span></div>
      {col.map(c => <div key={c.id} className='kcard' draggable onDragStart={e => e.dataTransfer.setData('id', String(c.id))}>
        <b>{c.name}</b><small>{c.company}</small><div className='kcard-foot'><span>{money(c.value)}</span><span className='kmove'>
          <button aria-label='Move back' disabled={si === 0} onClick={() => move(c, STAGES[si - 1])}>←</button><button aria-label='Move forward' disabled={si === STAGES.length - 1} onClick={() => move(c, STAGES[si + 1])}>→</button></span></div></div>)}
      {!col.length && <p className='kempty'>Drop here</p>}</div> })}</div></>
}

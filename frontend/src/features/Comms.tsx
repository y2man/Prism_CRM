import { useState } from 'react'
import { Copy, Mail, Sparkles } from 'lucide-react'
import { api, json } from '../lib/api'
import { useCRM } from '../state/crm'

export function Comms() {
  const { customers, notify } = useCRM()
  const [id, setId] = useState(0); const [text, setText] = useState(''); const [busy, setBusy] = useState(false)
  const c = customers.find(x => x.id === id)
  const draft = async () => { if (!c) return notify('Choose a client first.'); setBusy(true); try { setText((await api<{ email: string }>(`/api/ai/email/${c.id}`, json('POST'))).email) } catch (e) { notify((e as Error).message) } setBusy(false) }
  const mailto = () => { if (!c || !text) return; const m = text.match(/^Subject:\s*(.*)\n+/i); window.location.href = `mailto:${c.email}?subject=${encodeURIComponent(m ? m[1] : 'Following up')}&body=${encodeURIComponent(m ? text.slice(m[0].length) : text)}` }
  return <><div className='page-head'><div><h1>Communications</h1><p className='subheading'>Draft follow-ups with AI, edit them, then send from your email app.</p></div></div>
    <div className='panel comms'><label className='field'><span>Client</span><select value={id} onChange={e => { setId(Number(e.target.value)); setText('') }}><option value={0}>Select a client…</option>{customers.map(x => <option key={x.id} value={x.id}>{x.name} — {x.company}</option>)}</select></label>
      <textarea className='draft' rows={11} value={text} onChange={e => setText(e.target.value)} placeholder='Your draft appears here. You can edit it before sending.' />
      <div className='form-actions'><button className='button button-primary' onClick={draft} disabled={busy}><Sparkles size={15} />{busy ? 'Writing…' : 'Draft with AI'}</button>
        <button className='button button-secondary' disabled={!text} onClick={() => { navigator.clipboard?.writeText(text); notify('Copied.') }}><Copy size={15} />Copy</button>
        <button className='button button-secondary' disabled={!text || !c?.email} onClick={mailto}><Mail size={15} />Open in email app</button></div></div></>
}

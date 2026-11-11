import { useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'
import { api } from '../lib/api'
import { useCRM } from '../state/crm'

export function Settings({ dark, toggle }: { dark: boolean; toggle: () => void }) {
  const { notify } = useCRM(); const [ai, setAi] = useState('Checking…'); const [api_, setApi] = useState('Checking…')
  const check = () => { api<{ message: string }>('/api/ai/status').then(r => setAi(r.message)).catch(e => setAi(e.message)); api<{ status: string }>('/health').then(r => setApi('Backend is ' + r.status)).catch(() => setApi('Backend is not reachable')) }
  useEffect(check, [])
  return <><div className='page-head'><div><h1>Settings</h1><p className='subheading'>Appearance and connections.</p></div></div>
    <div className='panel setting'><div><b>Theme</b><small>Switch between light and dark glass.</small></div><button className='button button-secondary' onClick={toggle}>{dark ? <Sun size={15} /> : <Moon size={15} />}{dark ? 'Use light mode' : 'Use dark mode'}</button></div>
    <div className='panel setting'><div><b>Backend</b><small>{api_}</small></div><button className='button button-secondary' onClick={() => { check(); notify('Rechecked.') }}>Test connection</button></div>
    <div className='panel setting'><div><b>AI provider</b><small>{ai}</small></div></div></>
}
const FAQ = [['How do I add a client or lead?', 'Press “Add new” at the top right, or use the Add button on the Clients and Leads pages.'], ['How do I move a deal?', 'Open Sales pipeline and drag the card to another column, or use the arrow buttons.'], ['How do I turn on Prism AI?', 'Set GROQ_API_KEY in the backend environment and restart the service. Without it, Prism uses private, built-in CRM summaries.'], ['Where is my data stored?', 'Locally, it is in your configured database. For deployment, connect the backend to a managed PostgreSQL database such as Neon.']]
export function Help() {
  const [open, setOpen] = useState(0)
  return <><div className='page-head'><div><h1>Help & support</h1><p className='subheading'>Quick answers.</p></div></div>
    <div className='panel'>{FAQ.map(([q, a], i) => <div key={q} className='faq'><button onClick={() => setOpen(open === i ? -1 : i)}><b>{q}</b><span>{open === i ? '−' : '+'}</span></button>{open === i && <p>{a}</p>}</div>)}</div></>
}

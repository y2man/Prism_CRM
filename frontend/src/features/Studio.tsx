import { useEffect, useRef, useState } from 'react'
import { ArrowUp, Copy, RotateCcw, Sparkles } from 'lucide-react'
import { api, json } from '../lib/api'
import { useChat } from '../components/fx/useChat'
import { useCRM } from '../state/crm'
import { Markdown } from '../components/fx/Markdown'

export function Studio () {
  const { customers } = useCRM()
  const { msgs, busy, send } = useChat()
  const [q, setQ] = useState('')
  const [cid, setCid] = useState(0)
  const [insight, setInsight] = useState('')
  const [ib, setIb] = useState(false)
  const end = useRef<HTMLDivElement>(null)
  useEffect(() => {
    end.current?.scrollIntoView({ behavior: 'smooth' })
  }, [msgs, busy])
  const go = (t: string) => {
    send(t)
    setQ('')
  }
  const run = async () => {
    if (!cid) return
    setIb(true)
    try {
      setInsight(
        (await api<{ insight: string }>(`/api/ai/insight/${cid}`, json('POST')))
          .insight
      )
    } catch (e) {
      setInsight((e as Error).message)
    }
    setIb(false)
  }
  return (
    <>
      <div className='page-head'>
        <div>
          <h1>AI Studio</h1>
          <p className='subheading'>
            Ask questions about your data or analyze a single client.
          </p>
        </div>
      </div>
      <div className='studio'>
        <div className='panel chatbox'>
          <div className='chat-scroll'>
            {!msgs.length && (
              <p className='empty'>
                Try: “Which deals need attention this week?”
              </p>
            )}
            {msgs.map((m, i) => (
              <div
                key={i}
                className={`bubble ${m.me ? 'me' : ''}`}
                style={m.me ? { whiteSpace: 'pre-wrap' } : undefined}
              >
                {m.me ? m.text : <><Markdown text={m.text} /><div className='ai-reply-actions'><button onClick={() => navigator.clipboard?.writeText(m.text)}><Copy size={13} /> Copy</button>{i === msgs.length - 1 && !busy && <button onClick={() => { const last = [...msgs.slice(0, i)].reverse().find(x => x.me); if (last) send(last.text, true) }}><RotateCcw size={13} /> Regenerate</button>}</div></>}
              </div>
            ))}
            {busy && (
              <div className='bubble'>
                <span className='typing'>
                  <i />
                  <i />
                  <i />
                </span>
              </div>
            )}
            <div ref={end} />
          </div>
          <div className='chat-input'>
            <input
              value={q}
              onChange={e => setQ(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && go(q)}
              placeholder='Ask your CRM…'
            />
            <button
              className='send-btn'
              onClick={() => go(q)}
              disabled={busy}
              aria-label='Send'
            >
              <ArrowUp size={17} />
            </button>
          </div>
        </div>
        <div className='panel tool'>
          <h2>Client analysis</h2>
          <label className='field'>
            <span>Client</span>
            <select
              value={cid}
              onChange={e => {
                setCid(Number(e.target.value))
                setInsight('')
              }}
            >
              <option value={0}>Select a client…</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <button
            className='button button-primary'
            onClick={run}
            disabled={!cid || ib}
          >
            <Sparkles size={15} />
            {ib ? 'Analyzing…' : 'Analyze'}
          </button>
          {insight && (
            <div className='back-out' style={{ marginTop: 14 }}>
              <Markdown text={insight} />
            </div>
          )}
        </div>
      </div>
    </>
  )
}

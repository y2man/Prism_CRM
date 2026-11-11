import { useEffect, useRef, useState } from 'react'
import { Markdown } from '../fx/Markdown'
import { ArrowUp, Bot, Copy, Plus, RotateCcw, Sparkles, X } from 'lucide-react'
import { useChat } from '../fx/useChat'
import { useCRM } from '../../state/crm'

const SUGGEST = [
  'Which deals need attention this week?',
  'Summarize my sales pipeline',
  'Who is my biggest open opportunity?'
]
export function AIAssistant ({ onClose }: { onClose: () => void }) {
  const { stats } = useCRM()
  const { msgs, busy, send, clear } = useChat()
  const [message, setMessage] = useState('')
  const end = useRef<HTMLDivElement>(null)
  useEffect(() => {
    end.current?.scrollIntoView({ behavior: 'smooth' })
  }, [msgs, busy])
  const go = (t: string) => {
    send(t)
    setMessage('')
  }
  return (
    <aside className='ai-panel'>
      <div className='ai-header'>
        <div className='ai-brand'>
          <div className='ai-logo'>
            <img src='/prism-icon-180.png' alt='Prism CRM' />
          </div>
          <span>
            <b>Prism AI</b>
            <small>
              Business copilot <i />
            </small>
          </span>
        </div>
        <div className='ai-actions'>
          <button
            className='icon-btn'
            onClick={clear}
            title='New conversation'
            aria-label='New conversation'
          >
            <Plus size={18} />
          </button>
          <button
            className='icon-btn ai-close'
            onClick={onClose}
            aria-label='Close assistant'
          >
            <X size={17} />
          </button>
        </div>
      </div>
      <div className='ai-body'>
        <div className='ai-greeting'>
          <span className='ai-avatar'>
            <Bot size={18} />
          </span>
          <div>
            <b>Ask about your business</b>
            <small>
              {stats
                ? `${stats.open_deals} open deals in the pipeline`
                : 'Loading your workspace…'}
            </small>
          </div>
        </div>
        {msgs.length === 0 && (
          <>
            <div className='ai-section-label'>SUGGESTED FOR YOU</div>
            {SUGGEST.map(s => (
              <button key={s} className='suggestion' onClick={() => go(s)}>
                {s}
                <span>→</span>
              </button>
            ))}
          </>
        )}
        {msgs.map((m, i) => (
          <div key={i} className={m.me ? 'ai-me' : 'ai-reply'}>
            {!m.me && (
              <b>
                <Sparkles size={12} /> Prism AI{m.local ? ' · built-in' : ''}
              </b>
            )}
            {m.me ? (
              <p style={{ whiteSpace: 'pre-wrap' }}>{m.text}</p>
            ) : (
              <><Markdown text={m.text} /><div className='ai-reply-actions'><button onClick={() => { navigator.clipboard?.writeText(m.text); }} title='Copy reply'><Copy size={13} /> Copy</button>{i === msgs.length - 1 && !busy && <button onClick={() => { const last = [...msgs.slice(0, i)].reverse().find(x => x.me); if (last) send(last.text, true) }} title='Regenerate reply'><RotateCcw size={13} /> Regenerate</button>}</div></>
            )}
          </div>
        ))}
        {busy && (
          <div className='ai-reply'>
            <p className='typing'>
              <i />
              <i />
              <i />
            </p>
          </div>
        )}
        <div ref={end} />
      </div>
      <div className='ai-footer'>
        <div className='ai-input-wrap'>
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                go(message)
              }
            }}
            placeholder='Ask anything about your business...'
            rows={2}
          />
          <div className='ai-input-bottom'>
            <span>AI can make mistakes. Review important insights.</span>
            <button
              className='send-btn'
              onClick={() => go(message)}
              aria-label='Send message'
              disabled={busy}
            >
              <ArrowUp size={17} />
            </button>
          </div>
        </div>
      </div>
    </aside>
  )
}

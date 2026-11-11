import { useState } from 'react'
import { apiBase } from '../../lib/api'
export type Msg = { me: boolean; text: string; local?: boolean }
export function useChat(onDone?: () => void) {
  const [msgs, setMsgs] = useState<Msg[]>([])
  const [busy, setBusy] = useState(false)
  const send = async (text: string, regenerate = false) => {
    const t = text.trim(); if (!t || busy) return
    const historyMessages = regenerate ? msgs.slice(0, -2) : msgs
    const history = historyMessages.slice(-10).map(m => ({ role: m.me ? 'user' : 'assistant', content: m.text }))
    if (regenerate) setMsgs(m => m.slice(0, -1))
    else setMsgs(m => [...m, { me: true, text: t }, { me: false, text: '' }])
    if (regenerate) setMsgs(m => [...m, { me: false, text: '' }])
    setBusy(true)
    try {
      const token = localStorage.getItem('prism-token')
      const response = await fetch(`${apiBase}/api/ai/chat/stream`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify({ message: t, history }) })
      if (!response.ok) {
        const data = await response.json().catch(() => null)
        if (response.status === 401) { localStorage.removeItem('prism-token'); window.dispatchEvent(new Event('prism:logout')) }
        throw new Error(data?.detail || 'AI is unavailable right now. Please try again.')
      }
      const reader = response.body?.getReader()
      if (!reader) throw new Error('Streaming is not supported by this browser.')
      const decoder = new TextDecoder()
      let textOut = ''
      while (true) {
        const { value, done } = await reader.read()
        if (done) break
        textOut += decoder.decode(value, { stream: true })
        setMsgs(m => m.map((item, i) => i === m.length - 1 ? { ...item, text: textOut, local: response.headers.get('X-AI-Provider') === 'local' } : item))
      }
      textOut += decoder.decode()
      setMsgs(m => m.map((item, i) => i === m.length - 1 ? { ...item, text: textOut } : item))
    } catch (e) {
      const message = (e as Error).message
      setMsgs(m => m.map((item, i) => i === m.length - 1 ? { ...item, text: message } : item))
    } finally { setBusy(false); onDone?.() }
  }
  return { msgs, busy, send, clear: () => setMsgs([]) }
}

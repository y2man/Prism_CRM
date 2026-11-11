import { useEffect } from 'react'
export function useFX() {
  useEffect(() => {
    const tilt = (e: MouseEvent) => { const t = (e.target as HTMLElement).closest<HTMLElement>('.tilt'); if (!t) return; const r = t.getBoundingClientRect(); t.style.setProperty('--ry', ((e.clientX - r.left) / r.width - 0.5) * 9 + 'deg'); t.style.setProperty('--rx', -((e.clientY - r.top) / r.height - 0.5) * 9 + 'deg') }
    const reset = (e: Event) => { const t = e.target as HTMLElement; if (t.classList?.contains('tilt')) { t.style.setProperty('--rx', '0deg'); t.style.setProperty('--ry', '0deg') } }
    const ripple = (e: MouseEvent) => { const b = (e.target as HTMLElement).closest<HTMLElement>('button'); if (!b) return; const r = b.getBoundingClientRect(), s = document.createElement('span'); s.className = 'ripple'; s.style.left = e.clientX - r.left + 'px'; s.style.top = e.clientY - r.top + 'px'; b.appendChild(s); setTimeout(() => s.remove(), 650) }
    document.addEventListener('mousemove', tilt); document.addEventListener('mouseleave', reset, true); document.addEventListener('click', ripple)
    return () => { document.removeEventListener('mousemove', tilt); document.removeEventListener('mouseleave', reset, true); document.removeEventListener('click', ripple) }
  }, [])
}
export function Background() {
  const cube = (cls: string) => <div className={`fx-cubewrap ${cls}`} aria-hidden><div className="fx-cube">{[1, 2, 3, 4, 5, 6].map(i => <i key={i} />)}</div></div>
  return <div className="fx-bg" aria-hidden><span className="fx-orb o1" /><span className="fx-orb o2" /><span className="fx-orb o3" />{cube('c1')}{cube('c2')}{cube('c3')}</div>
}

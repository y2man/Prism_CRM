import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { money, stageLabel } from '../lib/api'
import { useCRM } from '../state/crm'
const COLORS = ['#8b9cf7', '#6b91ee', '#4d9fbd', '#a28be8', '#50b994', '#e38a8a']
export function Analytics() {
  const { stats } = useCRM(); if (!stats) return <p className='empty'>Loading…</p>
  const data = stats.by_stage.map(s => ({ ...s, name: stageLabel(s.stage) }))
  return <><div className='page-head'><div><h1>Analytics</h1><p className='subheading'>Live numbers from your CRM data.</p></div></div>
    <div className='metric-grid'>{[['Clients', String(stats.customers)], ['Open pipeline', money(stats.pipeline)], ['Won revenue', money(stats.won)], ['Win rate', stats.win_rate + '%']].map(([t, v]) => <article key={t} className='metric-card tilt'><div className='metric-top'><span>{t}</span></div><div className='metric-value'>{v}</div></article>)}</div>
    <div className='panel' style={{ marginTop: 18 }}><div className='panel-heading'><div><h2>Deal value by stage</h2><p>Hover a bar for details</p></div></div>
      <div style={{ height: 320 }}><ResponsiveContainer><BarChart data={data}><CartesianGrid strokeDasharray='3 5' vertical={false} stroke='var(--grid)' /><XAxis dataKey='name' axisLine={false} tickLine={false} tick={{ fill: 'var(--muted)', fontSize: 11 }} /><YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--muted)', fontSize: 11 }} tickFormatter={v => '$' + v / 1000 + 'k'} />
        <Tooltip cursor={{ fill: 'rgba(120,140,255,.08)' }} contentStyle={{ background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: 12 }} formatter={(v, _n, p) => [money(Number(v)), `${p.payload.count} deals`]} />
        <Bar dataKey='value' radius={[10, 10, 0, 0]}>{data.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}</Bar></BarChart></ResponsiveContainer></div></div></>
}

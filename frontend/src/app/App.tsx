import { useState } from 'react'
import {
  Activity,
  Bell,
  BriefcaseBusiness,
  ChevronDown,
  ChevronRight,
  Download,
  Menu,
  Moon,
  Plus,
  Search,
  Sparkles,
  Sun,
  Target,
  TrendingUp
} from 'lucide-react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis
} from 'recharts'
import { Sidebar } from '../components/layout/Sidebar'
import { AIAssistant } from '../components/dashboard/AIAssistant'
import { MetricCard } from '../components/dashboard/MetricCard'
import { Background, useFX } from '../components/fx/fx'
import { useTheme } from '../hooks/useTheme'
import { AuthGate, useAuth } from '../state/auth'
import { CRMProvider, useCRM } from '../state/crm'
import { ago, api, initials, json, money, stageLabel } from '../lib/api'
import { AddModal, type AddKind } from '../features/Forms'
import { Clients } from '../features/Clients'
import { Leads } from '../features/Leads'
import { Pipeline } from '../features/Pipeline'
import { Tasks } from '../features/Tasks'
import { Comms } from '../features/Comms'
import { Analytics } from '../features/Analytics'
import { Studio } from '../features/Studio'
import { Help, Settings } from '../features/Settings'
import type { NavKey } from '../types'

function Overview ({
  go,
  onAdd,
  name
}: {
  go: (k: NavKey) => void
  onAdd: (k: AddKind) => void
  name: string
}) {
  const { customers, tasks, activities, stats, reload, notify, loading } =
    useCRM()
  const [mode, setMode] = useState<'value' | 'count'>('value')
  if (loading || !stats) return <p className='empty'>Loading your workspace…</p>
  const top = customers
    .filter(c => !['won', 'lost'].includes(c.stage))
    .sort((a, b) => b.value - a.value)
    .slice(0, 4)
  const chart = stats.by_stage.slice(0, 5).map(s => ({
    name: stageLabel(s.stage),
    v: mode === 'value' ? s.value : s.count
  }))
  const exportCsv = () => {
    const rows = [
      ['Name', 'Company', 'Email', 'Stage', 'Value', 'Score'],
      ...customers.map(c => [
        c.name,
        c.company,
        c.email,
        c.stage,
        c.value,
        c.score
      ])
    ]
    const a = document.createElement('a')
    a.href = URL.createObjectURL(
      new Blob([rows.map(r => r.map(x => `"${x}"`).join(',')).join('\n')], {
        type: 'text/csv'
      })
    )
    a.download = 'prism-clients.csv'
    a.click()
    notify('Report downloaded.')
  }
  const toggleTask = async (id: number) => {
    try {
      await api(`/api/tasks/${id}/toggle`, json('POST'))
      await reload()
    } catch (e) {
      notify((e as Error).message)
    }
  }
  const max = Math.max(1, ...stats.by_stage.map(s => s.count))
  return (
    <>
      <section className='welcome-row'>
        <div>
          <div className='eyebrow'>
            {new Date()
              .toLocaleDateString(undefined, {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                year: 'numeric'
              })
              .toUpperCase()}
          </div>
          <h1 className='hero-title'>Welcome back, {name.split(' ')[0]}</h1>
          <p className='subheading'>
            Here's what's happening across your business today.
          </p>
        </div>
        <div className='welcome-actions'>
          <button className='button button-secondary' onClick={exportCsv}>
            <Download size={16} /> Export report
          </button>
          <button
            className='button button-primary'
            onClick={() => onAdd('client')}
          >
            <Plus size={17} /> Add new
          </button>
        </div>
      </section>
      <section className='metric-grid'>
        <MetricCard
          title='Won revenue'
          value={money(stats.won)}
          change='closed'
          note='all time'
          icon={<TrendingUp size={17} />}
          positive
        />
        <MetricCard
          title='Open pipeline'
          value={money(stats.pipeline)}
          change={`${stats.open_deals}`}
          note='open deals'
          icon={<BriefcaseBusiness size={17} />}
          positive
        />
        <MetricCard
          title='Clients & leads'
          value={String(stats.customers)}
          change='total'
          note='records'
          icon={<Target size={17} />}
          positive
        />
        <MetricCard
          title='Win rate'
          value={stats.win_rate + '%'}
          change='won ÷ closed'
          note=''
          icon={<Activity size={17} />}
          positive
        />
      </section>
      <section className='dashboard-grid'>
        <div className='panel revenue-panel tilt'>
          <div className='panel-heading'>
            <div>
              <h2>Pipeline by stage</h2>
              <p>Where your opportunities sit</p>
            </div>
            <button
              className='select-button'
              onClick={() => setMode(mode === 'value' ? 'count' : 'value')}
            >
              {mode === 'value' ? 'By value' : 'By count'}
              <ChevronDown size={14} />
            </button>
          </div>
          <div className='chart-wrap'>
            <ResponsiveContainer width='100%' height='100%'>
              <AreaChart
                data={chart}
                margin={{ top: 10, right: 8, left: -22, bottom: 0 }}
              >
                <defs>
                  <linearGradient id='rf' x1='0' y1='0' x2='0' y2='1'>
                    <stop offset='0%' stopColor='#7b8cff' stopOpacity={0.45} />
                    <stop offset='95%' stopColor='#7b8cff' stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray='3 5'
                  vertical={false}
                  stroke='var(--grid)'
                />
                <XAxis
                  dataKey='name'
                  padding={{ left: 24, right: 24 }}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'var(--muted)', fontSize: 11 }}
                  dy={10}
                />
                <Tooltip
                  contentStyle={{
                    background: 'var(--panel)',
                    border: '1px solid var(--border)',
                    borderRadius: 12,
                    color: 'var(--text)'
                  }}
                  formatter={v => [
                    mode === 'value' ? money(Number(v)) : v,
                    mode === 'value' ? 'Value' : 'Deals'
                  ]}
                />
                <Area
                  type='monotone'
                  dataKey='v'
                  stroke='#7b8cff'
                  strokeWidth={2.5}
                  fill='url(#rf)'
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className='panel velocity-panel tilt'>
          <div className='panel-heading'>
            <div>
              <h2>Win rate</h2>
              <p>Won vs. lost deals</p>
            </div>
          </div>
          <div className='donut-wrap'>
            <div
              className='ring'
              style={{
                background: `conic-gradient(#7b8cff ${
                  stats.win_rate * 3.6
                }deg, rgba(130,140,180,.2) 0)`
              }}
            >
              <div>
                <strong>{stats.win_rate}%</strong>
                <small>of closed deals</small>
              </div>
            </div>
          </div>
          <div className='mini-stats'>
            <div>
              <span className='legend-dot blue' /> Won{' '}
              <b>{stats.by_stage.find(s => s.stage === 'won')?.count ?? 0}</b>
            </div>
            <div>
              <span className='legend-dot orange' /> Open{' '}
              <b>{stats.open_deals}</b>
            </div>
          </div>
        </div>
      </section>
      <section className='lower-grid'>
        <div className='panel leads-panel'>
          <div className='panel-heading'>
            <div>
              <h2>Priority leads</h2>
              <p>Your biggest open opportunities</p>
            </div>
            <button className='text-action' onClick={() => go('Leads')}>
              View all <ChevronRight size={14} />
            </button>
          </div>
          <div className='table-scroll'>
            <table>
              <thead>
                <tr>
                  <th>CONTACT</th>
                  <th>STAGE</th>
                  <th>VALUE</th>
                  <th>SCORE</th>
                </tr>
              </thead>
              <tbody>
                {top.map(c => (
                  <tr
                    key={c.id}
                    className='click-row'
                    onClick={() => go('Clients')}
                  >
                    <td>
                      <div className='contact-cell'>
                        <span className='avatar avatar-green'>
                          {initials(c.name)}
                        </span>
                        <span>
                          <b>{c.name}</b>
                          <small>{c.company}</small>
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className={`stage-pill stage-${c.stage}`}>
                        {stageLabel(c.stage)}
                      </span>
                    </td>
                    <td className='value-cell'>{money(c.value)}</td>
                    <td>{c.score}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className='panel tasks-panel'>
          <div className='panel-heading'>
            <div>
              <h2>Upcoming tasks</h2>
              <p>Tick to complete</p>
            </div>
            <button
              className='text-action'
              onClick={() => go('Tasks & calendar')}
            >
              See all <ChevronRight size={14} />
            </button>
          </div>
          <div className='task-list'>
            {tasks.slice(0, 4).map(t => (
              <label
                className={`task-row ${t.done ? 'task-done' : ''}`}
                key={t.id}
              >
                <input
                  type='checkbox'
                  checked={t.done}
                  onChange={() => toggleTask(t.id)}
                />
                <span className='task-copy'>
                  <b>{t.title}</b>
                  <small>{t.detail}</small>
                </span>
                <span className='task-time'>{t.due}</span>
              </label>
            ))}
            {!tasks.length && <p className='empty'>No tasks.</p>}
          </div>
        </div>
      </section>
      <section className='bottom-grid'>
        <div className='panel activity-panel'>
          <div className='panel-heading'>
            <div>
              <h2>Recent activity</h2>
              <p>Latest changes in your workspace</p>
            </div>
          </div>
          <div className='activity-list'>
            {activities.slice(0, 5).map(a => (
              <div className='activity-row' key={a.id}>
                <span className='activity-icon activity-blue'>
                  <Sparkles size={15} />
                </span>
                <span className='activity-copy'>
                  <b>{a.title}</b>
                  <small>{a.detail}</small>
                </span>
                <time>{ago(a.created)}</time>
              </div>
            ))}
          </div>
        </div>
        <div className='panel pipeline-panel'>
          <div className='panel-heading'>
            <div>
              <h2>Pipeline snapshot</h2>
              <p>Opportunities by stage</p>
            </div>
            <button
              className='text-action'
              onClick={() => go('Sales pipeline')}
            >
              Open pipeline <ChevronRight size={14} />
            </button>
          </div>
          {stats.by_stage.slice(0, 5).map((p, i) => (
            <div className='pipeline-row' key={p.stage}>
              <div>
                <span>{stageLabel(p.stage)}</span>
                <b>{p.count}</b>
              </div>
              <div className='pipeline-track'>
                <i
                  style={{
                    width: `${(p.count / max) * 100}%`,
                    background: [
                      '#8b9cf7',
                      '#6b91ee',
                      '#4d9fbd',
                      '#a28be8',
                      '#50b994'
                    ][i]
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  )
}

function WorkspaceHome ({ go, name }: { go: (k: NavKey) => void; name: string }) {
  const { stats, tasks, loading } = useCRM()
  if (loading || !stats) return <p className='empty'>Loading your workspace…</p>
  const pending = tasks.filter(t => !t.done).length
  const links: { key: NavKey; note: string }[] = [
    { key: 'Overview', note: 'Dashboard & key metrics' },
    { key: 'Clients', note: `${stats.customers} records` },
    { key: 'Leads', note: 'New and contacted prospects' },
    { key: 'Sales pipeline', note: `${stats.open_deals} open deals` },
    { key: 'Tasks & calendar', note: `${pending} pending tasks` },
    { key: 'Communications', note: 'Messages & activity' },
    { key: 'Analytics', note: 'Reports & trends' },
    { key: 'AI Studio', note: 'Build with Prism AI' },
    { key: 'Settings', note: 'Workspace preferences' }
  ]
  return (
    <>
      <section className='welcome'>
        <div>
          <h1 className='hero-title'>Workspace</h1>
          <p className='subheading'>
            {name}'s workspace · jump to any section
          </p>
        </div>
      </section>
      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
          gap: 16
        }}
      >
        {links.map(l => (
          <button
            key={l.key}
            className='panel'
            style={{ textAlign: 'left', cursor: 'pointer', color: 'inherit' }}
            onClick={() => go(l.key)}
          >
            <strong>{l.key}</strong>
            <p className='subheading'>{l.note}</p>
          </button>
        ))}
      </section>
    </>
  )
}

function Shell () {
  const { user, signOut } = useAuth()
  useFX()
  const [active, setActive] = useState<NavKey>('Overview')
  const [dark, toggleTheme] = useTheme()
  const [assistantOpen, setAssistantOpen] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [adding, setAdding] = useState<AddKind | null>(null)
  const { search, setSearch, toast, notify, tasks, error } = useCRM()
  const pending = tasks.filter(t => !t.done).length
  const page = {
    Workspace: <WorkspaceHome go={setActive} name={user.name} />,
    Overview: <Overview go={setActive} name={user.name} onAdd={k => setAdding(k)} />,
    Clients: <Clients onAdd={() => setAdding('client')} />,
    Leads: <Leads onAdd={() => setAdding('lead')} />,
    'Sales pipeline': <Pipeline />,
    'Tasks & calendar': <Tasks onAdd={() => setAdding('task')} />,
    Communications: <Comms />,
    Analytics: <Analytics />,
    'AI Studio': <Studio />,
    Settings: <Settings dark={dark} toggle={toggleTheme} />,
    'Help & support': <Help />
  }[active]
  return (
    <div className={`app-shell ${collapsed ? 'collapsed' : ''}`}>
      <Background />
      <Sidebar
        active={active}
        user={user}
        onSignOut={signOut}
        onNavigate={setActive}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <main className='main-area'>
        <header className='topbar'>
          <div className='topbar-left'>
            <button
              className='icon-btn'
              onClick={() =>
                window.innerWidth <= 900
                  ? setSidebarOpen(true)
                  : setCollapsed(c => !c)
              }
              aria-label='Toggle navigation'
            >
              <Menu size={19} />
            </button>
            <div className='breadcrumb'>
              {active === 'Workspace' ? (
                <strong>Workspace</strong>
              ) : (
                <>
                  <button
                    className='crumb'
                    onClick={() => setActive('Workspace')}
                  >
                    Workspace
                  </button>
                  <ChevronRight size={14} />
                  <strong>{active}</strong>
                </>
              )}
            </div>
          </div>
          <div className='topbar-actions'>
            <label className='searchbox'>
              <Search size={16} />
              <input
                placeholder='Search clients…'
                value={search}
                onChange={e => {
                  setSearch(e.target.value)
                  if (
                    e.target.value &&
                    !['Clients', 'Leads', 'Sales pipeline'].includes(active)
                  )
                    setActive('Clients')
                }}
              />
            </label>
            <button
              className='icon-btn'
              aria-label='Notifications'
              onClick={() => {
                setActive('Tasks & calendar')
                notify(
                  pending
                    ? `${pending} open task${pending > 1 ? 's' : ''}.`
                    : 'You are all caught up.'
                )
              }}
            >
              <Bell size={18} />
              {pending > 0 && <i className='notification-dot' />}
            </button>
            <button
              className='icon-btn'
              aria-label='Toggle theme'
              onClick={toggleTheme}
            >
              {dark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button
              className='profile-button'
              onClick={() => setActive('Settings')}
            >
              <span className='avatar avatar-blue'>{user.name.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase()}</span>
              <span className='profile-copy'>
                <b>{user.name}</b>
                <small>Workspace owner</small>
              </span>
              <ChevronDown size={14} />
            </button>
          </div>
        </header>
        <div className='content-wrap'>
          {error && <div className='banner'>{error}</div>}
          {page}
        </div>
      </main>
      {assistantOpen && <AIAssistant onClose={() => setAssistantOpen(false)} />}
      {!assistantOpen && (
        <button
          className='assistant-fab'
          onClick={() => setAssistantOpen(true)}
          aria-label='Open Prism AI'
        >
          <Sparkles size={20} />
        </button>
      )}
      {adding && <AddModal kind={adding} onClose={() => setAdding(null)} />}
      {toast && <div className='toast'>{toast}</div>}
    </div>
  )
}
export default function App () {
  return (
    <AuthGate>{() => <CRMProvider><Shell /></CRMProvider>}</AuthGate>
  )
}

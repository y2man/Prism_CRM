export type NavKey =
  | 'Workspace'
  | 'Overview'
  | 'Clients'
  | 'Leads'
  | 'Sales pipeline'
  | 'Tasks & calendar'
  | 'Communications'
  | 'Analytics'
  | 'AI Studio'
  | 'Settings'
  | 'Help & support'
export const STAGES = [
  'lead',
  'contacted',
  'qualified',
  'proposal',
  'won',
  'lost'
] as const
export type Stage = typeof STAGES[number]
export type Customer = {
  id: number
  name: string
  company: string
  email: string | null
  value: number
  stage: Stage
  last_contact: string
  last_contact_date: string | null
  notes: string
  score: number
}
export type Task = {
  id: number
  title: string
  detail: string
  due: string
  done: boolean
}
export type Activity = {
  id: number
  title: string
  detail: string
  created: string
}
export type Stats = {
  customers: number
  open_deals: number
  pipeline: number
  won: number
  win_rate: number
  by_stage: { stage: Stage; count: number; value: number }[]
}

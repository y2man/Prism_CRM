import type { ReactNode } from 'react';
import { ArrowUpRight } from 'lucide-react';
export function MetricCard({title,value,change,note,icon,positive}:{title:string;value:string;change:string;note:string;icon:ReactNode;positive?:boolean}) { return <article className="metric-card"><div className="metric-top"><span>{title}</span><span className="metric-icon">{icon}</span></div><div className="metric-value">{value}</div><div className="metric-foot"><span className={positive?'positive-text':'negative-text'}><ArrowUpRight size={14}/>{change}</span><span>{note}</span></div></article> }

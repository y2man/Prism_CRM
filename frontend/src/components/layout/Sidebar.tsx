
import { useState } from 'react';
import {
  BarChart3,
  BriefcaseBusiness,
  CalendarDays,
  ChevronDown,
  CircleHelp,
  LayoutDashboard,
  MessageSquare,
  Settings,
  Sparkles,
  Target,
  Users,
  X,
  MoreHorizontal
} from 'lucide-react';

import type { NavKey } from '../../types';
import type { User } from '../../state/auth';

const items: { key: NavKey; icon: any }[] = [
  { key: 'Overview', icon: LayoutDashboard },
  { key: 'Clients', icon: Users },
  { key: 'Leads', icon: Target },
  { key: 'Sales pipeline', icon: BriefcaseBusiness },
  { key: 'Tasks & calendar', icon: CalendarDays },
  { key: 'Communications', icon: MessageSquare },
  { key: 'Analytics', icon: BarChart3 },
  { key: 'AI Studio', icon: Sparkles }
];

export function Sidebar({
  active,
  onNavigate,
  open,
  onClose,
  user,
  onSignOut
}: {
  active: NavKey;
  onNavigate: (v: NavKey) => void;
  open: boolean;
  onClose: () => void;
  user: User;
  onSignOut: () => void;
}) {
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);

  return (
    <>
      <div
        className={`sidebar-backdrop ${open ? 'show' : ''}`}
        onClick={onClose}
      />

      <aside className={`sidebar ${open ? 'sidebar-open' : ''}`}>
        <div className="brand-row">
          <div className="brand-mark">
            <img src="/prism-icon-180.png" alt="Prism CRM" />
          </div>
          <span>
            prism<span className="brand-light">.</span>
          </span>
          <button className="icon-btn sidebar-close" onClick={onClose}>
            <X size={17} />
          </button>
        </div>

        


        <div className="nav-label">WORKSPACE</div>

        <nav className="side-nav">
          {items.map(({ key, icon: Icon }) => (
            <button
              key={key}
              onClick={() => {
                onNavigate(key);
                onClose();
              }}
              className={`nav-item ${active === key ? 'active' : ''}`}
            >
              <Icon size={18} />
              <span>{key}</span>
              {key === 'AI Studio' && (
                <span className="new-tag">NEW</span>
              )}
            </button>
          ))}
        </nav>

        <div className="sidebar-upgrade">
          <div className="upgrade-icon">
            <Sparkles size={17} />
          </div>
          <b>Make more happen</b>
          <p>Unlock deeper insights and team workflows.</p>
          <button onClick={() => onNavigate('AI Studio')}>
            Explore Prism AI <span>↗</span>
          </button>
        </div>

        <div className="sidebar-bottom">
          <button
            className={`nav-item ${active === 'Settings' ? 'active' : ''}`}
            onClick={() => {
              onNavigate('Settings' as NavKey);
              onClose();
            }}
          >
            <Settings size={18} />
            <span>Settings</span>
          </button>

          <button
            className={`nav-item ${active === 'Help & support' ? 'active' : ''}`}
            onClick={() => {
              onNavigate('Help & support' as NavKey);
              onClose();
            }}
          >
            <CircleHelp size={18} />
            <span>Help & support</span>
          </button>

          <div className="sidebar-user">
            <span className="avatar avatar-blue">{user.name.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase()}</span>

            <span className="sidebar-user-copy">
              <b>{user.name}</b>
              <small>{user.email}</small>
            </span>

            <button
              className="more-btn"
              aria-label="Open account menu"
              aria-expanded={accountMenuOpen}
              onClick={() => setAccountMenuOpen(!accountMenuOpen)}
            >
              <MoreHorizontal size={20} />
            </button>

            {accountMenuOpen && (
              <div className="account-menu">
                <div className="account-menu-heading">
                  <b>{user.name}</b>
                  <small>{user.email}</small>
                </div>
                <div className="account-menu-divider" />
                <button className="account-menu-close" onClick={() => { setAccountMenuOpen(false); onSignOut() }}>
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}

import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Workflow, Key, ScrollText, LayoutTemplate, Plug, Bell, Settings, ChevronLeft, ChevronRight, Zap } from 'lucide-react'
import useUiStore   from '../../store/uiStore'
import useAuthStore from '../../store/authStore'

const NAV = [
  { to: '/',              icon: LayoutDashboard, label: 'Dashboard'    },
  { to: '/workflows',     icon: Workflow,        label: 'Workflows'    },
  { to: '/credentials',  icon: Key,             label: 'Credentials'  },
  { to: '/logs',          icon: ScrollText,      label: 'Logs'         },
  { to: '/templates',     icon: LayoutTemplate,  label: 'Templates'    },
  { to: '/integrations',  icon: Plug,            label: 'Integrations' },
  { to: '/notifications', icon: Bell,            label: 'Notifications'},
  { to: '/settings',      icon: Settings,        label: 'Settings'     },
]

export default function Sidebar() {
  const { sidebarOpen, toggleSidebar } = useUiStore()
  const user = useAuthStore(s => s.user)

  return (
    <aside style={{
      position: 'fixed', left: 0, top: 0, height: '100%', zIndex: 50,
      width: sidebarOpen ? '240px' : '64px',
      background: '#0f172a',
      borderRight: '1px solid rgba(255,255,255,0.06)',
      display: 'flex', flexDirection: 'column',
      transition: 'width 0.25s cubic-bezier(0.4,0,0.2,1)',
      overflow: 'hidden',
    }}>
      {/* Logo */}
      <div style={{
        display: 'flex', alignItems: 'center',
        justifyContent: sidebarOpen ? 'space-between' : 'center',
        padding: sidebarOpen ? '20px 16px 20px 20px' : '20px 0',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        minHeight: '68px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
          <div style={{
            minWidth: '32px', width: '32px', height: '32px',
            background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
            borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 20px #3b82f640',
          }}>
            <Zap size={16} color="white" fill="white" />
          </div>
          {sidebarOpen && (
            <span style={{ fontWeight: '700', fontSize: '16px', color: 'white', whiteSpace: 'nowrap', letterSpacing: '-0.3px' }}>
              FlowBridge
            </span>
          )}
        </div>
        {sidebarOpen && (
          <button onClick={toggleSidebar} style={{
            background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: '8px',
            padding: '6px', cursor: 'pointer', color: '#64748b',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'background 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}>
            <ChevronLeft size={16} />
          </button>
        )}
        {!sidebarOpen && (
          <button onClick={toggleSidebar} style={{
            position: 'absolute', right: '-1px', top: '22px',
            background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '0 8px 8px 0', padding: '6px 4px',
            cursor: 'pointer', color: '#64748b',
          }}>
            <ChevronRight size={14} />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '12px 8px', overflowY: 'auto' }}>
        {NAV.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} end={to === '/'} style={({ isActive }) => ({
            display: 'flex', alignItems: 'center',
            gap: '10px', padding: '10px 12px',
            borderRadius: '10px', marginBottom: '2px',
            textDecoration: 'none', transition: 'all 0.15s',
            background: isActive ? 'linear-gradient(135deg, #3b82f620, #6366f120)' : 'transparent',
            color: isActive ? '#60a5fa' : '#94a3b8',
            border: isActive ? '1px solid #3b82f630' : '1px solid transparent',
            justifyContent: sidebarOpen ? 'flex-start' : 'center',
          })}
          onMouseEnter={e => { if (!e.currentTarget.style.background.includes('gradient')) e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
          onMouseLeave={e => { if (!e.currentTarget.style.background.includes('gradient')) e.currentTarget.style.background = 'transparent'; }}
          >
            <Icon size={18} style={{ minWidth: '18px' }} />
            {sidebarOpen && <span style={{ fontSize: '13.5px', fontWeight: '500', whiteSpace: 'nowrap' }}>{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* User */}
      {user && (
        <div style={{
          padding: sidebarOpen ? '12px 16px' : '12px 8px',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', alignItems: 'center', gap: '10px',
          justifyContent: sidebarOpen ? 'flex-start' : 'center',
        }}>
          <div style={{
            minWidth: '32px', width: '32px', height: '32px',
            background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
            borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '13px', fontWeight: '700', color: 'white', flexShrink: 0,
          }}>
            {user.name?.[0]?.toUpperCase()}
          </div>
          {sidebarOpen && (
            <div style={{ overflow: 'hidden' }}>
              <p style={{ fontSize: '13px', fontWeight: '600', color: '#e2e8f0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.name}</p>
              <p style={{ fontSize: '11px', color: '#475569', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.email}</p>
            </div>
          )}
        </div>
      )}
    </aside>
  )
}

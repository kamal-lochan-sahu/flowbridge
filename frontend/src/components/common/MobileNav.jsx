import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Workflow, ScrollText, Key, Settings } from 'lucide-react'

const NAV = [
  { to:'/',             icon:LayoutDashboard, label:'Home'      },
  { to:'/workflows',    icon:Workflow,        label:'Workflows' },
  { to:'/logs',         icon:ScrollText,      label:'Logs'      },
  { to:'/credentials',  icon:Key,             label:'Keys'      },
  { to:'/settings',     icon:Settings,        label:'Settings'  },
]

export default function MobileNav() {
  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100,
      background: '#0f172a',
      borderTop: '1px solid rgba(255,255,255,0.08)',
      display: 'flex', alignItems: 'stretch',
      paddingBottom: 'env(safe-area-inset-bottom)',
      boxShadow: '0 -4px 20px rgba(0,0,0,0.3)',
    }}>
      {NAV.map(({ to, icon:Icon, label }) => (
        <NavLink key={to} to={to} end={to==='/'} style={({ isActive }) => ({
          flex: 1, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          padding: '10px 4px 10px',
          textDecoration: 'none',
          color: isActive ? '#60a5fa' : '#475569',
          transition: 'color 0.15s',
          gap: '3px',
          background: isActive ? 'rgba(59,130,246,0.08)' : 'transparent',
        })}>
          <Icon size={20} />
          <span style={{ fontSize:'10px', fontWeight:'600', letterSpacing:'0.3px' }}>{label}</span>
        </NavLink>
      ))}
    </nav>
  )
}

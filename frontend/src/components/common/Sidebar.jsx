import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, Workflow, Key, ScrollText,
  LayoutTemplate, Plug, Bell, Settings, ChevronLeft, ChevronRight, Zap
} from 'lucide-react'
import useUiStore    from '../../store/uiStore'
import useAuthStore  from '../../store/authStore'

const NAV = [
  { to: '/',              icon: LayoutDashboard, label: 'Dashboard'     },
  { to: '/workflows',     icon: Workflow,        label: 'Workflows'     },
  { to: '/credentials',  icon: Key,             label: 'Credentials'   },
  { to: '/logs',          icon: ScrollText,      label: 'Logs'          },
  { to: '/templates',     icon: LayoutTemplate,  label: 'Templates'     },
  { to: '/integrations',  icon: Plug,            label: 'Integrations'  },
  { to: '/notifications', icon: Bell,            label: 'Notifications' },
  { to: '/settings',      icon: Settings,        label: 'Settings'      },
]

export default function Sidebar() {
  const { sidebarOpen, toggleSidebar } = useUiStore()
  const user = useAuthStore(s => s.user)
  const location = useLocation()

  return (
    <aside className={`fixed left-0 top-0 h-full bg-gray-900 text-white transition-all duration-300 z-50 flex flex-col ${sidebarOpen ? 'w-64' : 'w-16'}`}>

      {/* Logo */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
            <Zap size={16} className="text-white" />
          </div>
          {sidebarOpen && <span className="font-bold text-lg">FlowBridge</span>}
        </div>
        <button onClick={toggleSidebar} className="text-gray-400 hover:text-white transition-colors">
          {sidebarOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
        </button>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 py-4 overflow-y-auto">
        {NAV.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 mx-2 rounded-lg transition-colors mb-1 ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`
            }
          >
            <Icon size={20} className="flex-shrink-0" />
            {sidebarOpen && <span className="text-sm font-medium">{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* User */}
      {user && (
        <div className="p-4 border-t border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-bold">{user.name?.[0]?.toUpperCase()}</span>
            </div>
            {sidebarOpen && (
              <div className="overflow-hidden">
                <p className="text-sm font-medium truncate">{user.name}</p>
                <p className="text-xs text-gray-400 truncate">{user.email}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </aside>
  )
}

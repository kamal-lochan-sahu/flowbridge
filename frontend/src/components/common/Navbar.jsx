import { Bell, LogOut, Menu } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useQuery }    from '@tanstack/react-query'
import useAuthStore    from '../../store/authStore'
import useUiStore      from '../../store/uiStore'
import { useAuth }     from '../../hooks/useAuth'
import api             from '../../services/api'
import { KEYS }        from '../../config/queryKeys'

export default function Navbar() {
  const { logout }      = useAuth()
  const user            = useAuthStore(s => s.user)
  const toggleSidebar   = useUiStore(s => s.toggleSidebar)
  const navigate        = useNavigate()

  const { data: unread } = useQuery({
    queryKey: KEYS.UNREAD_COUNT,
    queryFn:  () => api.get('/notifications/unread-count').then(r => r.data.data.count),
    refetchInterval: 30000,
  })

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <h1 className="text-lg font-semibold text-gray-800">
          {user?.branding?.companyName || 'FlowBridge'}
        </h1>
      </div>

      <div className="flex items-center gap-3">
        {/* Notifications */}
        <button
          onClick={() => navigate('/notifications')}
          className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <Bell size={20} />
          {unread > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </button>

        {/* Logout */}
        <button
          onClick={logout}
          className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          <LogOut size={16} />
          <span>Logout</span>
        </button>
      </div>
    </header>
  )
}

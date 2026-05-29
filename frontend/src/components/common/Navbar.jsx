import { Bell, LogOut, Menu, X } from 'lucide-react'
import { useState }  from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery }  from '@tanstack/react-query'
import useAuthStore  from '../../store/authStore'
import useUiStore    from '../../store/uiStore'
import { useAuth }   from '../../hooks/useAuth'
import api           from '../../services/api'
import { KEYS }      from '../../config/queryKeys'
import Sidebar       from './Sidebar'

export default function Navbar() {
  const { logout }      = useAuth()
  const user            = useAuthStore(s => s.user)
  const { toggleSidebar } = useUiStore()
  const navigate        = useNavigate()
  const [mobileMenu, setMobileMenu] = useState(false)

  const { data: unread } = useQuery({
    queryKey: KEYS.UNREAD_COUNT,
    queryFn:  () => api.get('/notifications/unread-count').then(r => r.data.data.count),
    refetchInterval: 30000,
  })

  return (
    <>
      <header style={{
        height: '56px', background: 'white',
        borderBottom: '1px solid #f1f5f9',
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        flexShrink: 0,
      }}>
        {/* Left */}
        <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
          {/* Desktop toggle */}
          <button onClick={toggleSidebar} className="hide-mobile" style={{
            background:'none', border:'none', cursor:'pointer', color:'#64748b',
            padding:'6px', borderRadius:'8px', display:'flex',
          }}>
            <Menu size={18} />
          </button>

          <span style={{ fontSize:'15px', fontWeight:'700', color:'#0f172a' }}>
            {user?.branding?.companyName || 'FlowBridge'}
          </span>
          <span style={{
            fontSize:'10px', fontWeight:'700', color:'#3b82f6',
            background:'#eff6ff', padding:'2px 7px', borderRadius:'99px',
            border:'1px solid #bfdbfe', textTransform:'uppercase', letterSpacing:'0.5px',
          }}>
            {user?.plan || 'free'}
          </span>
        </div>

        {/* Right */}
        <div style={{ display:'flex', alignItems:'center', gap:'4px' }}>
          <button onClick={() => navigate('/notifications')} style={{
            position:'relative', padding:'8px', background:'none',
            border:'none', cursor:'pointer', color:'#64748b',
            borderRadius:'10px', display:'flex',
          }}>
            <Bell size={18} />
            {unread > 0 && (
              <span style={{
                position:'absolute', top:'5px', right:'5px',
                width:'16px', height:'16px', background:'#ef4444',
                color:'white', fontSize:'9px', fontWeight:'700',
                borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center',
              }}>
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </button>

          <button onClick={logout} className="hide-mobile" style={{
            display:'flex', alignItems:'center', gap:'6px', padding:'7px 12px',
            background:'none', border:'none', cursor:'pointer', color:'#64748b',
            borderRadius:'10px', fontSize:'13px', fontWeight:'500',
          }}
          onMouseEnter={e => { e.currentTarget.style.background='#fef2f2'; e.currentTarget.style.color='#ef4444'; }}
          onMouseLeave={e => { e.currentTarget.style.background='none'; e.currentTarget.style.color='#64748b'; }}>
            <LogOut size={15} />
            Logout
          </button>
        </div>
      </header>
    </>
  )
}

import { Outlet }  from 'react-router-dom'
import { useState } from 'react'
import Sidebar      from './Sidebar'
import Navbar       from './Navbar'
import MobileNav    from './MobileNav'
import useUiStore   from '../../store/uiStore'

export default function Layout() {
  const sidebarOpen = useUiStore(s => s.sidebarOpen)
  const [isMobile]  = useState(() => window.innerWidth < 768)

  return (
    <div style={{ display:'flex', height:'100vh', overflow:'hidden', background:'#f8fafc' }}>
      {/* Desktop Sidebar */}
      <div className="hide-mobile">
        <Sidebar />
      </div>

      {/* Main Content */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden',
        marginLeft: isMobile ? 0 : (sidebarOpen ? '240px' : '64px'),
        transition: 'margin-left 0.25s cubic-bezier(0.4,0,0.2,1)',
      }}>
        <Navbar />
        <main style={{
          flex: 1, overflowY: 'auto',
          padding: isMobile ? '16px 16px 80px' : '28px',
        }}>
          <Outlet />
        </main>
      </div>

      {/* Mobile Bottom Nav */}
      <div className="show-mobile-only">
        <MobileNav />
      </div>
    </div>
  )
}

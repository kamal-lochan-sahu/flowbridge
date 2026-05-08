import { Outlet }   from 'react-router-dom'
import Sidebar       from './Sidebar'
import Navbar        from './Navbar'
import useUiStore    from '../../store/uiStore'

export default function Layout() {
  const sidebarOpen = useUiStore(s => s.sidebarOpen)
  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#f8fafc' }}>
      <Sidebar />
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden',
        marginLeft: sidebarOpen ? '240px' : '64px',
        transition: 'margin-left 0.25s cubic-bezier(0.4,0,0.2,1)',
      }}>
        <Navbar />
        <main style={{ flex: 1, overflowY: 'auto', padding: '28px' }}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import useAuthStore from './store/authStore'

// Layout
import Layout from './components/common/Layout'

// Auth Pages
import Login    from './pages/Login'
import Register from './pages/Register'

// App Pages
import Dashboard     from './pages/Dashboard'
import Workflows     from './pages/Workflows'
import WorkflowBuilder from './pages/WorkflowBuilder'
import Credentials   from './pages/Credentials'
import Logs          from './pages/Logs'
import LogDetail     from './pages/LogDetail'
import Templates     from './pages/Templates'
import Integrations  from './pages/Integrations'
import Notifications from './pages/Notifications'
import Settings      from './pages/Settings'

const PrivateRoute = ({ children }) => {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated)
  return isAuthenticated ? children : <Navigate to="/login" replace />
}

const PublicRoute = ({ children }) => {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated)
  return !isAuthenticated ? children : <Navigate to="/" replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/login"    element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

        {/* Private */}
        <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
          <Route index                    element={<Dashboard />} />
          <Route path="workflows"         element={<Workflows />} />
          <Route path="workflows/new"     element={<WorkflowBuilder />} />
          <Route path="workflows/:id"     element={<WorkflowBuilder />} />
          <Route path="credentials"       element={<Credentials />} />
          <Route path="logs"              element={<Logs />} />
          <Route path="logs/:id"          element={<LogDetail />} />
          <Route path="templates"         element={<Templates />} />
          <Route path="integrations"      element={<Integrations />} />
          <Route path="notifications"     element={<Notifications />} />
          <Route path="settings"          element={<Settings />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

import { useQuery } from '@tanstack/react-query'
import api from '../services/api'
import { SERVICE_ICONS } from '../utils/constants'
import Loader from '../components/common/Loader'
import Badge  from '../components/ui/Badge'
import Card   from '../components/ui/Card'

export default function Integrations() {
  const { data, isLoading } = useQuery({
    queryKey: ['integrations'],
    queryFn:  () => api.get('/integrations').then(r => r.data.data.integrations),
  })

  if (isLoading) return <Loader />

  const phase1 = (data || []).filter(i => i.phase === 1)
  const phase2 = (data || []).filter(i => i.phase === 2)

  const IntCard = ({ integration: i }) => (
    <Card className="p-5">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-xl">
            {SERVICE_ICONS[i.service] || '🔌'}
          </div>
          <div>
            <p className="font-semibold text-gray-900">{i.displayName}</p>
            <p className="text-xs text-gray-500">{i.category}</p>
          </div>
        </div>
        <div className="flex gap-1">
          <Badge variant={i.authType === 'none' ? 'default' : 'info'}>{i.authType}</Badge>
          <Badge variant={i.phase === 1 ? 'success' : 'warning'}>Phase {i.phase}</Badge>
        </div>
      </div>
      {i.actions?.length > 0 && (
        <div>
          <p className="text-xs font-medium text-gray-500 mb-1">Actions</p>
          <div className="flex flex-wrap gap-1">
            {i.actions.map(a => <Badge key={a.actionType} variant="default">{a.label}</Badge>)}
          </div>
        </div>
      )}
      {i.triggers?.length > 0 && (
        <div className="mt-2">
          <p className="text-xs font-medium text-gray-500 mb-1">Triggers</p>
          <div className="flex flex-wrap gap-1">
            {i.triggers.map(t => <Badge key={t.event} variant="purple">{t.label}</Badge>)}
          </div>
        </div>
      )}
    </Card>
  )

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Integrations</h1>
        <p className="text-gray-500 text-sm mt-1">All available services and connectors</p>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-gray-800 mb-4">⚡ Phase 1 — Available Now</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {phase1.map(i => <IntCard key={i.service} integration={i} />)}
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-gray-800 mb-4">🚀 Phase 2 — Coming Soon</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {phase2.map(i => <IntCard key={i.service} integration={i} />)}
        </div>
      </div>
    </div>
  )
}

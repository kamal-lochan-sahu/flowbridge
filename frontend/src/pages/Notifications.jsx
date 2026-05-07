import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { CheckCheck } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../services/api'
import { KEYS } from '../config/queryKeys'
import { timeAgo } from '../utils/formatDate'
import Loader     from '../components/common/Loader'
import EmptyState from '../components/common/EmptyState'
import Button     from '../components/ui/Button'
import Badge      from '../components/ui/Badge'
import Card       from '../components/ui/Card'

export default function Notifications() {
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: KEYS.NOTIFICATIONS,
    queryFn:  () => api.get('/notifications').then(r => r.data.data),
  })

  const markAllMutation = useMutation({
    mutationFn: () => api.put('/notifications/read-all'),
    onSuccess:  () => {
      queryClient.invalidateQueries({ queryKey: KEYS.NOTIFICATIONS })
      queryClient.invalidateQueries({ queryKey: KEYS.UNREAD_COUNT })
      toast.success('All marked as read')
    },
  })

  const markOneMutation = useMutation({
    mutationFn: (id) => api.put(`/notifications/${id}/read`),
    onSuccess:  () => {
      queryClient.invalidateQueries({ queryKey: KEYS.NOTIFICATIONS })
      queryClient.invalidateQueries({ queryKey: KEYS.UNREAD_COUNT })
    },
  })

  const notifications = data || []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-500 text-sm mt-1">{notifications.length} notifications</p>
        </div>
        {notifications.length > 0 && (
          <Button variant="secondary" icon={CheckCheck} onClick={() => markAllMutation.mutate()}>
            Mark all read
          </Button>
        )}
      </div>

      {isLoading ? <Loader /> : !notifications.length ? (
        <EmptyState icon="🔔" title="No notifications" description="You're all caught up!" />
      ) : (
        <Card>
          <div className="divide-y divide-gray-100">
            {notifications.map(n => (
              <div key={n._id}
                onClick={() => !n.isRead && markOneMutation.mutate(n._id)}
                className={`p-4 transition-colors ${!n.isRead ? 'bg-blue-50 cursor-pointer hover:bg-blue-100' : 'hover:bg-gray-50'}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    {!n.isRead && <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />}
                    <div>
                      <p className="text-sm font-medium text-gray-900">{n.title}</p>
                      <p className="text-sm text-gray-500 mt-0.5">{n.message}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <Badge variant={n.type === 'workflow_failed' ? 'danger' : n.type === 'workflow_success' ? 'success' : 'info'}>
                      {n.type.replace('_',' ')}
                    </Badge>
                    <span className="text-xs text-gray-400">{timeAgo(n.createdAt)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}

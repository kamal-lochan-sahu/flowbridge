import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { RefreshCw, Trash2, ChevronRight } from 'lucide-react'
import toast from 'react-hot-toast'
import { logService } from '../services/log.service'
import { KEYS } from '../config/queryKeys'
import { formatDate, formatDuration } from '../utils/formatDate'
import Loader     from '../components/common/Loader'
import EmptyState from '../components/common/EmptyState'
import Button     from '../components/ui/Button'
import Badge      from '../components/ui/Badge'
import Card       from '../components/ui/Card'

export default function Logs() {
  const navigate    = useNavigate()
  const queryClient = useQueryClient()
  const [status, setStatus] = useState('')
  const [page, setPage]     = useState(1)

  const { data, isLoading, refetch } = useQuery({
    queryKey: KEYS.LOGS({ status, page }),
    queryFn:  () => logService.getAll({ status, page, limit: 20 }).then(r => r.data),
    refetchInterval: 10000,
  })

  const retryMutation = useMutation({
    mutationFn: (id) => logService.retry(id),
    onSuccess:  () => { toast.success('Retry queued'); queryClient.invalidateQueries({ queryKey: ['logs'] }) },
  })

  const logs = data?.data || []
  const pagination = data?.pagination

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Execution Logs</h1>
          <p className="text-gray-500 text-sm mt-1">{pagination?.total || 0} total runs</p>
        </div>
        <Button variant="secondary" icon={RefreshCw} onClick={() => refetch()}>Refresh</Button>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {['','success','failed','running'].map(s => (
          <button key={s} onClick={() => { setStatus(s); setPage(1) }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${status === s ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'}`}>
            {s || 'All'}
          </button>
        ))}
      </div>

      {isLoading ? <Loader /> : !logs.length ? (
        <EmptyState icon="📋" title="No logs yet" description="Run a workflow to see execution logs" />
      ) : (
        <>
          <Card>
            <div className="divide-y divide-gray-100">
              {logs.map(log => (
                <div key={log._id} onClick={() => navigate(`/logs/${log._id}`)}
                  className="flex items-center justify-between p-4 hover:bg-gray-50 cursor-pointer transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${log.status === 'success' ? 'bg-green-500' : log.status === 'failed' ? 'bg-red-500' : log.status === 'running' ? 'bg-blue-500 animate-pulse' : 'bg-gray-400'}`} />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{log.workflowId?.name || 'Unknown Workflow'}</p>
                      <p className="text-xs text-gray-400">{log.triggerType} • {formatDate(log.createdAt)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={log.status === 'success' ? 'success' : log.status === 'failed' ? 'danger' : 'info'}>
                      {log.status}
                    </Badge>
                    <span className="text-xs text-gray-400">{formatDuration(log.duration)}</span>
                    {log.status === 'failed' && (
                      <Button size="sm" variant="secondary" icon={RefreshCw}
                        onClick={e => { e.stopPropagation(); retryMutation.mutate(log._id) }}>
                        Retry
                      </Button>
                    )}
                    <ChevronRight size={16} className="text-gray-400" />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Pagination */}
          {pagination && pagination.pages > 1 && (
            <div className="flex justify-center gap-2">
              <Button variant="secondary" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Prev</Button>
              <span className="px-4 py-2 text-sm text-gray-600">{page} / {pagination.pages}</span>
              <Button variant="secondary" disabled={page >= pagination.pages} onClick={() => setPage(p => p + 1)}>Next</Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

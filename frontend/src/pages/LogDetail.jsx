import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, CheckCircle, XCircle, Clock, SkipForward } from 'lucide-react'
import { logService } from '../services/log.service'
import { KEYS } from '../config/queryKeys'
import { formatDate, formatDuration } from '../utils/formatDate'
import { SERVICE_ICONS } from '../utils/constants'
import Loader from '../components/common/Loader'
import Button from '../components/ui/Button'
import Badge  from '../components/ui/Badge'
import Card   from '../components/ui/Card'

export default function LogDetail() {
  const { id }   = useParams()
  const navigate = useNavigate()

  const { data: log,   isLoading: ll } = useQuery({ queryKey: KEYS.LOG(id),       queryFn: () => logService.getOne(id).then(r => r.data.data.log) })
  const { data: steps, isLoading: sl } = useQuery({ queryKey: KEYS.LOG_STEPS(id), queryFn: () => logService.getSteps(id).then(r => r.data.data.steps) })

  if (ll || sl) return <Loader />
  if (!log) return <div className="text-center py-20 text-gray-400">Log not found</div>

  const StepIcon = ({ status }) => {
    if (status === 'success') return <CheckCircle size={20} className="text-green-500" />
    if (status === 'failed')  return <XCircle size={20} className="text-red-500" />
    return <SkipForward size={20} className="text-gray-400" />
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" icon={ArrowLeft} onClick={() => navigate('/logs')} />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Execution Detail</h1>
          <p className="text-sm text-gray-500">{log.workflowId?.name}</p>
        </div>
      </div>

      {/* Summary */}
      <Card className="p-5">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-gray-500">Status</p>
            <Badge className="mt-1" variant={log.status === 'success' ? 'success' : log.status === 'failed' ? 'danger' : 'info'}>
              {log.status}
            </Badge>
          </div>
          <div>
            <p className="text-xs text-gray-500">Trigger</p>
            <p className="text-sm font-medium mt-1">{log.triggerType}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Duration</p>
            <p className="text-sm font-medium mt-1">{formatDuration(log.duration)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Started At</p>
            <p className="text-sm font-medium mt-1">{formatDate(log.startedAt)}</p>
          </div>
        </div>
        {log.error?.message && (
          <div className="mt-4 p-3 bg-red-50 rounded-lg border border-red-200">
            <p className="text-xs font-medium text-red-700 mb-1">Error</p>
            <p className="text-sm text-red-600">{log.error.message}</p>
          </div>
        )}
      </Card>

      {/* Trigger Data */}
      {log.triggerData && (
        <Card className="p-5">
          <h3 className="font-semibold text-gray-800 mb-3">📥 Trigger Data</h3>
          <pre className="bg-gray-50 rounded-lg p-3 text-xs overflow-auto max-h-40">
            {JSON.stringify(log.triggerData, null, 2)}
          </pre>
        </Card>
      )}

      {/* Steps Timeline */}
      <Card className="p-5">
        <h3 className="font-semibold text-gray-800 mb-4">🔧 Execution Steps</h3>
        {!steps?.length ? (
          <p className="text-sm text-gray-400 text-center py-4">No steps recorded</p>
        ) : (
          <div className="space-y-3">
            {steps.map((step, i) => (
              <div key={step._id} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <StepIcon status={step.status} />
                  {i < steps.length - 1 && <div className="w-0.5 flex-1 bg-gray-200 mt-1" />}
                </div>
                <div className="flex-1 pb-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-800">
                      {SERVICE_ICONS[step.service]} {step.service} / {step.actionType}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">{formatDuration(step.duration)}</span>
                      <Badge variant={step.status === 'success' ? 'success' : step.status === 'failed' ? 'danger' : 'default'}>
                        {step.status}
                      </Badge>
                    </div>
                  </div>
                  {step.error && (
                    <p className="text-xs text-red-600 mt-1 bg-red-50 p-2 rounded">{step.error}</p>
                  )}
                  {step.output && (
                    <pre className="text-xs text-gray-500 mt-1 bg-gray-50 p-2 rounded overflow-auto max-h-20">
                      {JSON.stringify(step.output, null, 2)}
                    </pre>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}

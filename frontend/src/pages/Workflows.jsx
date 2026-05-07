import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Plus, Play, Pause, Trash2, Copy, BarChart2, Search } from 'lucide-react'
import toast from 'react-hot-toast'
import { workflowService } from '../services/workflow.service'
import { KEYS } from '../config/queryKeys'
import { timeAgo } from '../utils/formatDate'
import { STATUS_COLORS, TRIGGER_ICONS } from '../utils/constants'
import Loader     from '../components/common/Loader'
import EmptyState from '../components/common/EmptyState'
import Button     from '../components/ui/Button'
import Badge      from '../components/ui/Badge'
import Card       from '../components/ui/Card'

export default function Workflows() {
  const navigate     = useNavigate()
  const queryClient  = useQueryClient()
  const [search, setSearch]   = useState('')
  const [status, setStatus]   = useState('')

  const { data, isLoading } = useQuery({
    queryKey: KEYS.WORKFLOWS({ search, status }),
    queryFn:  () => workflowService.getAll({ search, status }).then(r => r.data),
  })

  const activateMutation = useMutation({
    mutationFn: (id) => workflowService.activate(id),
    onSuccess:  () => { queryClient.invalidateQueries({ queryKey: ['workflows'] }); toast.success('Workflow activated') },
  })
  const pauseMutation = useMutation({
    mutationFn: (id) => workflowService.pause(id),
    onSuccess:  () => { queryClient.invalidateQueries({ queryKey: ['workflows'] }); toast.success('Workflow paused') },
  })
  const deleteMutation = useMutation({
    mutationFn: (id) => workflowService.delete(id),
    onSuccess:  () => { queryClient.invalidateQueries({ queryKey: ['workflows'] }); toast.success('Workflow deleted') },
  })
  const dupMutation = useMutation({
    mutationFn: (id) => workflowService.duplicate(id),
    onSuccess:  () => { queryClient.invalidateQueries({ queryKey: ['workflows'] }); toast.success('Workflow duplicated') },
  })

  const workflows = data?.data || []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Workflows</h1>
          <p className="text-gray-500 text-sm mt-1">{data?.pagination?.total || 0} total workflows</p>
        </div>
        <Button icon={Plus} onClick={() => navigate('/workflows/new')}>New Workflow</Button>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            placeholder="Search workflows..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select value={status} onChange={e => setStatus(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none">
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="paused">Paused</option>
          <option value="draft">Draft</option>
        </select>
      </div>

      {/* List */}
      {isLoading ? <Loader /> : !workflows.length ? (
        <EmptyState icon="⚡" title="No workflows yet"
          description="Create your first workflow to start automating"
          action={<Button icon={Plus} onClick={() => navigate('/workflows/new')}>Create Workflow</Button>}
        />
      ) : (
        <div className="grid gap-4">
          {workflows.map(wf => (
            <Card key={wf._id} className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900 truncate">{wf.name}</h3>
                    <Badge variant={
                      wf.status === 'active' ? 'success' :
                      wf.status === 'paused' ? 'warning' : 'default'
                    }>{wf.status}</Badge>
                  </div>
                  {wf.description && <p className="text-sm text-gray-500 truncate">{wf.description}</p>}
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                    {wf.trigger && <span>{TRIGGER_ICONS[wf.trigger.type]} {wf.trigger.type}</span>}
                    <span>🔄 {wf.stats?.totalRuns || 0} runs</span>
                    <span>✅ {wf.stats?.successRuns || 0} success</span>
                    {wf.stats?.lastRunAt && <span>Last: {timeAgo(wf.stats.lastRunAt)}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Button size="sm" variant="ghost" icon={BarChart2}
                    onClick={() => navigate(`/workflows/${wf._id}`)} />
                  {wf.status === 'active'
                    ? <Button size="sm" variant="ghost" icon={Pause}
                        onClick={() => pauseMutation.mutate(wf._id)} />
                    : <Button size="sm" variant="ghost" icon={Play}
                        onClick={() => activateMutation.mutate(wf._id)} />
                  }
                  <Button size="sm" variant="ghost" icon={Copy}
                    onClick={() => dupMutation.mutate(wf._id)} />
                  <Button size="sm" variant="ghost" icon={Trash2}
                    onClick={() => { if(confirm('Delete this workflow?')) deleteMutation.mutate(wf._id) }}
                    className="text-red-500 hover:bg-red-50" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

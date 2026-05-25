import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Play, Pause, Trash2, Copy, BarChart2, Plus } from 'lucide-react'
import toast from 'react-hot-toast'
import { workflowService } from '../services/workflow.service'
import { KEYS }            from '../config/queryKeys'
import { timeAgo }         from '../utils/formatDate'
import { TRIGGER_ICONS }   from '../utils/constants'
import Loader        from '../components/common/Loader'
import EmptyState    from '../components/common/EmptyState'
import PageHeader    from '../components/ui/PageHeader'
import PremiumCard   from '../components/ui/PremiumCard'
import PremiumButton from '../components/ui/PremiumButton'
import SearchInput   from '../components/ui/SearchInput'
import StatusBadge   from '../components/ui/StatusBadge'

export default function Workflows() {
  const navigate    = useNavigate()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: KEYS.WORKFLOWS({ search, status }),
    queryFn:  () => workflowService.getAll({ search, status }).then(r => r.data),
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['workflows'] })

  const activateMut = useMutation({
    mutationFn: (id) => workflowService.activate(id),
    onSuccess:  () => { invalidate(); toast.success('Workflow activated!') },
  })
  const pauseMut = useMutation({
    mutationFn: (id) => workflowService.pause(id),
    onSuccess:  () => { invalidate(); toast.success('Workflow paused') },
  })
  const deleteMut = useMutation({
    mutationFn: (id) => workflowService.delete(id),
    onSuccess:  () => { invalidate(); toast.success('Workflow deleted') },
  })
  const dupMut = useMutation({
    mutationFn: (id) => workflowService.duplicate(id),
    onSuccess:  () => { invalidate(); toast.success('Duplicated!') },
  })

  const workflows = data?.data || []

  return (
    <div>
      <PageHeader
        title="Workflows"
        subtitle={`${data?.pagination?.total || 0} total workflows`}
        action={<PremiumButton icon={Plus} onClick={() => navigate('/workflows/new')}>New Workflow</PremiumButton>}
      />

      {/* Filters */}
      <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'24px', flexWrap:'wrap' }}>
        <SearchInput value={search} onChange={e => setSearch(e.target.value)} placeholder="Search workflows..." />
        <div style={{ display:'flex', gap:'6px' }}>
          {['','active','paused','draft'].map(s => (
            <button key={s} onClick={() => setStatus(s)} style={{
              padding:'8px 16px', borderRadius:'8px', fontSize:'13px', fontWeight:'500',
              cursor:'pointer', transition:'all 0.15s', border:'1px solid',
              background: status === s ? '#0f172a' : 'white',
              color:      status === s ? 'white'   : '#64748b',
              borderColor:status === s ? '#0f172a' : '#e2e8f0',
            }}>
              {s ? s.charAt(0).toUpperCase() + s.slice(1) : 'All'}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? <Loader /> : !workflows.length ? (
        <EmptyState icon="⚡" title="No workflows yet"
          description="Create your first automation workflow"
          action={<PremiumButton icon={Plus} onClick={() => navigate('/workflows/new')}>Create Workflow</PremiumButton>}
        />
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
          {workflows.map(wf => (
            <PremiumCard key={wf._id} style={{ padding:'20px 24px' }} hover>
              <div style={{ display:'flex', alignItems:'center', gap:'16px' }}>
                <div style={{
                  width:'40px', height:'40px', borderRadius:'12px', flexShrink:0,
                  background: wf.status==='active' ? '#f0fdf4' : wf.status==='paused' ? '#fffbeb' : '#f8fafc',
                  display:'flex', alignItems:'center', justifyContent:'center', fontSize:'20px'
                }}>
                  {TRIGGER_ICONS[wf.trigger?.type] || '⚡'}
                </div>

                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'4px' }}>
                    <h3 style={{ fontSize:'15px', fontWeight:'700', color:'#0f172a', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                      {wf.name}
                    </h3>
                    <StatusBadge status={wf.status} />
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:'16px', flexWrap:'wrap' }}>
                    {wf.description && <p style={{ fontSize:'13px', color:'#64748b' }}>{wf.description}</p>}
                    <span style={{ fontSize:'12px', color:'#94a3b8' }}>🔄 {wf.stats?.totalRuns || 0} runs</span>
                    <span style={{ fontSize:'12px', color:'#94a3b8' }}>✅ {wf.stats?.successRuns || 0} success</span>
                    {wf.stats?.lastRunAt && <span style={{ fontSize:'12px', color:'#94a3b8' }}>Last: {timeAgo(wf.stats.lastRunAt)}</span>}
                  </div>
                </div>

                <div style={{ display:'flex', alignItems:'center', gap:'6px', flexShrink:0 }}>
                  <PremiumButton size="sm" variant="ghost" icon={BarChart2} onClick={() => navigate(`/workflows/${wf._id}`)} />
                  {wf.status === 'active'
                    ? <PremiumButton size="sm" variant="ghost" icon={Pause}  onClick={() => pauseMut.mutate(wf._id)} />
                    : <PremiumButton size="sm" variant="ghost" icon={Play}   onClick={() => activateMut.mutate(wf._id)} />
                  }
                  <PremiumButton size="sm" variant="ghost" icon={Copy}   onClick={() => dupMut.mutate(wf._id)} />
                  <PremiumButton size="sm" variant="ghost" icon={Trash2}
                    onClick={() => { if(confirm('Delete this workflow?')) deleteMut.mutate(wf._id) }}
                    style={{ color:'#ef4444' }}
                  />
                </div>
              </div>
            </PremiumCard>
          ))}
        </div>
      )}
    </div>
  )
}

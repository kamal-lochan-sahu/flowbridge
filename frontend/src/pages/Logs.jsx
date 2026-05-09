import { useState }   from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate }  from 'react-router-dom'
import { RefreshCw, ChevronRight, RotateCcw } from 'lucide-react'
import toast from 'react-hot-toast'
import { logService }  from '../services/log.service'
import { KEYS }        from '../config/queryKeys'
import { formatDate, formatDuration } from '../utils/formatDate'
import Loader        from '../components/common/Loader'
import EmptyState    from '../components/common/EmptyState'
import PageHeader    from '../components/ui/PageHeader'
import PremiumCard   from '../components/ui/PremiumCard'
import PremiumButton from '../components/ui/PremiumButton'
import StatusBadge   from '../components/ui/StatusBadge'

const FILTERS = [
  { key:'',        label:'All',     color:'#0f172a' },
  { key:'success', label:'Success', color:'#16a34a' },
  { key:'failed',  label:'Failed',  color:'#dc2626' },
  { key:'running', label:'Running', color:'#2563eb' },
]

export default function Logs() {
  const navigate    = useNavigate()
  const queryClient = useQueryClient()
  const [status, setStatus] = useState('')
  const [page,   setPage]   = useState(1)

  const { data, isLoading, refetch } = useQuery({
    queryKey: KEYS.LOGS({status,page}),
    queryFn:  ()=>logService.getAll({status,page,limit:20}).then(r=>r.data),
    refetchInterval: 15000,
  })

  const retryMut = useMutation({
    mutationFn: (id)=>logService.retry(id),
    onSuccess:  ()=>{ toast.success('Retry queued'); queryClient.invalidateQueries({queryKey:['logs']}) },
  })

  const logs       = data?.data||[]
  const pagination = data?.pagination

  return (
    <div>
      <PageHeader
        title="Execution Logs"
        subtitle={`${pagination?.total||0} total executions`}
        action={<PremiumButton variant="secondary" icon={RefreshCw} onClick={()=>refetch()} size="sm">Refresh</PremiumButton>}
      />

      {/* Filter Tabs */}
      <div style={{ display:'flex', gap:'6px', marginBottom:'20px', background:'white', padding:'5px', borderRadius:'12px', border:'1px solid #f1f5f9', width:'fit-content', boxShadow:'0 1px 3px rgba(0,0,0,0.04)' }}>
        {FILTERS.map(f=>(
          <button key={f.key} onClick={()=>{ setStatus(f.key); setPage(1) }} style={{
            padding:'7px 18px', borderRadius:'8px', fontSize:'13px', fontWeight:'600',
            border:'none', cursor:'pointer', transition:'all 0.15s',
            background:status===f.key?f.color:'transparent',
            color:status===f.key?'white':'#64748b',
          }}>
            {f.label}
          </button>
        ))}
      </div>

      {isLoading ? <Loader /> : !logs.length ? (
        <EmptyState icon="📋" title="No logs yet" description="Trigger a workflow to see execution logs appear here" />
      ) : (
        <>
          <PremiumCard>
            <div style={{ padding:'0 4px' }}>
              {/* Header */}
              <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr 120px 100px 80px', gap:'16px', padding:'12px 20px', borderBottom:'1px solid #f8fafc' }}>
                {['Workflow','Trigger','Status','Duration','Time'].map(h=>(
                  <span key={h} style={{ fontSize:'11px',fontWeight:'700',color:'#94a3b8',textTransform:'uppercase',letterSpacing:'0.5px' }}>{h}</span>
                ))}
              </div>

              {logs.map((log,i)=>(
                <div key={log._id} onClick={()=>navigate(`/logs/${log._id}`)}
                  style={{ display:'grid',gridTemplateColumns:'2fr 1fr 120px 100px 80px',gap:'16px',padding:'14px 20px',borderBottom:i<logs.length-1?'1px solid #f8fafc':'none',cursor:'pointer',transition:'background 0.1s',alignItems:'center' }}
                  onMouseEnter={e=>e.currentTarget.style.background='#f8fafc'}
                  onMouseLeave={e=>e.currentTarget.style.background='transparent'}
                >
                  <div style={{ display:'flex',alignItems:'center',gap:'10px' }}>
                    <div style={{ width:'6px',height:'6px',borderRadius:'50%',background:log.status==='success'?'#22c55e':log.status==='failed'?'#ef4444':log.status==='running'?'#3b82f6':'#94a3b8',flexShrink:0 }} />
                    <span style={{ fontSize:'14px',fontWeight:'600',color:'#0f172a',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>
                      {log.workflowId?.name||'Unknown Workflow'}
                    </span>
                  </div>
                  <span style={{ fontSize:'13px',color:'#64748b',textTransform:'capitalize' }}>{log.triggerType}</span>
                  <div style={{ display:'flex',alignItems:'center',gap:'8px' }}>
                    <StatusBadge status={log.status} />
                    {log.status==='failed' && (
                      <button onClick={e=>{e.stopPropagation();retryMut.mutate(log._id)}} style={{ background:'none',border:'none',cursor:'pointer',color:'#3b82f6',padding:'2px' }}>
                        <RotateCcw size={14}/>
                      </button>
                    )}
                  </div>
                  <span style={{ fontSize:'13px',color:'#64748b' }}>{formatDuration(log.duration)}</span>
                  <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between' }}>
                    <span style={{ fontSize:'12px',color:'#94a3b8' }}>{formatDate(log.createdAt)?.split(',')[1]?.trim()}</span>
                    <ChevronRight size={14} color="#cbd5e1" />
                  </div>
                </div>
              ))}
            </div>
          </PremiumCard>

          {pagination?.pages>1 && (
            <div style={{ display:'flex',justifyContent:'center',alignItems:'center',gap:'12px',marginTop:'20px' }}>
              <PremiumButton variant="secondary" size="sm" disabled={page===1} onClick={()=>setPage(p=>p-1)}>← Previous</PremiumButton>
              <span style={{ fontSize:'13px',color:'#64748b',fontWeight:'500' }}>Page {page} of {pagination.pages}</span>
              <PremiumButton variant="secondary" size="sm" disabled={page>=pagination.pages} onClick={()=>setPage(p=>p+1)}>Next →</PremiumButton>
            </div>
          )}
        </>
      )}
    </div>
  )
}

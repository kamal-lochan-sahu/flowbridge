import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, CheckCircle, XCircle, SkipForward, Clock } from 'lucide-react'
import { logService } from '../services/log.service'
import { KEYS }       from '../config/queryKeys'
import { formatDate, formatDuration } from '../utils/formatDate'
import { SERVICE_ICONS } from '../utils/constants'
import Loader        from '../components/common/Loader'
import PageHeader    from '../components/ui/PageHeader'
import PremiumCard   from '../components/ui/PremiumCard'
import PremiumButton from '../components/ui/PremiumButton'
import StatusBadge   from '../components/ui/StatusBadge'

export default function LogDetail() {
  const { id }   = useParams()
  const navigate = useNavigate()

  const { data:log,   isLoading:ll } = useQuery({ queryKey:KEYS.LOG(id),       queryFn:()=>logService.getOne(id).then(r=>r.data.data.log) })
  const { data:steps, isLoading:sl } = useQuery({ queryKey:KEYS.LOG_STEPS(id), queryFn:()=>logService.getSteps(id).then(r=>r.data.data.steps) })

  if (ll||sl) return <Loader />
  if (!log)   return <div style={{ textAlign:'center',padding:'60px',color:'#94a3b8' }}>Log not found</div>

  return (
    <div style={{ maxWidth:'760px' }}>
      <div style={{ display:'flex',alignItems:'center',gap:'12px',marginBottom:'28px' }}>
        <PremiumButton variant="ghost" icon={ArrowLeft} size="sm" onClick={()=>navigate('/logs')}>Back</PremiumButton>
        <div style={{ width:'1px',height:'16px',background:'#e2e8f0' }} />
        <div>
          <h1 style={{ fontSize:'20px',fontWeight:'700',color:'#0f172a' }}>Execution Detail</h1>
          <p style={{ fontSize:'13px',color:'#94a3b8',marginTop:'2px' }}>{log.workflowId?.name}</p>
        </div>
      </div>

      {/* Summary */}
      <PremiumCard style={{ padding:'24px', marginBottom:'16px' }}>
        <div style={{ display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'20px' }}>
          {[
            { label:'Status',   value:<StatusBadge status={log.status}/> },
            { label:'Trigger',  value:<span style={{ fontSize:'14px',fontWeight:'600',color:'#0f172a',textTransform:'capitalize' }}>{log.triggerType}</span> },
            { label:'Duration', value:<span style={{ fontSize:'14px',fontWeight:'600',color:'#0f172a' }}>{formatDuration(log.duration)}</span> },
            { label:'Started',  value:<span style={{ fontSize:'13px',color:'#64748b' }}>{formatDate(log.startedAt)}</span> },
          ].map(item=>(
            <div key={item.label}>
              <p style={{ fontSize:'11px',fontWeight:'700',color:'#94a3b8',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:'8px' }}>{item.label}</p>
              {item.value}
            </div>
          ))}
        </div>
        {log.error?.message && (
          <div style={{ marginTop:'20px',padding:'14px 16px',background:'#fef2f2',borderRadius:'10px',border:'1px solid #fecaca' }}>
            <p style={{ fontSize:'12px',fontWeight:'700',color:'#dc2626',marginBottom:'4px' }}>ERROR</p>
            <p style={{ fontSize:'13px',color:'#b91c1c',fontFamily:'monospace' }}>{log.error.message}</p>
          </div>
        )}
      </PremiumCard>

      {/* Trigger Data */}
      {log.triggerData && Object.keys(log.triggerData).length>0 && (
        <PremiumCard style={{ padding:'24px', marginBottom:'16px' }}>
          <h3 style={{ fontSize:'14px',fontWeight:'700',color:'#0f172a',marginBottom:'14px' }}>📥 Trigger Payload</h3>
          <pre style={{ background:'#f8fafc',borderRadius:'10px',padding:'14px',fontSize:'12px',fontFamily:'monospace',overflowX:'auto',color:'#374151',margin:0,border:'1px solid #f1f5f9' }}>
            {JSON.stringify(log.triggerData,null,2)}
          </pre>
        </PremiumCard>
      )}

      {/* Steps Timeline */}
      <PremiumCard style={{ padding:'24px' }}>
        <h3 style={{ fontSize:'14px',fontWeight:'700',color:'#0f172a',marginBottom:'20px' }}>🔧 Execution Steps</h3>
        {!steps?.length ? (
          <p style={{ textAlign:'center',color:'#94a3b8',fontSize:'14px',padding:'20px 0' }}>No steps recorded</p>
        ) : (
          <div>
            {steps.map((step,i)=>(
              <div key={step._id} style={{ display:'flex',gap:'16px',marginBottom:i<steps.length-1?'0':'0' }}>
                {/* Timeline connector */}
                <div style={{ display:'flex',flexDirection:'column',alignItems:'center',width:'24px',flexShrink:0 }}>
                  <div style={{ width:'28px',height:'28px',borderRadius:'50%',background:step.status==='success'?'#f0fdf4':step.status==='failed'?'#fef2f2':'#f8fafc',border:`2px solid ${step.status==='success'?'#22c55e':step.status==='failed'?'#ef4444':'#e2e8f0'}`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
                    {step.status==='success'?<CheckCircle size={14} color="#22c55e"/>:step.status==='failed'?<XCircle size={14} color="#ef4444"/>:<SkipForward size={14} color="#94a3b8"/>}
                  </div>
                  {i<steps.length-1 && <div style={{ width:'2px',flex:1,background:'#f1f5f9',minHeight:'20px',margin:'4px 0' }} />}
                </div>

                {/* Step content */}
                <div style={{ flex:1,paddingBottom:'20px' }}>
                  <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'8px' }}>
                    <div style={{ display:'flex',alignItems:'center',gap:'8px' }}>
                      <span style={{ fontSize:'16px' }}>{SERVICE_ICONS[step.service]||'🔧'}</span>
                      <span style={{ fontSize:'14px',fontWeight:'700',color:'#0f172a' }}>{step.service}</span>
                      <span style={{ fontSize:'12px',color:'#94a3b8' }}>/ {step.actionType}</span>
                    </div>
                    <div style={{ display:'flex',alignItems:'center',gap:'8px' }}>
                      <span style={{ fontSize:'12px',color:'#94a3b8',display:'flex',alignItems:'center',gap:'4px' }}><Clock size={11}/>{formatDuration(step.duration)}</span>
                      <StatusBadge status={step.status} />
                    </div>
                  </div>
                  {step.error && (
                    <div style={{ background:'#fef2f2',borderRadius:'8px',padding:'10px 12px',marginBottom:'8px',border:'1px solid #fecaca' }}>
                      <p style={{ fontSize:'12px',fontFamily:'monospace',color:'#b91c1c' }}>{step.error}</p>
                    </div>
                  )}
                  {step.output && (
                    <pre style={{ background:'#f8fafc',borderRadius:'8px',padding:'10px 12px',fontSize:'11px',fontFamily:'monospace',overflowX:'auto',color:'#475569',maxHeight:'100px',margin:0,border:'1px solid #f1f5f9' }}>
                      {JSON.stringify(step.output,null,2)}
                    </pre>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </PremiumCard>
    </div>
  )
}

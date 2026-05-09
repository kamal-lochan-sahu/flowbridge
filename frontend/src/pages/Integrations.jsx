import { useQuery } from '@tanstack/react-query'
import api from '../services/api'
import { SERVICE_ICONS } from '../utils/constants'
import Loader      from '../components/common/Loader'
import PageHeader  from '../components/ui/PageHeader'
import PremiumCard from '../components/ui/PremiumCard'

const AUTH_COLORS = { oauth2:'#8b5cf6', api_key:'#f59e0b', none:'#10b981', basic:'#3b82f6' }

export default function Integrations() {
  const { data, isLoading } = useQuery({ queryKey:['integrations'], queryFn:()=>api.get('/integrations').then(r=>r.data.data.integrations) })
  if (isLoading) return <Loader />
  const phase1 = (data||[]).filter(i=>i.phase===1)
  const phase2 = (data||[]).filter(i=>i.phase===2)

  const IntCard = ({ i }) => (
    <PremiumCard style={{ padding:'20px' }} hover>
      <div style={{ display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:'14px' }}>
        <div style={{ display:'flex',alignItems:'center',gap:'12px' }}>
          <div style={{ width:'44px',height:'44px',borderRadius:'12px',background:'#f8fafc',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'22px',border:'1px solid #f1f5f9',flexShrink:0 }}>
            {SERVICE_ICONS[i.service]||'🔌'}
          </div>
          <div>
            <p style={{ fontSize:'15px',fontWeight:'700',color:'#0f172a' }}>{i.displayName}</p>
            <p style={{ fontSize:'12px',color:'#94a3b8',marginTop:'2px',textTransform:'capitalize' }}>{i.category}</p>
          </div>
        </div>
        <span style={{ fontSize:'11px',fontWeight:'700',padding:'3px 8px',borderRadius:'99px',background:`${AUTH_COLORS[i.authType]||'#94a3b8'}15`,color:AUTH_COLORS[i.authType]||'#94a3b8' }}>
          {i.authType}
        </span>
      </div>
      {i.actions?.length>0 && (
        <div style={{ marginBottom:'8px' }}>
          <p style={{ fontSize:'11px',fontWeight:'700',color:'#94a3b8',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:'6px' }}>Actions</p>
          <div style={{ display:'flex',flexWrap:'wrap',gap:'4px' }}>
            {i.actions.map(a=><span key={a.actionType} style={{ fontSize:'12px',color:'#374151',background:'#f8fafc',padding:'3px 9px',borderRadius:'6px',border:'1px solid #f1f5f9',fontWeight:'500' }}>{a.label}</span>)}
          </div>
        </div>
      )}
      {i.triggers?.length>0 && (
        <div>
          <p style={{ fontSize:'11px',fontWeight:'700',color:'#94a3b8',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:'6px' }}>Triggers</p>
          <div style={{ display:'flex',flexWrap:'wrap',gap:'4px' }}>
            {i.triggers.map(t=><span key={t.event} style={{ fontSize:'12px',color:'#7c3aed',background:'#f5f3ff',padding:'3px 9px',borderRadius:'6px',border:'1px solid #ede9fe',fontWeight:'500' }}>{t.label}</span>)}
          </div>
        </div>
      )}
    </PremiumCard>
  )

  return (
    <div>
      <PageHeader title="Integrations" subtitle="All available services and connectors" />

      <div style={{ marginBottom:'32px' }}>
        <div style={{ display:'flex',alignItems:'center',gap:'10px',marginBottom:'16px' }}>
          <span style={{ fontSize:'18px' }}>⚡</span>
          <h2 style={{ fontSize:'16px',fontWeight:'700',color:'#0f172a' }}>Phase 1 — Available Now</h2>
          <span style={{ fontSize:'12px',fontWeight:'600',color:'#16a34a',background:'#f0fdf4',padding:'2px 8px',borderRadius:'99px',border:'1px solid #bbf7d0' }}>{phase1.length} integrations</span>
        </div>
        <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:'14px' }}>
          {phase1.map(i=><IntCard key={i.service} i={i}/>)}
        </div>
      </div>

      <div>
        <div style={{ display:'flex',alignItems:'center',gap:'10px',marginBottom:'16px' }}>
          <span style={{ fontSize:'18px' }}>🚀</span>
          <h2 style={{ fontSize:'16px',fontWeight:'700',color:'#0f172a' }}>Phase 2 — Coming Soon</h2>
          <span style={{ fontSize:'12px',fontWeight:'600',color:'#d97706',background:'#fffbeb',padding:'2px 8px',borderRadius:'99px',border:'1px solid #fde68a' }}>{phase2.length} integrations</span>
        </div>
        <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:'14px' }}>
          {phase2.map(i=><IntCard key={i.service} i={i}/>)}
        </div>
      </div>
    </div>
  )
}

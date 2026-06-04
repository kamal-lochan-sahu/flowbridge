import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import api from '../services/api'
import Loader      from '../components/common/Loader'
import PageHeader  from '../components/ui/PageHeader'
import PremiumCard from '../components/ui/PremiumCard'
import PremiumButton from '../components/ui/PremiumButton'

const CATEGORY_COLORS = {
  ecommerce: { bg:'#eff6ff', color:'#1d4ed8', emoji:'🛍️' },
  marketing:  { bg:'#f5f3ff', color:'#7c3aed', emoji:'📣' },
  reporting:  { bg:'#f0fdf4', color:'#15803d', emoji:'📊' },
  payment:    { bg:'#fffbeb', color:'#b45309', emoji:'💳' },
  inventory:  { bg:'#fef2f2', color:'#b91c1c', emoji:'📦' },
  default:    { bg:'#f8fafc', color:'#374151', emoji:'⚡' },
}
const GRADIENT_COLORS = ['#3b82f6','#8b5cf6','#10b981','#f59e0b','#ef4444','#6366f1']

const FALLBACK = [
  { _id:'fallback_1', name:'Ecommerce Order Handler', category:'ecommerce',
    description:'Receive order webhook → Update Google Sheet → Generate PDF Invoice → Send Email + WhatsApp',
    requiredServices:['webhook','google-sheets','pdf-generator','gmail','twilio'] },
  { _id:'fallback_2', name:'Lead Capture & Nurture', category:'marketing',
    description:'Form submission → Save to Sheet → Send welcome email → Notify team on Slack',
    requiredServices:['form','google-sheets','gmail','slack'] },
  { _id:'fallback_3', name:'Daily Sales Report', category:'reporting',
    description:'Schedule 8PM → Read Sheet → Generate PDF report → Email to owner',
    requiredServices:['schedule','google-sheets','pdf-generator','gmail'] },
  { _id:'fallback_4', name:'Payment Confirmation', category:'payment',
    description:'Razorpay webhook → Update MongoDB → Send SMS + Email invoice',
    requiredServices:['webhook','mongodb','twilio','gmail'] },
  { _id:'fallback_5', name:'Low Stock Alert', category:'inventory',
    description:'Webhook trigger → Send WhatsApp alert → Email owner',
    requiredServices:['webhook','twilio','gmail'] },
]

export default function Templates() {
  const navigate = useNavigate()

  const { data, isLoading } = useQuery({
    queryKey: ['templates'],
    queryFn:  () => api.get('/templates').then(r => r.data.data.templates),
    retry: false,
  })

  const templates = (data && data.length > 0) ? data : FALLBACK

  const handleUseTemplate = (t) => {
    // Navigate to workflow builder with template data pre-filled
    navigate('/workflows/new', {
      state: {
        templateName: t.name,
        templateDesc: t.description,
        templateServices: t.requiredServices,
      }
    })
  }

  return (
    <div>
      <PageHeader
        title="Workflow Templates"
        subtitle="Start fast with pre-built automation flows — customize as needed"
      />

      {isLoading ? <Loader text="Loading templates..." /> : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(320px,1fr))', gap:'16px' }}>
          {templates.map((t, idx) => {
            const cat   = CATEGORY_COLORS[t.category] || CATEGORY_COLORS.default
            const color = GRADIENT_COLORS[idx % GRADIENT_COLORS.length]
            const services = t.requiredServices || []

            return (
              <PremiumCard key={t._id} style={{ padding:'24px', display:'flex', flexDirection:'column', gap:'14px' }} hover>
                <div style={{ display:'flex', alignItems:'flex-start', gap:'12px' }}>
                  <div style={{ width:'44px', height:'44px', borderRadius:'12px', background:`${color}15`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'22px', flexShrink:0 }}>
                    {cat.emoji}
                  </div>
                  <div style={{ flex:1 }}>
                    <h3 style={{ fontSize:'15px', fontWeight:'700', color:'#0f172a', lineHeight:1.3 }}>{t.name}</h3>
                    <span style={{ fontSize:'11px', fontWeight:'600', padding:'2px 8px', borderRadius:'99px', background:cat.bg, color:cat.color, marginTop:'4px', display:'inline-block', textTransform:'capitalize' }}>
                      {t.category || 'general'}
                    </span>
                  </div>
                </div>

                <p style={{ fontSize:'13px', color:'#64748b', lineHeight:'1.6' }}>{t.description}</p>

                {services.length > 0 && (
                  <div>
                    <p style={{ fontSize:'11px', fontWeight:'700', color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'7px' }}>Required</p>
                    <div style={{ display:'flex', flexWrap:'wrap', gap:'5px' }}>
                      {services.map(s => (
                        <span key={s} style={{ fontSize:'11px', fontWeight:'600', color:'#374151', background:'#f8fafc', padding:'3px 9px', borderRadius:'6px', border:'1px solid #f1f5f9' }}>
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div style={{ marginTop:'auto', paddingTop:'4px', display:'flex', gap:'8px' }}>
                  <PremiumButton size="sm" icon={ArrowRight}
                    onClick={() => handleUseTemplate(t)}
                    style={{ background:`linear-gradient(135deg,${color},${color}dd)`, boxShadow:`0 3px 10px ${color}30` }}>
                    Use Template
                  </PremiumButton>
                  <PremiumButton size="sm" variant="ghost" onClick={() => navigate('/workflows/new')}>
                    Build Custom
                  </PremiumButton>
                </div>
              </PremiumCard>
            )
          })}
        </div>
      )}
    </div>
  )
}

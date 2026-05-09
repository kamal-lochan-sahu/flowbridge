import { useNavigate } from 'react-router-dom'
import PageHeader    from '../components/ui/PageHeader'
import PremiumCard   from '../components/ui/PremiumCard'
import PremiumButton from '../components/ui/PremiumButton'
import { ArrowRight } from 'lucide-react'

const TEMPLATES = [
  { id:'t1', name:'Ecommerce Order Handler', category:'ecommerce', emoji:'🛍️',
    description:'Receive order webhook → Update Google Sheet → Generate PDF Invoice → Send Email + WhatsApp to customer',
    services:['webhook','google-sheets','pdf-generator','gmail','twilio'], color:'#3b82f6' },
  { id:'t2', name:'Lead Capture & Nurture', category:'marketing', emoji:'📣',
    description:'Form submission → Save to Google Sheet → Send welcome email → Notify team on Slack',
    services:['form','google-sheets','gmail','slack'], color:'#8b5cf6' },
  { id:'t3', name:'Daily Sales Report', category:'reporting', emoji:'📊',
    description:'Schedule at 8PM every day → Read Sheet data → Generate PDF report → Email to owner',
    services:['schedule','google-sheets','pdf-generator','gmail'], color:'#10b981' },
  { id:'t4', name:'Payment Confirmation', category:'payment', emoji:'💳',
    description:'Razorpay webhook → Update MongoDB → Send SMS confirmation + Email invoice to customer',
    services:['webhook','mongodb','twilio','gmail'], color:'#f59e0b' },
  { id:'t5', name:'Low Stock Alert', category:'inventory', emoji:'📦',
    description:'Webhook from inventory system → Send WhatsApp alert to manager → Email detailed report',
    services:['webhook','twilio','gmail'], color:'#ef4444' },
]

const CATEGORY_COLORS = {
  ecommerce: { bg:'#eff6ff', color:'#1d4ed8' },
  marketing:  { bg:'#f5f3ff', color:'#7c3aed' },
  reporting:  { bg:'#f0fdf4', color:'#15803d' },
  payment:    { bg:'#fffbeb', color:'#b45309' },
  inventory:  { bg:'#fef2f2', color:'#b91c1c' },
}

export default function Templates() {
  const navigate = useNavigate()

  return (
    <div>
      <PageHeader title="Workflow Templates" subtitle="Start fast with pre-built automation flows — customize as needed" />

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(340px,1fr))', gap:'16px' }}>
        {TEMPLATES.map(t=>{
          const cat = CATEGORY_COLORS[t.category]||CATEGORY_COLORS.ecommerce
          return (
            <PremiumCard key={t.id} style={{ padding:'24px', display:'flex', flexDirection:'column', gap:'16px' }} hover>
              {/* Header */}
              <div style={{ display:'flex',alignItems:'flex-start',justifyContent:'space-between' }}>
                <div style={{ display:'flex',alignItems:'center',gap:'12px' }}>
                  <div style={{ width:'44px',height:'44px',borderRadius:'12px',background:`${t.color}15`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'22px',flexShrink:0 }}>
                    {t.emoji}
                  </div>
                  <div>
                    <h3 style={{ fontSize:'15px',fontWeight:'700',color:'#0f172a',lineHeight:1.3 }}>{t.name}</h3>
                    <span style={{ fontSize:'11px',fontWeight:'600',padding:'2px 8px',borderRadius:'99px',background:cat.bg,color:cat.color,marginTop:'4px',display:'inline-block',textTransform:'capitalize' }}>
                      {t.category}
                    </span>
                  </div>
                </div>
              </div>

              {/* Description */}
              <p style={{ fontSize:'13px',color:'#64748b',lineHeight:'1.6' }}>{t.description}</p>

              {/* Services */}
              <div>
                <p style={{ fontSize:'11px',fontWeight:'700',color:'#94a3b8',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:'8px' }}>Required Services</p>
                <div style={{ display:'flex',flexWrap:'wrap',gap:'5px' }}>
                  {t.services.map(s=>(
                    <span key={s} style={{ fontSize:'11px',fontWeight:'600',color:'#374151',background:'#f8fafc',padding:'3px 10px',borderRadius:'6px',border:'1px solid #f1f5f9',textTransform:'capitalize' }}>
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              {/* Action */}
              <div style={{ marginTop:'auto', paddingTop:'4px' }}>
                <PremiumButton size="sm" icon={ArrowRight} onClick={()=>navigate('/workflows/new')}
                  style={{ background:`linear-gradient(135deg,${t.color},${t.color}dd)`,boxShadow:`0 3px 10px ${t.color}30` }}>
                  Use This Template
                </PremiumButton>
              </div>
            </PremiumCard>
          )
        })}
      </div>
    </div>
  )
}

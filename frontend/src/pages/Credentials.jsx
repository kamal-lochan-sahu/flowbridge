import { useState }   from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2, Zap, CheckCircle, XCircle, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { credentialService } from '../services/credential.service'
import { KEYS }              from '../config/queryKeys'
import { timeAgo }           from '../utils/formatDate'
import Loader        from '../components/common/Loader'
import EmptyState    from '../components/common/EmptyState'
import PageHeader    from '../components/ui/PageHeader'
import PremiumCard   from '../components/ui/PremiumCard'
import PremiumButton from '../components/ui/PremiumButton'

const SERVICE_META = {
  gmail:         { icon:'📧', color:'#ea4335', label:'Gmail' },
  'google-sheets':{ icon:'📊', color:'#0f9d58', label:'Google Sheets' },
  twilio:        { icon:'📱', color:'#f22f46', label:'Twilio' },
  shopify:       { icon:'🛍️', color:'#96bf48', label:'Shopify' },
  slack:         { icon:'💬', color:'#4a154b', label:'Slack' },
  mongodb:       { icon:'🗄️', color:'#13aa52', label:'MongoDB' },
  custom:        { icon:'🔌', color:'#6366f1', label:'Custom' },
}
const SERVICES = Object.keys(SERVICE_META)

export default function Credentials() {
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name:'', service:'twilio', authType:'api_key', credentials:'{
  
}' })

  const { data, isLoading } = useQuery({
    queryKey: KEYS.CREDENTIALS,
    queryFn:  ()=>credentialService.getAll().then(r=>r.data.data.credentials),
  })

  const createMut = useMutation({
    mutationFn: ()=>credentialService.create({ ...form, credentials:JSON.parse(form.credentials) }),
    onSuccess:  ()=>{ queryClient.invalidateQueries({queryKey:KEYS.CREDENTIALS}); toast.success('Credential added'); setShowForm(false); setForm({name:'',service:'twilio',authType:'api_key',credentials:'{
  
}'}) },
    onError:    (e)=>toast.error(e.response?.data?.message||'Invalid JSON'),
  })
  const deleteMut = useMutation({
    mutationFn: (id)=>credentialService.delete(id),
    onSuccess:  ()=>{ queryClient.invalidateQueries({queryKey:KEYS.CREDENTIALS}); toast.success('Deleted') },
  })
  const testMut = useMutation({
    mutationFn: (id)=>credentialService.test(id),
    onSuccess:  (res)=>{ queryClient.invalidateQueries({queryKey:KEYS.CREDENTIALS}); const r=res.data.data; r.success?toast.success(r.message):toast.error(r.message) },
  })

  const credentials = data||[]

  return (
    <div>
      <PageHeader
        title="Credentials"
        subtitle="Manage your API keys and OAuth connections"
        action={<PremiumButton icon={Plus} onClick={()=>setShowForm(true)}>Add Credential</PremiumButton>}
      />

      {/* Add Form Modal */}
      {showForm && (
        <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.4)',zIndex:100,display:'flex',alignItems:'center',justifyContent:'center',padding:'20px' }}>
          <PremiumCard style={{ width:'100%',maxWidth:'520px',padding:'32px' }}>
            <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'24px' }}>
              <h2 style={{ fontSize:'18px',fontWeight:'700',color:'#0f172a' }}>Add Credential</h2>
              <button onClick={()=>setShowForm(false)} style={{ background:'none',border:'none',cursor:'pointer',color:'#94a3b8',padding:'4px' }}><X size={20}/></button>
            </div>

            <div style={{ display:'flex',flexDirection:'column',gap:'16px' }}>
              <div>
                <label style={{ fontSize:'13px',fontWeight:'600',color:'#374151',display:'block',marginBottom:'6px' }}>Name</label>
                <input value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))} placeholder="e.g. My Twilio Account"
                  style={{ width:'100%',padding:'10px 14px',border:'1px solid #e2e8f0',borderRadius:'10px',fontSize:'14px',outline:'none',boxSizing:'border-box' }}
                  onFocus={e=>e.target.style.borderColor='#3b82f6'} onBlur={e=>e.target.style.borderColor='#e2e8f0'}
                />
              </div>

              <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px' }}>
                <div>
                  <label style={{ fontSize:'13px',fontWeight:'600',color:'#374151',display:'block',marginBottom:'6px' }}>Service</label>
                  <select value={form.service} onChange={e=>setForm(p=>({...p,service:e.target.value}))}
                    style={{ width:'100%',padding:'10px 14px',border:'1px solid #e2e8f0',borderRadius:'10px',fontSize:'14px',outline:'none',background:'white' }}>
                    {SERVICES.map(s=><option key={s} value={s}>{SERVICE_META[s].icon} {SERVICE_META[s].label}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize:'13px',fontWeight:'600',color:'#374151',display:'block',marginBottom:'6px' }}>Auth Type</label>
                  <select value={form.authType} onChange={e=>setForm(p=>({...p,authType:e.target.value}))}
                    style={{ width:'100%',padding:'10px 14px',border:'1px solid #e2e8f0',borderRadius:'10px',fontSize:'14px',outline:'none',background:'white' }}>
                    <option value="api_key">API Key</option>
                    <option value="oauth2">OAuth2</option>
                    <option value="basic">Basic Auth</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize:'13px',fontWeight:'600',color:'#374151',display:'block',marginBottom:'6px' }}>Credentials (JSON)</label>
                <textarea value={form.credentials} onChange={e=>setForm(p=>({...p,credentials:e.target.value}))} rows={5}
                  style={{ width:'100%',padding:'10px 14px',border:'1px solid #e2e8f0',borderRadius:'10px',fontSize:'13px',fontFamily:'monospace',outline:'none',resize:'vertical',boxSizing:'border-box' }}
                  onFocus={e=>e.target.style.borderColor='#3b82f6'} onBlur={e=>e.target.style.borderColor='#e2e8f0'}
                  placeholder={'{
  "account_sid": "ACxxx",
  "auth_token": "xxx"
}'}
                />
              </div>

              <div style={{ display:'flex',gap:'10px',justifyContent:'flex-end',marginTop:'4px' }}>
                <PremiumButton variant="secondary" onClick={()=>setShowForm(false)}>Cancel</PremiumButton>
                <PremiumButton onClick={()=>createMut.mutate()} loading={createMut.isPending}>Save Credential</PremiumButton>
              </div>
            </div>
          </PremiumCard>
        </div>
      )}

      {isLoading ? <Loader /> : !credentials.length ? (
        <EmptyState icon="🔑" title="No credentials yet" description="Add API keys or OAuth connections to use in your workflows"
          action={<PremiumButton icon={Plus} onClick={()=>setShowForm(true)}>Add Credential</PremiumButton>}
        />
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(340px,1fr))', gap:'16px' }}>
          {credentials.map(cred=>{
            const meta = SERVICE_META[cred.service]||SERVICE_META.custom
            return (
              <PremiumCard key={cred._id} style={{ padding:'20px 24px' }}>
                <div style={{ display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:'14px' }}>
                  <div style={{ display:'flex',alignItems:'center',gap:'12px' }}>
                    <div style={{ width:'44px',height:'44px',borderRadius:'12px',background:`${meta.color}15`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'22px',flexShrink:0 }}>
                      {meta.icon}
                    </div>
                    <div>
                      <p style={{ fontSize:'15px',fontWeight:'700',color:'#0f172a' }}>{cred.name}</p>
                      <p style={{ fontSize:'12px',color:'#94a3b8',marginTop:'2px' }}>{meta.label} • {cred.authType}</p>
                    </div>
                  </div>
                  <div style={{ display:'flex',alignItems:'center',gap:'5px' }}>
                    {cred.isValid
                      ? <span style={{ display:'flex',alignItems:'center',gap:'4px',fontSize:'12px',color:'#16a34a',background:'#f0fdf4',padding:'3px 8px',borderRadius:'99px' }}><CheckCircle size={12}/>Valid</span>
                      : <span style={{ display:'flex',alignItems:'center',gap:'4px',fontSize:'12px',color:'#dc2626',background:'#fef2f2',padding:'3px 8px',borderRadius:'99px' }}><XCircle size={12}/>Invalid</span>
                    }
                  </div>
                </div>
                {cred.lastTestedAt && <p style={{ fontSize:'12px',color:'#94a3b8',marginBottom:'14px' }}>Last tested {timeAgo(cred.lastTestedAt)}</p>}
                <div style={{ display:'flex',gap:'8px',borderTop:'1px solid #f8fafc',paddingTop:'14px' }}>
                  <PremiumButton size="sm" variant="secondary" icon={Zap} onClick={()=>testMut.mutate(cred._id)} loading={testMut.isPending}>Test Connection</PremiumButton>
                  <PremiumButton size="sm" variant="ghost"     icon={Trash2} onClick={()=>{ if(confirm('Delete?')) deleteMut.mutate(cred._id) }} style={{ color:'#ef4444',marginLeft:'auto' }} />
                </div>
              </PremiumCard>
            )
          })}
        </div>
      )}
    </div>
  )
}

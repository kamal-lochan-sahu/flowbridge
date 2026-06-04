import { useState, useEffect } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Save, Download, User, Palette, Bell, Package } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../services/api'
import PageHeader    from '../components/ui/PageHeader'
import PremiumCard   from '../components/ui/PremiumCard'
import PremiumButton from '../components/ui/PremiumButton'

const TABS = [
  { key:'profile',       label:'Profile',       icon:User    },
  { key:'branding',      label:'Branding',      icon:Palette },
  { key:'notifications', label:'Notifications', icon:Bell    },
  { key:'export',        label:'Export/Import', icon:Package },
]

const Field = ({ label, hint, children }) => (
  <div style={{ marginBottom:'20px' }}>
    <label style={{ display:'block',fontSize:'13px',fontWeight:'600',color:'#374151',marginBottom:'6px' }}>{label}</label>
    {hint && <p style={{ fontSize:'12px',color:'#94a3b8',marginBottom:'8px' }}>{hint}</p>}
    {children}
  </div>
)

const TextInput = ({ value, onChange, placeholder, disabled }) => (
  <input value={value||''} onChange={onChange} placeholder={placeholder} disabled={disabled}
    style={{ width:'100%',padding:'10px 14px',border:'1px solid #e2e8f0',borderRadius:'10px',fontSize:'14px',outline:'none',boxSizing:'border-box',background:disabled?'#f8fafc':'white',color:disabled?'#94a3b8':'#0f172a' }}
    onFocus={e=>{ if(!disabled) e.target.style.borderColor='#3b82f6' }}
    onBlur={e=>e.target.style.borderColor='#e2e8f0'}
  />
)

export default function Settings() {
  const [tab,      setTab]      = useState('profile')
  const [profile,  setProfile]  = useState({ name:'', avatar:'' })
  const [branding, setBranding] = useState({ companyName:'', primaryColor:'#3b82f6', logo:'', domain:'' })
  const [notif,    setNotif]    = useState({ emailOnFailure:true, dailySummary:false })

  const { data:settings } = useQuery({ queryKey:['settings'], queryFn:()=>api.get('/settings').then(r=>r.data.data) })

  useEffect(()=>{
    if(settings){
      setProfile({ name:settings.profile?.name||'', avatar:settings.profile?.avatar||'' })
      setBranding(settings.branding||{ companyName:'',primaryColor:'#3b82f6',logo:'',domain:'' })
      setNotif(settings.notifications||{ emailOnFailure:true,dailySummary:false })
    }
  },[settings])

  const profileMut  = useMutation({ mutationFn:()=>api.put('/settings/profile',     profile),  onSuccess:()=>toast.success('Profile updated') })
  const brandingMut = useMutation({ mutationFn:()=>api.put('/settings/branding',    branding), onSuccess:()=>toast.success('Branding saved') })
  const notifMut    = useMutation({ mutationFn:()=>api.put('/settings/notifications',notif),    onSuccess:()=>{toast.success('Notification preferences saved!')} })

  const Toggle = ({ checked, onChange, label, hint }) => (
    <div style={{ display:'flex',alignItems:'flex-start',justifyContent:'space-between',padding:'16px',background:'#f8fafc',borderRadius:'12px',marginBottom:'10px' }}>
      <div>
        <p style={{ fontSize:'14px',fontWeight:'600',color:'#0f172a' }}>{label}</p>
        {hint && <p style={{ fontSize:'12px',color:'#94a3b8',marginTop:'2px' }}>{hint}</p>}
      </div>
      <div onClick={onChange} style={{ width:'44px',height:'24px',borderRadius:'99px',background:checked?'#3b82f6':'#e2e8f0',cursor:'pointer',position:'relative',transition:'background 0.2s',flexShrink:0,marginLeft:'16px' }}>
        <div style={{ position:'absolute',top:'3px',left:checked?'23px':'3px',width:'18px',height:'18px',borderRadius:'50%',background:'white',boxShadow:'0 1px 4px rgba(0,0,0,0.2)',transition:'left 0.2s' }} />
      </div>
    </div>
  )

  return (
    <div style={{ maxWidth:'620px' }}>
      <PageHeader title="Settings" subtitle="Manage your account, branding, and preferences" />

      {/* Tabs */}
      <div style={{ display:'flex',gap:'4px',background:'#f8fafc',padding:'4px',borderRadius:'12px',marginBottom:'24px',border:'1px solid #f1f5f9' }}>
        {TABS.map(t=>(
          <button key={t.key} onClick={()=>setTab(t.key)} style={{
            flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:'6px',
            padding:'8px 12px', borderRadius:'9px', border:'none', cursor:'pointer',
            fontSize:'13px', fontWeight:'600', transition:'all 0.15s',
            background:tab===t.key?'white':'transparent',
            color:tab===t.key?'#0f172a':'#64748b',
            boxShadow:tab===t.key?'0 1px 4px rgba(0,0,0,0.08)':'none',
          }}>
            <t.icon size={14}/>{t.label}
          </button>
        ))}
      </div>

      {tab==='profile' && (
        <PremiumCard style={{ padding:'24px' }}>
          <h3 style={{ fontSize:'15px',fontWeight:'700',color:'#0f172a',marginBottom:'20px' }}>Profile Settings</h3>
          <Field label="Full Name"><TextInput value={profile.name} onChange={e=>setProfile(p=>({...p,name:e.target.value}))} placeholder="Your name" /></Field>
          <Field label="Email"><TextInput value={settings?.profile?.email} disabled /></Field>
          <div style={{ padding:'12px 14px',background:'#f8fafc',borderRadius:'10px',marginBottom:'20px',display:'flex',gap:'16px' }}>
            <div><p style={{ fontSize:'11px',fontWeight:'700',color:'#94a3b8',textTransform:'uppercase',marginBottom:'3px' }}>Role</p><p style={{ fontSize:'14px',fontWeight:'600',color:'#0f172a',textTransform:'capitalize' }}>{settings?.profile?.role}</p></div>
            <div style={{ width:'1px',background:'#e2e8f0' }}/>
            <div><p style={{ fontSize:'11px',fontWeight:'700',color:'#94a3b8',textTransform:'uppercase',marginBottom:'3px' }}>Plan</p><p style={{ fontSize:'14px',fontWeight:'600',color:'#3b82f6',textTransform:'capitalize' }}>{settings?.plan}</p></div>
          </div>
          <PremiumButton icon={Save} onClick={()=>profileMut.mutate()} loading={profileMut.isPending}>Save Changes</PremiumButton>
        </PremiumCard>
      )}

      {tab==='branding' && (
        <PremiumCard style={{ padding:'24px' }}>
          <h3 style={{ fontSize:'15px',fontWeight:'700',color:'#0f172a',marginBottom:'4px' }}>White Label Branding</h3>
          <p style={{ fontSize:'13px',color:'#94a3b8',marginBottom:'20px' }}>Customize the platform with your client's brand</p>
          <Field label="Company Name" hint="Appears in the top navigation bar">
            <TextInput value={branding.companyName} onChange={e=>setBranding(p=>({...p,companyName:e.target.value}))} placeholder="Acme Corp" />
          </Field>
          <Field label="Logo URL" hint="Direct link to your company logo image">
            <TextInput value={branding.logo} onChange={e=>setBranding(p=>({...p,logo:e.target.value}))} placeholder="https://example.com/logo.png" />
          </Field>
          <Field label="Custom Domain" hint="Your white-label domain (e.g. flows.yourcompany.com)">
            <TextInput value={branding.domain} onChange={e=>setBranding(p=>({...p,domain:e.target.value}))} placeholder="flows.yourcompany.com" />
          </Field>
          <Field label="Primary Color">
            <div style={{ display:'flex',alignItems:'center',gap:'12px' }}>
              <input type="color" value={branding.primaryColor} onChange={e=>setBranding(p=>({...p,primaryColor:e.target.value}))}
                style={{ width:'48px',height:'40px',borderRadius:'10px',border:'1px solid #e2e8f0',cursor:'pointer',padding:'2px' }} />
              <div style={{ padding:'10px 14px',background:'#f8fafc',borderRadius:'10px',fontSize:'14px',color:'#374151',fontFamily:'monospace',border:'1px solid #e2e8f0',fontWeight:'600' }}>
                {branding.primaryColor}
              </div>
              <div style={{ width:'40px',height:'40px',borderRadius:'10px',background:branding.primaryColor,boxShadow:`0 2px 8px ${branding.primaryColor}50` }} />
            </div>
          </Field>
          <PremiumButton icon={Save} onClick={()=>brandingMut.mutate()} loading={brandingMut.isPending}>Save Branding</PremiumButton>
        </PremiumCard>
      )}

      {tab==='notifications' && (
        <PremiumCard style={{ padding:'24px' }}>
          <h3 style={{ fontSize:'15px',fontWeight:'700',color:'#0f172a',marginBottom:'4px' }}>Notification Preferences</h3>
          <p style={{ fontSize:'13px',color:'#94a3b8',marginBottom:'20px' }}>Choose when and how you want to be notified</p>
          <Toggle checked={notif.emailOnFailure} onChange={()=>setNotif(p=>({...p,emailOnFailure:!p.emailOnFailure}))}
            label="Email on workflow failure" hint="Get notified immediately when a workflow fails" />
          <Toggle checked={notif.dailySummary} onChange={()=>setNotif(p=>({...p,dailySummary:!p.dailySummary}))}
            label="Daily summary email" hint="Receive a daily report of all workflow executions" />
          <div style={{ marginTop:'16px' }}>
            <PremiumButton icon={Save} onClick={()=>notifMut.mutate()} loading={notifMut.isPending}>Save Preferences</PremiumButton>
          </div>
        </PremiumCard>
      )}

      {tab==='export' && (
        <PremiumCard style={{ padding:'24px' }}>
          <h3 style={{ fontSize:'15px',fontWeight:'700',color:'#0f172a',marginBottom:'4px' }}>Export & Import</h3>
          <p style={{ fontSize:'13px',color:'#94a3b8',marginBottom:'20px' }}>Backup and restore your workflow configurations</p>
          <div style={{ padding:'20px',background:'#f8fafc',borderRadius:'12px',border:'1px solid #f1f5f9',marginBottom:'12px' }}>
            <div style={{ display:'flex',alignItems:'center',gap:'12px',marginBottom:'12px' }}>
              <div style={{ width:'40px',height:'40px',borderRadius:'10px',background:'#eff6ff',display:'flex',alignItems:'center',justifyContent:'center' }}>
                <Download size={18} color="#3b82f6"/>
              </div>
              <div>
                <p style={{ fontSize:'14px',fontWeight:'600',color:'#0f172a' }}>Export Workflows</p>
                <p style={{ fontSize:'12px',color:'#94a3b8',marginTop:'2px' }}>Download all workflows as JSON backup file</p>
              </div>
            </div>
            <PremiumButton variant="secondary" icon={Download} size="sm" onClick={async ()=>{
                try {
                  const res = await fetch('/api/settings/export', { headers:{ Authorization:`Bearer ${localStorage.getItem('accessToken')}` }})
                  const blob = await res.blob()
                  const url  = URL.createObjectURL(blob)
                  const a    = document.createElement('a')
                  a.href     = url
                  a.download = `flowbridge-export-${Date.now()}.json`
                  a.click()
                  URL.revokeObjectURL(url)
                } catch(e) { alert('Export failed') }
              }}>
              Download Export File
            </PremiumButton>
          </div>
        </PremiumCard>
      )}
    </div>
  )
}

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { CheckCheck, Bell } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../services/api'
import { KEYS }      from '../config/queryKeys'
import { timeAgo }   from '../utils/formatDate'
import Loader        from '../components/common/Loader'
import EmptyState    from '../components/common/EmptyState'
import PageHeader    from '../components/ui/PageHeader'
import PremiumCard   from '../components/ui/PremiumCard'
import PremiumButton from '../components/ui/PremiumButton'

const TYPE_META = {
  workflow_failed:    { color:'#ef4444', bg:'#fef2f2', label:'Workflow Failed' },
  workflow_success:   { color:'#16a34a', bg:'#f0fdf4', label:'Success' },
  credential_expired: { color:'#d97706', bg:'#fffbeb', label:'Credential Expired' },
  system:             { color:'#2563eb', bg:'#eff6ff', label:'System' },
}

export default function Notifications() {
  const queryClient = useQueryClient()
  const { data, isLoading } = useQuery({ queryKey:KEYS.NOTIFICATIONS, queryFn:()=>api.get('/notifications').then(r=>r.data.data) })

  const markAllMut = useMutation({
    mutationFn: ()=>api.put('/notifications/read-all'),
    onSuccess:  ()=>{ queryClient.invalidateQueries({queryKey:KEYS.NOTIFICATIONS}); queryClient.invalidateQueries({queryKey:KEYS.UNREAD_COUNT}); toast.success('All marked as read') },
  })
  const markOneMut = useMutation({
    mutationFn: (id)=>api.put(`/notifications/${id}/read`),
    onSuccess:  ()=>{ queryClient.invalidateQueries({queryKey:KEYS.NOTIFICATIONS}); queryClient.invalidateQueries({queryKey:KEYS.UNREAD_COUNT}) },
  })

  const notifications = data||[]
  const unreadCount   = notifications.filter(n=>!n.isRead).length

  return (
    <div style={{ maxWidth:'680px' }}>
      <PageHeader
        title="Notifications"
        subtitle={`${unreadCount} unread`}
        action={unreadCount>0 && <PremiumButton variant="secondary" icon={CheckCheck} size="sm" onClick={()=>markAllMut.mutate()}>Mark all read</PremiumButton>}
      />

      {isLoading ? <Loader /> : !notifications.length ? (
        <EmptyState icon="🔔" title="No notifications" description="You're all caught up! Notifications will appear here when workflows run or fail." />
      ) : (
        <PremiumCard>
          {notifications.map((n,i)=>{
            const meta = TYPE_META[n.type]||TYPE_META.system
            return (
              <div key={n._id} onClick={()=>!n.isRead&&markOneMut.mutate(n._id)}
                style={{ display:'flex',alignItems:'flex-start',gap:'14px',padding:'16px 20px',borderBottom:i<notifications.length-1?'1px solid #f8fafc':'none',cursor:!n.isRead?'pointer':'default',background:!n.isRead?'#fafbff':'white',transition:'background 0.15s' }}
                onMouseEnter={e=>{if(!n.isRead)e.currentTarget.style.background='#f5f7ff'}}
                onMouseLeave={e=>{if(!n.isRead)e.currentTarget.style.background='#fafbff'}}
              >
                <div style={{ width:'36px',height:'36px',borderRadius:'10px',background:meta.bg,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
                  <Bell size={16} color={meta.color} />
                </div>
                <div style={{ flex:1,minWidth:0 }}>
                  <div style={{ display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:'12px' }}>
                    <div>
                      <p style={{ fontSize:'14px',fontWeight:'600',color:'#0f172a' }}>{n.title}</p>
                      <p style={{ fontSize:'13px',color:'#64748b',marginTop:'2px',lineHeight:'1.5' }}>{n.message}</p>
                    </div>
                    <div style={{ display:'flex',flexDirection:'column',alignItems:'flex-end',gap:'6px',flexShrink:0 }}>
                      <span style={{ fontSize:'11px',fontWeight:'600',padding:'2px 8px',borderRadius:'99px',background:meta.bg,color:meta.color }}>{meta.label}</span>
                      <span style={{ fontSize:'11px',color:'#94a3b8' }}>{timeAgo(n.createdAt)}</span>
                    </div>
                  </div>
                </div>
                {!n.isRead && <div style={{ width:'8px',height:'8px',borderRadius:'50%',background:'#3b82f6',flexShrink:0,marginTop:'6px' }} />}
              </div>
            )
          })}
        </PremiumCard>
      )}
    </div>
  )
}

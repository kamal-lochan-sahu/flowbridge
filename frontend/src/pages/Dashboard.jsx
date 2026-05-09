import { useQuery }    from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import { Zap, CheckCircle, XCircle, Activity, TrendingUp, Plus, ArrowRight } from 'lucide-react'
import { dashboardService } from '../services/log.service'
import { KEYS }             from '../config/queryKeys'
import { formatDuration, timeAgo } from '../utils/formatDate'
import Loader        from '../components/common/Loader'
import PageHeader    from '../components/ui/PageHeader'
import PremiumCard   from '../components/ui/PremiumCard'
import PremiumButton from '../components/ui/PremiumButton'
import StatusBadge   from '../components/ui/StatusBadge'

const StatCard = ({ label, value, sub, icon:Icon, gradient, light }) => (
  <PremiumCard style={{ padding:'20px' }}>
    <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between' }}>
      <div>
        <p style={{ fontSize:'13px', color:'#64748b', fontWeight:'500', marginBottom:'8px' }}>{label}</p>
        <p style={{ fontSize:'30px', fontWeight:'800', color:'#0f172a', letterSpacing:'-1px', lineHeight:1 }}>{value}</p>
        {sub && <p style={{ fontSize:'12px', color:'#94a3b8', marginTop:'6px' }}>{sub}</p>}
      </div>
      <div style={{ width:'44px',height:'44px',borderRadius:'12px',background:gradient,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,boxShadow:`0 4px 12px ${light}` }}>
        <Icon size={20} color="white" />
      </div>
    </div>
  </PremiumCard>
)

const CustomTooltip = ({ active, payload, label }) => {
  if (!active||!payload?.length) return null
  return (
    <div style={{ background:'white',border:'1px solid #f1f5f9',borderRadius:'10px',padding:'10px 14px',boxShadow:'0 4px 20px rgba(0,0,0,0.1)',fontSize:'13px' }}>
      <p style={{ fontWeight:'600',color:'#374151',marginBottom:'4px' }}>{label}</p>
      {payload.map(p => <p key={p.name} style={{ color:p.fill,marginTop:'2px' }}>{p.name}: <strong>{p.value}</strong></p>)}
    </div>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { data:stats,  isLoading:sl } = useQuery({ queryKey:KEYS.DASHBOARD_STATS,  queryFn:()=>dashboardService.getStats().then(r=>r.data.data) })
  const { data:chart,  isLoading:cl } = useQuery({ queryKey:KEYS.DASHBOARD_CHART,  queryFn:()=>dashboardService.getChart().then(r=>r.data.data.chart) })
  const { data:recent, isLoading:rl } = useQuery({ queryKey:KEYS.DASHBOARD_RECENT, queryFn:()=>dashboardService.getRecent().then(r=>r.data.data.activity) })

  if (sl) return <Loader text="Loading dashboard..." />

  const pieData = [
    { name:'Success', value:stats?.successToday||0, color:'#22c55e' },
    { name:'Failed',  value:stats?.failedToday||0,  color:'#ef4444' },
  ]

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle="Welcome back! Here's your automation overview."
        action={<PremiumButton icon={Plus} onClick={()=>navigate('/workflows/new')}>New Workflow</PremiumButton>}
      />

      {/* Stats Row */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'16px', marginBottom:'24px' }}>
        <StatCard label="Active Workflows" value={stats?.activeWorkflows||0} sub={`${stats?.totalWorkflows||0} total`}
          icon={Zap} gradient="linear-gradient(135deg,#3b82f6,#6366f1)" light="#3b82f630" />
        <StatCard label="Runs Today" value={stats?.runs?.today||0} sub={`${stats?.runs?.week||0} this week`}
          icon={Activity} gradient="linear-gradient(135deg,#8b5cf6,#a855f7)" light="#8b5cf630" />
        <StatCard label="Success Rate" value={`${stats?.successRate||0}%`} sub="Today's performance"
          icon={TrendingUp} gradient="linear-gradient(135deg,#10b981,#059669)" light="#10b98130" />
        <StatCard label="Failed Today" value={stats?.failedToday||0} sub="Needs attention"
          icon={XCircle} gradient="linear-gradient(135deg,#ef4444,#dc2626)" light="#ef444430" />
      </div>

      {/* Charts Row */}
      <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:'16px', marginBottom:'24px' }}>
        <PremiumCard style={{ padding:'24px' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'20px' }}>
            <div>
              <h3 style={{ fontSize:'15px', fontWeight:'700', color:'#0f172a' }}>Workflow Runs</h3>
              <p style={{ fontSize:'12px', color:'#94a3b8', marginTop:'2px' }}>Last 7 days</p>
            </div>
            <div style={{ display:'flex', gap:'12px', fontSize:'12px' }}>
              <span style={{ display:'flex', alignItems:'center', gap:'5px', color:'#64748b' }}><span style={{ width:'10px',height:'10px',background:'#3b82f6',borderRadius:'3px',display:'inline-block' }}/>Success</span>
              <span style={{ display:'flex', alignItems:'center', gap:'5px', color:'#64748b' }}><span style={{ width:'10px',height:'10px',background:'#fca5a5',borderRadius:'3px',display:'inline-block' }}/>Failed</span>
            </div>
          </div>
          {cl ? <Loader /> : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={chart||[]} barSize={20} barGap={4}>
                <XAxis dataKey="day" tick={{ fontSize:12, fill:'#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize:12, fill:'#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill:'#f8fafc' }} />
                <Bar dataKey="success" fill="#3b82f6" radius={[5,5,0,0]} name="Success" />
                <Bar dataKey="failed"  fill="#fca5a5" radius={[5,5,0,0]} name="Failed" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </PremiumCard>

        <PremiumCard style={{ padding:'24px' }}>
          <h3 style={{ fontSize:'15px', fontWeight:'700', color:'#0f172a', marginBottom:'4px' }}>Today's Summary</h3>
          <p style={{ fontSize:'12px', color:'#94a3b8', marginBottom:'20px' }}>Success vs Failed</p>
          <ResponsiveContainer width="100%" height={140}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} dataKey="value" paddingAngle={3}>
                {pieData.map((e,i) => <Cell key={i} fill={e.color} />)}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display:'flex', justifyContent:'center', gap:'16px', marginTop:'8px' }}>
            {pieData.map(e => (
              <div key={e.name} style={{ display:'flex', alignItems:'center', gap:'6px' }}>
                <div style={{ width:'8px',height:'8px',borderRadius:'50%',background:e.color }} />
                <span style={{ fontSize:'12px', color:'#64748b' }}>{e.name}: <strong>{e.value}</strong></span>
              </div>
            ))}
          </div>
          {stats?.mostActive && (
            <div style={{ marginTop:'16px', paddingTop:'16px', borderTop:'1px solid #f1f5f9' }}>
              <p style={{ fontSize:'11px', color:'#94a3b8', marginBottom:'4px' }}>MOST ACTIVE</p>
              <p style={{ fontSize:'13px', fontWeight:'600', color:'#0f172a' }}>{stats.mostActive.name}</p>
              <div style={{ display:'flex', gap:'12px', marginTop:'6px' }}>
                <span style={{ fontSize:'12px', color:'#64748b' }}>Runs: <strong>{stats.mostActive.stats.totalRuns}</strong></span>
                <span style={{ fontSize:'12px', color:'#16a34a' }}>✓ {stats.mostActive.stats.successRuns}</span>
              </div>
            </div>
          )}
        </PremiumCard>
      </div>

      {/* Recent Activity */}
      <PremiumCard style={{ padding:'24px' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'20px' }}>
          <div>
            <h3 style={{ fontSize:'15px', fontWeight:'700', color:'#0f172a' }}>Recent Activity</h3>
            <p style={{ fontSize:'12px', color:'#94a3b8', marginTop:'2px' }}>Latest workflow executions</p>
          </div>
          <PremiumButton variant="ghost" size="sm" onClick={()=>navigate('/logs')} icon={ArrowRight}>View All</PremiumButton>
        </div>
        {rl ? <Loader /> : !recent?.length ? (
          <div style={{ textAlign:'center', padding:'32px', color:'#94a3b8' }}>
            <p style={{ fontSize:'14px' }}>No activity yet — trigger a workflow to see logs here</p>
          </div>
        ) : (
          <div>
            {recent.map((log,i) => (
              <div key={log._id} onClick={()=>navigate(`/logs/${log._id}`)}
                style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 0', borderBottom:i<recent.length-1?'1px solid #f8fafc':'none', cursor:'pointer', transition:'all 0.15s' }}
                onMouseEnter={e=>e.currentTarget.style.paddingLeft='4px'}
                onMouseLeave={e=>e.currentTarget.style.paddingLeft='0'}
              >
                <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
                  {log.status==='success'
                    ? <CheckCircle size={18} color="#22c55e" />
                    : <XCircle    size={18} color="#ef4444" />
                  }
                  <div>
                    <p style={{ fontSize:'14px', fontWeight:'600', color:'#0f172a' }}>{log.workflowId?.name||'Unknown'}</p>
                    <p style={{ fontSize:'12px', color:'#94a3b8', marginTop:'2px' }}>{log.triggerType} • {formatDuration(log.duration)}</p>
                  </div>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
                  <StatusBadge status={log.status} />
                  <span style={{ fontSize:'12px', color:'#cbd5e1', minWidth:'60px', textAlign:'right' }}>{timeAgo(log.createdAt)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </PremiumCard>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}

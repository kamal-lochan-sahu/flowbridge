import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { Zap, CheckCircle, XCircle, Activity, TrendingUp, Plus } from 'lucide-react'
import { dashboardService } from '../services/log.service'
import { KEYS } from '../config/queryKeys'
import { formatDuration, timeAgo } from '../utils/formatDate'
import Loader from '../components/common/Loader'
import Card   from '../components/ui/Card'
import Badge  from '../components/ui/Badge'
import Button from '../components/ui/Button'

const StatCard = ({ label, value, sub, icon: Icon, color }) => (
  <Card className="p-5">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
      </div>
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
        <Icon size={20} className="text-white" />
      </div>
    </div>
  </Card>
)

export default function Dashboard() {
  const navigate = useNavigate()

  const { data: stats,  isLoading: sl } = useQuery({ queryKey: KEYS.DASHBOARD_STATS,  queryFn: () => dashboardService.getStats().then(r => r.data.data) })
  const { data: chart,  isLoading: cl } = useQuery({ queryKey: KEYS.DASHBOARD_CHART,  queryFn: () => dashboardService.getChart().then(r => r.data.data.chart) })
  const { data: recent, isLoading: rl } = useQuery({ queryKey: KEYS.DASHBOARD_RECENT, queryFn: () => dashboardService.getRecent().then(r => r.data.data.activity) })

  if (sl) return <Loader text="Loading dashboard..." />

  const pieData = [
    { name: 'Success', value: stats?.successToday || 0, color: '#10b981' },
    { name: 'Failed',  value: stats?.failedToday  || 0, color: '#ef4444' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Welcome back! Here's what's happening.</p>
        </div>
        <Button icon={Plus} onClick={() => navigate('/workflows/new')}>New Workflow</Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Active Workflows" value={stats?.activeWorkflows || 0}
          sub={`${stats?.totalWorkflows || 0} total`} icon={Zap} color="bg-blue-500" />
        <StatCard label="Runs Today" value={stats?.runs?.today || 0}
          sub={`${stats?.runs?.week || 0} this week`} icon={Activity} color="bg-purple-500" />
        <StatCard label="Success Rate" value={`${stats?.successRate || 0}%`}
          sub="Today" icon={TrendingUp} color="bg-green-500" />
        <StatCard label="Failed Today" value={stats?.failedToday || 0}
          sub="Needs attention" icon={XCircle} color="bg-red-500" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bar Chart */}
        <Card className="p-5 lg:col-span-2">
          <h3 className="font-semibold text-gray-800 mb-4">Runs — Last 7 Days</h3>
          {cl ? <Loader /> : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chart || []}>
                <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="success" fill="#10b981" radius={[4,4,0,0]} name="Success" />
                <Bar dataKey="failed"  fill="#ef4444" radius={[4,4,0,0]} name="Failed" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>

        {/* Pie Chart */}
        <Card className="p-5">
          <h3 className="font-semibold text-gray-800 mb-4">Today's Summary</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value">
                {pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-4 mt-2">
            {pieData.map(e => (
              <div key={e.name} className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full" style={{ background: e.color }} />
                <span className="text-xs text-gray-600">{e.name}: {e.value}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Recent Activity + Most Active */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-5 lg:col-span-2">
          <h3 className="font-semibold text-gray-800 mb-4">Recent Activity</h3>
          {rl ? <Loader /> : !recent?.length ? (
            <p className="text-sm text-gray-400 text-center py-8">No activity yet</p>
          ) : (
            <div className="space-y-3">
              {recent.map(log => (
                <div key={log._id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                  onClick={() => navigate(`/logs/${log._id}`)} style={{ cursor: 'pointer' }}>
                  <div className="flex items-center gap-3">
                    {log.status === 'success'
                      ? <CheckCircle size={16} className="text-green-500" />
                      : <XCircle size={16} className="text-red-500" />}
                    <div>
                      <p className="text-sm font-medium text-gray-800">{log.workflowId?.name || 'Unknown'}</p>
                      <p className="text-xs text-gray-400">{log.triggerType} • {formatDuration(log.duration)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant={log.status === 'success' ? 'success' : 'danger'}>{log.status}</Badge>
                    <p className="text-xs text-gray-400 mt-1">{timeAgo(log.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-5">
          <h3 className="font-semibold text-gray-800 mb-4">Most Active</h3>
          {stats?.mostActive ? (
            <div className="space-y-3">
              <p className="font-medium text-gray-800">{stats.mostActive.name}</p>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Total Runs</span>
                  <span className="font-medium">{stats.mostActive.stats.totalRuns}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Success</span>
                  <span className="font-medium text-green-600">{stats.mostActive.stats.successRuns}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2 mt-2">
                  <div className="bg-green-500 h-2 rounded-full"
                    style={{ width: `${stats.mostActive.stats.totalRuns > 0 ? (stats.mostActive.stats.successRuns / stats.mostActive.stats.totalRuns) * 100 : 0}%` }} />
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-8">No workflows yet</p>
          )}

          <div className="mt-6 pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-500 mb-1">Plan</p>
            <Badge variant="info">Free</Badge>
          </div>
        </Card>
      </div>
    </div>
  )
}

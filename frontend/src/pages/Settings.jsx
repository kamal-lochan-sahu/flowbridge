import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Save, Download } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../services/api'
import { KEYS } from '../config/queryKeys'
import Button from '../components/ui/Button'
import Input  from '../components/ui/Input'
import Card   from '../components/ui/Card'

export default function Settings() {
  const queryClient = useQueryClient()
  const [tab, setTab] = useState('profile')
  const [profile, setProfile] = useState({ name: '', avatar: '' })
  const [branding, setBranding] = useState({ companyName: '', primaryColor: '#3b82f6', logo: '', domain: '' })
  const [notif, setNotif] = useState({ emailOnFailure: true, dailySummary: false })

  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn:  () => api.get('/settings').then(r => r.data.data),
  })

  useEffect(() => {
    if (settings) {
      setProfile({ name: settings.profile?.name || '', avatar: settings.profile?.avatar || '' })
      setBranding(settings.branding || {})
      setNotif(settings.notifications || {})
    }
  }, [settings])

  const profileMutation = useMutation({
    mutationFn: () => api.put('/settings/profile', profile),
    onSuccess:  () => toast.success('Profile updated'),
  })

  const brandingMutation = useMutation({
    mutationFn: () => api.put('/settings/branding', branding),
    onSuccess:  () => toast.success('Branding updated'),
  })

  const notifMutation = useMutation({
    mutationFn: () => api.put('/settings/notifications', notif),
    onSuccess:  () => toast.success('Preferences saved'),
  })

  const TABS = [
    { key: 'profile',       label: '👤 Profile' },
    { key: 'branding',      label: '🎨 Branding' },
    { key: 'notifications', label: '🔔 Notifications' },
    { key: 'export',        label: '📦 Export/Import' },
  ]

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 text-sm mt-1">Manage your account and preferences</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab === t.key ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Profile */}
      {tab === 'profile' && (
        <Card className="p-5 space-y-4">
          <h2 className="font-semibold text-gray-800">Profile Settings</h2>
          <Input label="Full Name" value={profile.name} onChange={e => setProfile(p => ({...p, name: e.target.value}))} />
          <div>
            <p className="text-sm text-gray-500">Email: {settings?.profile?.email}</p>
            <p className="text-sm text-gray-500 mt-1">Role: {settings?.profile?.role}</p>
            <p className="text-sm text-gray-500 mt-1">Plan: {settings?.plan}</p>
          </div>
          <Button icon={Save} onClick={() => profileMutation.mutate()} loading={profileMutation.isPending}>Save</Button>
        </Card>
      )}

      {/* Branding */}
      {tab === 'branding' && (
        <Card className="p-5 space-y-4">
          <h2 className="font-semibold text-gray-800">White Label Branding</h2>
          <Input label="Company Name" value={branding.companyName} onChange={e => setBranding(p => ({...p, companyName: e.target.value}))} />
          <Input label="Logo URL"     value={branding.logo}        onChange={e => setBranding(p => ({...p, logo: e.target.value}))} />
          <Input label="Custom Domain"value={branding.domain}      onChange={e => setBranding(p => ({...p, domain: e.target.value}))} />
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Primary Color</label>
            <div className="flex items-center gap-3">
              <input type="color" value={branding.primaryColor}
                onChange={e => setBranding(p => ({...p, primaryColor: e.target.value}))}
                className="w-12 h-10 rounded cursor-pointer border border-gray-300" />
              <span className="text-sm text-gray-600">{branding.primaryColor}</span>
            </div>
          </div>
          <Button icon={Save} onClick={() => brandingMutation.mutate()} loading={brandingMutation.isPending}>Save Branding</Button>
        </Card>
      )}

      {/* Notifications */}
      {tab === 'notifications' && (
        <Card className="p-5 space-y-4">
          <h2 className="font-semibold text-gray-800">Notification Preferences</h2>
          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <p className="text-sm font-medium text-gray-800">Email on workflow failure</p>
              <p className="text-xs text-gray-500">Get notified when a workflow fails</p>
            </div>
            <input type="checkbox" checked={notif.emailOnFailure}
              onChange={e => setNotif(p => ({...p, emailOnFailure: e.target.checked}))}
              className="w-4 h-4 text-blue-600" />
          </label>
          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <p className="text-sm font-medium text-gray-800">Daily summary email</p>
              <p className="text-xs text-gray-500">Receive a daily report of all workflow runs</p>
            </div>
            <input type="checkbox" checked={notif.dailySummary}
              onChange={e => setNotif(p => ({...p, dailySummary: e.target.checked}))}
              className="w-4 h-4 text-blue-600" />
          </label>
          <Button icon={Save} onClick={() => notifMutation.mutate()} loading={notifMutation.isPending}>Save</Button>
        </Card>
      )}

      {/* Export */}
      {tab === 'export' && (
        <Card className="p-5 space-y-4">
          <h2 className="font-semibold text-gray-800">Export & Import</h2>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm font-medium text-gray-800">Export Workflows</p>
            <p className="text-xs text-gray-500 mt-1">Download all your workflows as JSON backup</p>
            <Button className="mt-3" icon={Download} variant="secondary"
              onClick={() => window.open('/api/settings/export')}>
              Download Export
            </Button>
          </div>
        </Card>
      )}
    </div>
  )
}

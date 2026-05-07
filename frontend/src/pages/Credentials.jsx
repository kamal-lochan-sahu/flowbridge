import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2, TestTube, CheckCircle, XCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { credentialService } from '../services/credential.service'
import { KEYS } from '../config/queryKeys'
import { timeAgo } from '../utils/formatDate'
import Loader     from '../components/common/Loader'
import EmptyState from '../components/common/EmptyState'
import Button     from '../components/ui/Button'
import Badge      from '../components/ui/Badge'
import Card       from '../components/ui/Card'
import Input      from '../components/ui/Input'

const SERVICES = ['gmail','google-sheets','twilio','shopify','slack','mongodb','custom']

export default function Credentials() {
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name:'', service:'twilio', authType:'api_key', credentials:'{}' })

  const { data, isLoading } = useQuery({
    queryKey: KEYS.CREDENTIALS,
    queryFn:  () => credentialService.getAll().then(r => r.data.data.credentials),
  })

  const createMutation = useMutation({
    mutationFn: () => credentialService.create({
      ...form,
      credentials: JSON.parse(form.credentials),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEYS.CREDENTIALS })
      toast.success('Credential added')
      setShowForm(false)
      setForm({ name:'', service:'twilio', authType:'api_key', credentials:'{}' })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => credentialService.delete(id),
    onSuccess:  () => { queryClient.invalidateQueries({ queryKey: KEYS.CREDENTIALS }); toast.success('Deleted') },
  })

  const testMutation = useMutation({
    mutationFn: (id) => credentialService.test(id),
    onSuccess:  (res) => {
      queryClient.invalidateQueries({ queryKey: KEYS.CREDENTIALS })
      const r = res.data.data
      r.success ? toast.success(r.message) : toast.error(r.message)
    },
  })

  const credentials = data || []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Credentials</h1>
          <p className="text-gray-500 text-sm mt-1">Manage API keys and OAuth connections</p>
        </div>
        <Button icon={Plus} onClick={() => setShowForm(!showForm)}>Add Credential</Button>
      </div>

      {/* Add Form */}
      {showForm && (
        <Card className="p-5 space-y-4 border-blue-200 bg-blue-50">
          <h3 className="font-semibold text-gray-800">New Credential</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Input label="Name" value={form.name} onChange={e => setForm(p => ({...p, name: e.target.value}))} placeholder="My Twilio" />
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Service</label>
              <select value={form.service} onChange={e => setForm(p => ({...p, service: e.target.value}))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none">
                {SERVICES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Auth Type</label>
              <select value={form.authType} onChange={e => setForm(p => ({...p, authType: e.target.value}))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none">
                <option value="api_key">API Key</option>
                <option value="oauth2">OAuth2</option>
                <option value="basic">Basic Auth</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Credentials (JSON)</label>
            <textarea value={form.credentials} onChange={e => setForm(p => ({...p, credentials: e.target.value}))}
              rows={4} placeholder='{"account_sid":"AC...","auth_token":"..."}'
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="flex gap-2">
            <Button onClick={() => createMutation.mutate()} loading={createMutation.isPending}>Save</Button>
            <Button variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </Card>
      )}

      {/* List */}
      {isLoading ? <Loader /> : !credentials.length ? (
        <EmptyState icon="🔑" title="No credentials yet"
          description="Add API keys or OAuth connections for your integrations"
          action={<Button icon={Plus} onClick={() => setShowForm(true)}>Add Credential</Button>}
        />
      ) : (
        <div className="grid gap-4">
          {credentials.map(cred => (
            <Card key={cred._id} className="p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-xl">
                    {cred.service === 'gmail' ? '📧' : cred.service === 'twilio' ? '📱' : cred.service === 'slack' ? '💬' : '🔑'}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{cred.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge variant="info">{cred.service}</Badge>
                      <Badge variant="default">{cred.authType}</Badge>
                      {cred.isValid
                        ? <span className="flex items-center gap-1 text-xs text-green-600"><CheckCircle size={12} /> Valid</span>
                        : <span className="flex items-center gap-1 text-xs text-red-600"><XCircle size={12} /> Invalid</span>
                      }
                    </div>
                    {cred.lastTestedAt && <p className="text-xs text-gray-400 mt-0.5">Tested {timeAgo(cred.lastTestedAt)}</p>}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="secondary" icon={TestTube}
                    onClick={() => testMutation.mutate(cred._id)}
                    loading={testMutation.isPending}>Test</Button>
                  <Button size="sm" variant="ghost" icon={Trash2}
                    onClick={() => { if(confirm('Delete?')) deleteMutation.mutate(cred._id) }}
                    className="text-red-500" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

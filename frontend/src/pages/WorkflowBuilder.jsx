import { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Save, Play, ArrowLeft, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import toast from 'react-hot-toast'
import { workflowService, triggerService, actionService } from '../services/workflow.service'
import { KEYS } from '../config/queryKeys'
import { SERVICE_ICONS, TRIGGER_ICONS } from '../utils/constants'
import Loader from '../components/common/Loader'
import Button from '../components/ui/Button'
import Card   from '../components/ui/Card'
import Badge  from '../components/ui/Badge'
import Input  from '../components/ui/Input'

const SERVICES = ['gmail','google-sheets','twilio','pdf-generator','http-request','slack','mongodb','filter','delay']
const ACTION_TYPES = {
  'gmail':          ['send_email'],
  'google-sheets':  ['append_row','read_row','update_row'],
  'twilio':         ['send_sms','send_whatsapp'],
  'pdf-generator':  ['generate_pdf'],
  'http-request':   ['request'],
  'slack':          ['send_message'],
  'mongodb':        ['insert_document','find_document','update_document'],
  'filter':         ['condition'],
  'delay':          ['wait'],
}

export default function WorkflowBuilder() {
  const { id }       = useParams()
  const navigate     = useNavigate()
  const location     = useLocation()
  const queryClient  = useQueryClient()
  const isEdit       = !!id

  const [name, setName]             = useState(location.state?.templateName || '')
  const [description, setDesc]      = useState(location.state?.templateDesc || '')
  const [triggerType, setTrigger]   = useState('webhook')
  const [actions, setActions]       = useState([])
  const [cronExpr, setCron]         = useState('0 9 * * *')
  const [saved, setSaved]           = useState(false)
  const [workflowId, setWorkflowId] = useState(id || null)

  const { data: wfData, isLoading } = useQuery({
    queryKey: KEYS.WORKFLOW(id),
    queryFn:  () => workflowService.getOne(id).then(r => r.data.data.workflow),
    enabled:  isEdit,
    retry: false,
    throwOnError: false,
    meta: { onError: (err) => { navigate('/not-found') } },
  })

  useEffect(() => {
    if (isEdit && !isLoading && !wfData) {
      navigate('/not-found')
    }
  }, [isEdit, isLoading, wfData])

  useEffect(() => {
    if (wfData) {
      setName(wfData.name || '')
      setDesc(wfData.description || '')
      setSaved(true)
    }
  }, [wfData])

  const saveMutation = useMutation({
    mutationFn: async () => {
      let wId = workflowId
      if (!wId) {
        const res = await workflowService.create({ name, description })
        wId = res.data.data.workflow._id
        setWorkflowId(wId)
      } else {
        await workflowService.update(wId, { name, description })
      }

      // Save trigger
      await triggerService.create({
        workflowId: wId, type: triggerType,
        schedule: triggerType === 'schedule' ? { cronExpression: cronExpr, humanReadable: cronExpr } : undefined,
      })

      // Save actions
      for (let i = 0; i < actions.length; i++) {
        await actionService.create({
          workflowId: wId,
          order: i + 1,
          service: actions[i].service,
          actionType: actions[i].actionType,
          config: actions[i].config || {},
        })
      }

      return wId
    },
    onSuccess: (wId) => {
      setSaved(true)
      queryClient.invalidateQueries({ queryKey: ['workflows'] })
      toast.success('Workflow saved!')
    },
  })

  const activateMutation = useMutation({
    mutationFn: () => workflowService.activate(workflowId),
    onSuccess:  () => { toast.success('Workflow activated!'); navigate('/workflows') },
  })

  const addAction = () => setActions(prev => [...prev, { service: 'http-request', actionType: 'request', config: {} }])
  const removeAction = (i) => setActions(prev => prev.filter((_, idx) => idx !== i))
  const updateAction = (i, field, val) => setActions(prev => {
    const next = [...prev]
    next[i] = { ...next[i], [field]: val }
    if (field === 'service') next[i].actionType = ACTION_TYPES[val]?.[0] || ''
    return next
  })

  if (isLoading) return <Loader />

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" icon={ArrowLeft} onClick={() => navigate('/workflows')} />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{isEdit ? 'Edit Workflow' : 'New Workflow'}</h1>
          <p className="text-sm text-gray-500">Build your automation flow</p>
        </div>
      </div>

      {/* Basic Info */}
      <Card className="p-5 space-y-4">
        <h2 className="font-semibold text-gray-800">📝 Workflow Info</h2>
        <Input label="Name" value={name} onChange={e => setName(e.target.value)} placeholder="My Workflow" />
        <Input label="Description" value={description} onChange={e => setDesc(e.target.value)} placeholder="What does this workflow do?" />
      </Card>

      {/* Trigger */}
      <Card className="p-5 space-y-4">
        <h2 className="font-semibold text-gray-800">⚡ Trigger — When to start</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {['webhook','schedule','manual','form'].map(t => (
            <button key={t} onClick={() => setTrigger(t)}
              className={`p-3 rounded-lg border text-sm font-medium transition-colors ${triggerType === t ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 hover:border-gray-300'}`}>
              {TRIGGER_ICONS[t]} {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
        {triggerType === 'webhook' && (
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-500 mb-1">Webhook URL (generated after save)</p>
            <code className="text-xs text-blue-600">POST /api/webhooks/receive/&#123;id&#125;</code>
          </div>
        )}
        {triggerType === 'schedule' && (
          <Input label="Cron Expression" value={cronExpr} onChange={e => setCron(e.target.value)}
            placeholder="0 9 * * *" />
        )}
      </Card>

      {/* Actions */}
      <Card className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-800">🔧 Actions — What to do</h2>
          <Button size="sm" icon={Plus} onClick={addAction}>Add Action</Button>
        </div>

        {!actions.length && (
          <div className="text-center py-8 text-gray-400">
            <p className="text-sm">No actions yet — click "Add Action"</p>
          </div>
        )}

        {actions.map((action, i) => (
          <div key={i} className="border border-gray-200 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">
                {SERVICE_ICONS[action.service]} Step {i + 1}
              </span>
              <Button size="sm" variant="ghost" icon={Trash2}
                onClick={() => removeAction(i)} className="text-red-500" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Service</label>
                <select value={action.service} onChange={e => updateAction(i, 'service', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {SERVICES.map(s => <option key={s} value={s}>{SERVICE_ICONS[s]} {s}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Action</label>
                <select value={action.actionType} onChange={e => updateAction(i, 'actionType', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {(ACTION_TYPES[action.service] || []).map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Config (JSON)</label>
              <textarea
                value={JSON.stringify(action.config, null, 2)}
                onChange={e => { try { updateAction(i, 'config', JSON.parse(e.target.value)) } catch {} }}
                rows={6}
                style={{ width:'100%',padding:'10px 12px',border:'1px solid #e2e8f0',borderRadius:'10px',fontSize:'12px',fontFamily:'monospace',outline:'none',resize:'vertical',boxSizing:'border-box',minHeight:'100px' }}
              />
            </div>
          </div>
        ))}
      </Card>

      {/* Actions */}
      <div className="flex gap-3">
        <Button icon={Save} onClick={() => saveMutation.mutate()} loading={saveMutation.isPending}>
          Save Workflow
        </Button>
        {saved && workflowId && (
          <Button variant="success" icon={Play} onClick={() => activateMutation.mutate()}
            loading={activateMutation.isPending}>
            Activate
          </Button>
        )}
      </div>
    </div>
  )
}

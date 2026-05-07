import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import api from '../services/api'
import Loader     from '../components/common/Loader'
import EmptyState from '../components/common/EmptyState'
import Button     from '../components/ui/Button'
import Badge      from '../components/ui/Badge'
import Card       from '../components/ui/Card'

const SAMPLE_TEMPLATES = [
  { _id:'t1', name:'Ecommerce Order Handler', category:'ecommerce',
    description:'Receive order webhook → Update Sheet → Generate PDF Invoice → Send Email + WhatsApp',
    requiredServices:['webhook','google-sheets','pdf-generator','gmail','twilio'] },
  { _id:'t2', name:'Lead Capture & Nurture', category:'marketing',
    description:'Form submit → Save to Sheet → Send welcome email → Notify on Slack',
    requiredServices:['form','google-sheets','gmail','slack'] },
  { _id:'t3', name:'Daily Sales Report', category:'reporting',
    description:'Schedule 8PM → Read Sheet → Generate Report → Email to owner',
    requiredServices:['schedule','google-sheets','pdf-generator','gmail'] },
  { _id:'t4', name:'Payment Confirmation', category:'payment',
    description:'Razorpay webhook → Update DB → Send SMS + Invoice email',
    requiredServices:['webhook','mongodb','twilio','gmail'] },
  { _id:'t5', name:'Low Stock Alert', category:'inventory',
    description:'Webhook trigger → Send WhatsApp alert → Email owner',
    requiredServices:['webhook','twilio','gmail'] },
]

export default function Templates() {
  const navigate = useNavigate()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Workflow Templates</h1>
        <p className="text-gray-500 text-sm mt-1">Start fast with pre-built automation flows</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {SAMPLE_TEMPLATES.map(t => (
          <Card key={t._id} className="p-5 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <h3 className="font-semibold text-gray-900">{t.name}</h3>
              <Badge variant="info">{t.category}</Badge>
            </div>
            <p className="text-sm text-gray-500 mb-4">{t.description}</p>
            <div className="mb-4">
              <p className="text-xs text-gray-400 mb-1">Required Services</p>
              <div className="flex flex-wrap gap-1">
                {t.requiredServices.map(s => <Badge key={s} variant="default">{s}</Badge>)}
              </div>
            </div>
            <Button size="sm" onClick={() => navigate('/workflows/new')}>Use Template</Button>
          </Card>
        ))}
      </div>
    </div>
  )
}

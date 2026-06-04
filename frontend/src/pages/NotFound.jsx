import { useNavigate } from 'react-router-dom'
import PremiumButton from '../components/ui/PremiumButton'
import { Home, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  const navigate = useNavigate()
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'60vh', gap:'16px', textAlign:'center', padding:'24px' }}>
      <div style={{ fontSize:'72px', lineHeight:1 }}>404</div>
      <div>
        <h1 style={{ fontSize:'24px', fontWeight:'700', color:'#0f172a', marginBottom:'8px' }}>Page Not Found</h1>
        <p style={{ fontSize:'14px', color:'#94a3b8' }}>The page you're looking for doesn't exist or has been moved.</p>
      </div>
      <div style={{ display:'flex', gap:'12px' }}>
        <PremiumButton variant="secondary" icon={ArrowLeft} onClick={() => navigate(-1)}>Go Back</PremiumButton>
        <PremiumButton icon={Home} onClick={() => navigate('/')}>Dashboard</PremiumButton>
      </div>
    </div>
  )
}

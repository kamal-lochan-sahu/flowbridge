import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link } from 'react-router-dom'
import { Zap, User, Mail, Lock, ArrowRight } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'

const schema = z.object({
  name:     z.string().min(2, 'Name must be at least 2 characters'),
  email:    z.string().email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

const InputField = ({ label, icon: Icon, type = 'text', placeholder, register, error, onFocus, onBlur }) => (
  <div>
    <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#cbd5e1', marginBottom: '8px' }}>
      {label}
    </label>
    <div style={{ position: 'relative' }}>
      <Icon size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
      <input
        type={type} placeholder={placeholder}
        {...register}
        style={{
          width: '100%', padding: '12px 14px 12px 40px',
          background: 'rgba(255,255,255,0.07)',
          border: `1px solid ${error ? '#ef4444' : 'rgba(255,255,255,0.1)'}`,
          borderRadius: '12px', color: 'white', fontSize: '14px', outline: 'none',
        }}
        onFocus={e => e.target.style.borderColor = '#3b82f6'}
        onBlur={e => e.target.style.borderColor = error ? '#ef4444' : 'rgba(255,255,255,0.1)'}
      />
    </div>
    {error && <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '6px' }}>{error}</p>}
  </div>
)

export default function Register() {
  const { register: registerUser, isRegisterLoading } = useAuth()
  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(schema) })

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px', position: 'relative', overflow: 'hidden'
    }}>
      <div style={{ position: 'absolute', top: '20%', right: '10%', width: '350px', height: '350px', background: 'radial-gradient(circle, #6366f130 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '20%', left: '10%', width: '300px', height: '300px', background: 'radial-gradient(circle, #3b82f630 0%, transparent 70%)', pointerEvents: 'none' }} />

      <div style={{ width: '100%', maxWidth: '420px', position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: '56px', height: '56px',
            background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
            borderRadius: '16px', marginBottom: '16px',
            boxShadow: '0 0 40px #3b82f640'
          }}>
            <Zap size={28} color="white" fill="white" />
          </div>
          <h1 style={{ fontSize: '28px', fontWeight: '700', color: 'white', letterSpacing: '-0.5px' }}>FlowBridge</h1>
          <p style={{ color: '#94a3b8', fontSize: '14px', marginTop: '4px' }}>Connect anything. Automate everything.</p>
        </div>

        <div style={{
          background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.1)', borderRadius: '24px',
          padding: '40px', boxShadow: '0 25px 50px rgba(0,0,0,0.5)'
        }}>
          <h2 style={{ fontSize: '22px', fontWeight: '600', color: 'white', marginBottom: '6px' }}>Create account</h2>
          <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '28px' }}>Start automating your workflows today</p>

          <form onSubmit={handleSubmit(registerUser)} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <InputField label="Full Name"      icon={User}  placeholder="Kamal Singh"       register={register('name')}     error={errors.name?.message} />
            <InputField label="Email address"  icon={Mail}  type="email" placeholder="you@example.com"  register={register('email')}    error={errors.email?.message} />
            <InputField label="Password"       icon={Lock}  type="password" placeholder="Min 8 characters" register={register('password')} error={errors.password?.message} />

            <button type="submit" disabled={isRegisterLoading} style={{
              marginTop: '8px', padding: '13px',
              background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
              border: 'none', borderRadius: '12px',
              color: 'white', fontSize: '15px', fontWeight: '600',
              cursor: isRegisterLoading ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              boxShadow: '0 4px 20px #3b82f650',
            }}>
              {isRegisterLoading
                ? <><span style={{ width: '18px', height: '18px', border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} /> Creating...</>
                : <>Create Account <ArrowRight size={16} /></>
              }
            </button>
          </form>

          <p style={{ textAlign: 'center', fontSize: '13px', color: '#94a3b8', marginTop: '24px' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: '#3b82f6', fontWeight: '500', textDecoration: 'none' }}>Sign in</Link>
          </p>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } } input::placeholder { color: #475569; }`}</style>
    </div>
  )
}

import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link } from 'react-router-dom'
import { Mail, Lock, ArrowRight } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'

const schema = z.object({
  email:    z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
})

export default function Login() {
  const [showPass, setShowPass] = React.useState(false)
  const { login, isLoginLoading } = useAuth()
  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(schema) })

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px', position: 'relative', overflow: 'hidden', minHeight: '100dvh'
    }}>
      {/* Background glow effects */}
      <div style={{
        position: 'absolute', top: '20%', left: '15%',
        width: '400px', height: '400px',
        background: 'radial-gradient(circle, #3b82f630 0%, transparent 70%)',
        pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute', bottom: '20%', right: '15%',
        width: '300px', height: '300px',
        background: 'radial-gradient(circle, #8b5cf630 0%, transparent 70%)',
        pointerEvents: 'none'
      }} />

      <div style={{ width: '100%', maxWidth: '420px', position: 'relative', zIndex: 1 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 style={{ fontSize: '32px', fontWeight: '800', color: 'white', letterSpacing: '-1px' }}>
            Flow<span style={{ color: '#3b82f6' }}>Bridge</span>
          </h1>
          <p style={{ color: '#64748b', fontSize: '14px', marginTop: '6px' }}>
            Connect anything. Automate everything.
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: 'rgba(255,255,255,0.05)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '24px',
          padding: '40px',
          boxShadow: '0 25px 50px rgba(0,0,0,0.5)'
        }}>
          <h2 style={{ fontSize: '22px', fontWeight: '600', color: 'white', marginBottom: '6px' }}>
            Welcome back
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '28px' }}>
            Sign in to your account to continue
          </p>

          <form onSubmit={handleSubmit(login)} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Email */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#cbd5e1', marginBottom: '8px' }}>
                Email address
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                <input
                  type="email" placeholder="you@example.com"
                  {...register('email')}
                  style={{
                    width: '100%', padding: '12px 14px 12px 40px',
                    background: 'rgba(255,255,255,0.07)',
                    border: `1px solid ${errors.email ? '#ef4444' : 'rgba(255,255,255,0.1)'}`,
                    borderRadius: '12px', color: 'white', fontSize: '14px',
                    outline: 'none', transition: 'border-color 0.2s',
                  }}
                  onFocus={e => e.target.style.borderColor = '#3b82f6'}
                  onBlur={e => e.target.style.borderColor = errors.email ? '#ef4444' : 'rgba(255,255,255,0.1)'}
                />
              </div>
              {errors.email && <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '6px' }}>{errors.email.message}</p>}
            </div>

            {/* Password */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label style={{ fontSize: '13px', fontWeight: '500', color: '#cbd5e1' }}>Password</label>
                <Link to="/forgot-password" style={{ fontSize: '12px', color: '#3b82f6', textDecoration: 'none' }}>
                  Forgot password?
                </Link>
              </div>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                <input
                  type={showPass ? 'text' : 'password'} placeholder="••••••••"
                  {...register('password')}
                  style={{
                    width: '100%', padding: '12px 40px 12px 40px',
                    background: 'rgba(255,255,255,0.07)',
                    border: `1px solid ${errors.password ? '#ef4444' : 'rgba(255,255,255,0.1)'}`,
                    borderRadius: '12px', color: 'white', fontSize: '14px',
                    outline: 'none', transition: 'border-color 0.2s',
                  }}
                  onFocus={e => e.target.style.borderColor = '#3b82f6'}
                  onBlur={e => e.target.style.borderColor = errors.password ? '#ef4444' : 'rgba(255,255,255,0.1)'}
                />
                <button type="button" onClick={() => setShowPass(p => !p)}
                  style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center', padding: '2px' }}>
                  {showPass
                    ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  }
                </button>
              </div>
              {errors.password && <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '6px' }}>{errors.password.message}</p>}
            </div>

            {/* Submit */}
            <button
              type="submit" disabled={isLoginLoading}
              style={{
                marginTop: '8px', padding: '13px',
                background: isLoginLoading ? '#1d4ed8' : 'linear-gradient(135deg, #3b82f6, #6366f1)',
                border: 'none', borderRadius: '12px',
                color: 'white', fontSize: '15px', fontWeight: '600',
                cursor: isLoginLoading ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                transition: 'transform 0.15s, box-shadow 0.15s',
                boxShadow: '0 4px 20px #3b82f650',
              }}
              onMouseEnter={e => { if (!isLoginLoading) { e.target.style.transform = 'translateY(-1px)'; e.target.style.boxShadow = '0 8px 30px #3b82f660'; }}}
              onMouseLeave={e => { e.target.style.transform = 'none'; e.target.style.boxShadow = '0 4px 20px #3b82f650'; }}
            >
              {isLoginLoading
                ? <><span style={{ width: '18px', height: '18px', border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} /> Signing in...</>
                : <>Sign In <ArrowRight size={16} /></>
              }
            </button>
          </form>

          <p style={{ textAlign: 'center', fontSize: '13px', color: '#94a3b8', marginTop: '24px' }}>
            Don't have an account?{' '}
            <Link to="/register" style={{ color: '#3b82f6', fontWeight: '500', textDecoration: 'none' }}>
              Create one free
            </Link>
          </p>
        </div>

        {/* Footer */}
        <p style={{ textAlign: 'center', fontSize: '12px', color: '#475569', marginTop: '24px' }}>
          Secured with AES-256 encryption
        </p>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        input::placeholder { color: #475569; }
      `}</style>
    </div>
  )
}

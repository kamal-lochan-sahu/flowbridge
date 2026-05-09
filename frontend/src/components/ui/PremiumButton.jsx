export default function PremiumButton({ children, onClick, variant='primary', size='md', icon:Icon, loading=false, disabled=false, style={} }) {
  const variants = {
    primary:   { background:'linear-gradient(135deg,#3b82f6,#6366f1)', color:'white', border:'none', boxShadow:'0 2px 8px #3b82f630' },
    secondary: { background:'white', color:'#374151', border:'1px solid #e2e8f0', boxShadow:'0 1px 3px rgba(0,0,0,0.06)' },
    danger:    { background:'#fef2f2', color:'#ef4444', border:'1px solid #fecaca', boxShadow:'none' },
    ghost:     { background:'transparent', color:'#64748b', border:'1px solid transparent', boxShadow:'none' },
    success:   { background:'linear-gradient(135deg,#10b981,#059669)', color:'white', border:'none', boxShadow:'0 2px 8px #10b98130' },
  }
  const sizes = {
    sm: { padding:'6px 12px', fontSize:'12px', borderRadius:'8px' },
    md: { padding:'9px 16px', fontSize:'14px', borderRadius:'10px' },
    lg: { padding:'12px 24px', fontSize:'15px', borderRadius:'12px' },
  }
  const v = variants[variant], s = sizes[size]
  return (
    <button onClick={onClick} disabled={disabled||loading} style={{
      ...v, ...s, fontWeight:'600', cursor:(disabled||loading)?'not-allowed':'pointer',
      display:'inline-flex', alignItems:'center', gap:'7px',
      transition:'all 0.15s', opacity:(disabled||loading)?0.6:1, ...style
    }}
    onMouseEnter={e => { if(!disabled&&!loading) e.currentTarget.style.transform='translateY(-1px)'; }}
    onMouseLeave={e => { e.currentTarget.style.transform='none'; }}
    >
      {loading
        ? <span style={{ width:'14px',height:'14px',border:'2px solid currentColor',borderTopColor:'transparent',borderRadius:'50%',display:'inline-block',animation:'spin 0.7s linear infinite' }} />
        : Icon && <Icon size={size==='sm'?13:15} />
      }
      {children}
    </button>
  )
}

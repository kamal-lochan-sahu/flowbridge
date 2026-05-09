export default function PageHeader({ title, subtitle, action }) {
  return (
    <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:'28px' }}>
      <div>
        <h1 style={{ fontSize:'24px', fontWeight:'700', color:'#0f172a', letterSpacing:'-0.5px', marginBottom:'4px' }}>{title}</h1>
        {subtitle && <p style={{ fontSize:'14px', color:'#94a3b8', fontWeight:'400' }}>{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}

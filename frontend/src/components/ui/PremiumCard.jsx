export default function PremiumCard({ children, style={}, onClick, hover=false }) {
  const base = {
    background:'white', borderRadius:'14px',
    border:'1px solid #f1f5f9',
    boxShadow:'0 1px 4px rgba(0,0,0,0.04)',
    transition:'all 0.2s',
    ...style
  }
  return (
    <div style={base} onClick={onClick}
      onMouseEnter={e => { if(hover||onClick) { e.currentTarget.style.boxShadow='0 4px 20px rgba(0,0,0,0.08)'; e.currentTarget.style.borderColor='#e2e8f0'; }}}
      onMouseLeave={e => { if(hover||onClick) { e.currentTarget.style.boxShadow='0 1px 4px rgba(0,0,0,0.04)'; e.currentTarget.style.borderColor='#f1f5f9'; }}}
    >
      {children}
    </div>
  )
}

import { Search } from 'lucide-react'
export default function SearchInput({ value, onChange, placeholder='Search...' }) {
  return (
    <div style={{ position:'relative', display:'inline-flex', alignItems:'center' }}>
      <Search size={15} style={{ position:'absolute', left:'12px', color:'#94a3b8', pointerEvents:'none', flexShrink:0 }} />
      <input
        value={value} onChange={onChange} placeholder={placeholder}
        style={{
          paddingLeft:'36px', paddingRight:'14px', paddingTop:'9px', paddingBottom:'9px',
          border:'1px solid #e2e8f0', borderRadius:'10px', fontSize:'14px',
          color:'#0f172a', background:'white', outline:'none',
          width:'280px', transition:'border-color 0.15s',
        }}
        onFocus={e => e.target.style.borderColor='#3b82f6'}
        onBlur={e => e.target.style.borderColor='#e2e8f0'}
      />
    </div>
  )
}

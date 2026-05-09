export default function StatusBadge({ status }) {
  const map = {
    active:  { bg:'#f0fdf4', color:'#16a34a', dot:'#22c55e', label:'Active' },
    paused:  { bg:'#fffbeb', color:'#d97706', dot:'#f59e0b', label:'Paused' },
    draft:   { bg:'#f8fafc', color:'#64748b', dot:'#94a3b8', label:'Draft' },
    success: { bg:'#f0fdf4', color:'#16a34a', dot:'#22c55e', label:'Success' },
    failed:  { bg:'#fef2f2', color:'#dc2626', dot:'#ef4444', label:'Failed' },
    running: { bg:'#eff6ff', color:'#2563eb', dot:'#3b82f6', label:'Running' },
    partial: { bg:'#fff7ed', color:'#ea580c', dot:'#f97316', label:'Partial' },
  }
  const s = map[status] || map.draft
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:'5px', padding:'3px 9px', background:s.bg, color:s.color, borderRadius:'99px', fontSize:'12px', fontWeight:'600' }}>
      <span style={{ width:'6px',height:'6px',background:s.dot,borderRadius:'50%',flexShrink:0 }} />
      {s.label}
    </span>
  )
}

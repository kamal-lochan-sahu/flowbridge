export const formatDate = (date) => {
  if (!date) return '—'
  return new Date(date).toLocaleString('en-IN', {
    day:    '2-digit', month: 'short', year: 'numeric',
    hour:   '2-digit', minute: '2-digit',
  })
}

export const formatDuration = (ms) => {
  if (!ms) return '0ms'
  if (ms < 1000)  return `${ms}ms`
  if (ms < 60000) return `${(ms/1000).toFixed(1)}s`
  return `${Math.floor(ms/60000)}m ${Math.floor((ms%60000)/1000)}s`
}

export const timeAgo = (date) => {
  if (!date) return '—'
  const seconds = Math.floor((Date.now() - new Date(date)) / 1000)
  if (seconds < 60)   return `${seconds}s ago`
  if (seconds < 3600) return `${Math.floor(seconds/60)}m ago`
  if (seconds < 86400)return `${Math.floor(seconds/3600)}h ago`
  return `${Math.floor(seconds/86400)}d ago`
}

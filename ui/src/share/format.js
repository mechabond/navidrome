export const formatTime = (secs) => {
  if (!Number.isFinite(secs) || secs < 0) secs = 0
  const s = Math.floor(secs)
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const ss = String(s % 60).padStart(2, '0')
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${ss}` : `${m}:${ss}`
}

export const formatTotal = (secs) => {
  const s = Math.round(secs || 0)
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  if (h > 0) return `${h} hr ${m} min`
  return `${m} min ${s % 60} sec`
}

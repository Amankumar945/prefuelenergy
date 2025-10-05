import { useEffect, useState } from 'react'

function formatIST(date) {
  try {
    const datePart = new Intl.DateTimeFormat('en-IN', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: 'short',
      day: '2-digit',
    }).format(date)
    const timePart = new Intl.DateTimeFormat('en-IN', {
      timeZone: 'Asia/Kolkata',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).format(date)
    return `${datePart}, ${String(timePart).toUpperCase()} IST`
  } catch (_) {
    // Fallback without timezone if environment lacks Intl TZ support
    const d = date.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: '2-digit' })
    const t = date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
    return `${d}, ${String(t).toUpperCase()} IST`
  }
}

export default function DigitalClock() {
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  const display = formatIST(now)

  return (
    <div className="hidden sm:inline-flex items-center text-xs text-gray-700 font-mono px-2 py-1 rounded-lg bg-white/70 border border-gray-200 shadow-sm animate-fadein">
      {display}
    </div>
  )
}



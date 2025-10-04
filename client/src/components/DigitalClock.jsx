import { useEffect, useState } from 'react'

function formatIST(date) {
  try {
    return new Intl.DateTimeFormat('en-IN', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    }).format(date)
  } catch (_) {
    // Fallback without timezone if environment lacks Intl TZ support
    return date.toLocaleString('en-IN')
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
    <div className="text-xs text-gray-600 font-mono px-2 py-1 rounded-lg bg-white/60 border border-gray-200 shadow-sm animate-fadein">
      {display} IST
    </div>
  )
}



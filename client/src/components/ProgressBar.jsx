export default function ProgressBar({ percent = 0, color = 'bg-brand' }) {
  const width = Math.max(0, Math.min(100, Math.round(percent)))
  return (
    <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden">
      <div
        className={`${color} h-full transition-all duration-500`}
        style={{ width: `${width}%` }}
      />
    </div>
  )
}



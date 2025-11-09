export default function Modal({ open, title, children, onClose, primary, onPrimary, primaryText = 'Save' }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-full sm:max-w-lg bg-white rounded-t-2xl sm:rounded-2xl shadow-xl border border-gray-100 p-5 animate-fadein">
        <div className="flex items-center justify-between">
          <div className="text-base font-semibold">{title}</div>
          <button onClick={onClose} className="px-2 py-1 text-gray-500 hover:text-gray-700">✕</button>
        </div>
        <div className="mt-4">{children}</div>
        {onPrimary && (
          <div className="mt-5 flex justify-end gap-2">
            <button onClick={onClose} className="px-3 py-2 rounded-lg border text-sm">Cancel</button>
            <button onClick={onPrimary} className={`px-3 py-2 rounded-lg text-white text-sm ${primary || 'bg-brand hover:bg-brand-dark'}`}>{primaryText}</button>
          </div>
        )}
      </div>
    </div>
  )
}



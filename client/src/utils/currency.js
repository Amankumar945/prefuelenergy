export function formatINR(value) {
  const number = Number.isFinite(Number(value)) ? Number(value) : 0
  const formatted = new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(number)
  return `Rs ${formatted}`
}



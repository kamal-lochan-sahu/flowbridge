export default function Input({
  label, error, className = '',
  type = 'text', ...props
}) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-sm font-medium text-gray-700">{label}</label>}
      <input
        type={type}
        className={`px-3 py-2 border rounded-lg text-sm outline-none transition-colors
          focus:ring-2 focus:ring-blue-500 focus:border-blue-500
          ${error ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white'}
          ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}

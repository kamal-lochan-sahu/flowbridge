export default function Loader({ text = 'Loading...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3">
      <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin border-[3px]" />
      <p className="text-sm text-gray-500">{text}</p>
    </div>
  )
}

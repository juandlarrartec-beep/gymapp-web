export default function DashboardLoading() {
  return (
    <div className="p-8">
      <div className="h-8 w-40 bg-slate-200 rounded animate-pulse mb-6" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl border p-6 shadow-sm space-y-3">
            <div className="h-4 w-28 bg-slate-200 rounded animate-pulse" />
            <div className="h-8 w-16 bg-slate-200 rounded animate-pulse" />
            <div className="h-3 w-32 bg-slate-100 rounded animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  )
}

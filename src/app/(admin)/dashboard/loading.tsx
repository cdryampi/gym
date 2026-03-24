export default function DashboardLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Stats row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-none border border-black/8 bg-white p-5"
          >
            <div className="h-2 w-20 rounded-full bg-black/5" />
            <div className="mt-4 h-7 w-16 rounded-full bg-black/5" />
            <div className="mt-2 h-2 w-24 rounded-full bg-black/5" />
          </div>
        ))}
      </div>

      {/* Content area */}
      <div className="rounded-none border border-black/8 bg-white p-6">
        <div className="h-3 w-32 rounded-full bg-black/5" />
        <div className="mt-6 space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="h-4 w-4 rounded-full bg-black/5" />
              <div className="h-3 flex-1 rounded-full bg-black/5" />
              <div className="h-3 w-20 rounded-full bg-black/5" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

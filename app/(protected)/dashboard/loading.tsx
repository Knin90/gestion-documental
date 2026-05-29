export default function DashboardLoading() {
  return (
    <div className="p-6 space-y-6 animate-pulse">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <div className="h-8 w-48 rounded-lg bg-muted" />
          <div className="h-4 w-64 rounded-lg bg-muted" />
        </div>
        <div className="h-9 w-40 rounded-lg bg-muted" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border bg-card p-6 space-y-3">
            <div className="h-4 w-32 rounded bg-muted" />
            <div className="h-9 w-16 rounded bg-muted" />
          </div>
        ))}
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="rounded-xl border bg-card p-6">
            <div className="h-4 w-48 rounded bg-muted mb-4" />
            <div className="h-48 rounded-lg bg-muted" />
          </div>
        ))}
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="rounded-xl border bg-card p-6 space-y-3">
            <div className="h-4 w-32 rounded bg-muted" />
            {Array.from({ length: 5 }).map((_, j) => (
              <div key={j} className="flex gap-3">
                <div className="h-6 w-6 rounded-full bg-muted" />
                <div className="h-5 flex-1 rounded bg-muted" />
                <div className="h-5 w-8 rounded bg-muted" />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function BuscarLoading() {
  return (
    <div className="p-6 space-y-6 animate-pulse">
      <div className="space-y-2">
        <div className="h-8 w-48 rounded-lg bg-muted" />
        <div className="h-4 w-64 rounded-lg bg-muted" />
      </div>
      <div className="rounded-xl border bg-card p-6 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <div className="h-4 w-24 rounded bg-muted" />
            <div className="h-10 w-full rounded-lg bg-muted" />
          </div>
          <div className="space-y-2">
            <div className="h-4 w-16 rounded bg-muted" />
            <div className="h-10 w-full rounded-lg bg-muted" />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 w-20 rounded bg-muted" />
              <div className="h-10 w-full rounded-lg bg-muted" />
            </div>
          ))}
        </div>
        <div className="flex gap-3 pt-2">
          <div className="h-9 w-24 rounded-lg bg-muted" />
          <div className="h-9 w-20 rounded-lg bg-muted" />
        </div>
      </div>
    </div>
  );
}

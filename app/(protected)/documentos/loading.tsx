export default function DocumentosLoading() {
  return (
    <div className="p-6 space-y-6 animate-pulse">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <div className="h-8 w-36 rounded-lg bg-muted" />
          <div className="h-4 w-48 rounded-lg bg-muted" />
        </div>
        <div className="flex gap-3">
          <div className="h-9 w-40 rounded-lg bg-muted" />
          <div className="h-9 w-24 rounded-lg bg-muted" />
        </div>
      </div>
      <div className="flex gap-3">
        <div className="h-9 flex-1 rounded-lg bg-muted" />
        <div className="h-9 w-48 rounded-lg bg-muted" />
      </div>
      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="border-b bg-muted/50 px-4 py-3 flex gap-8">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-4 w-16 rounded bg-muted" />
          ))}
        </div>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex gap-8 px-4 py-3 border-b last:border-0">
            <div className="h-4 w-16 rounded bg-muted" />
            <div className="h-4 w-48 rounded bg-muted" />
            <div className="h-4 w-24 rounded bg-muted" />
            <div className="h-4 w-20 rounded bg-muted" />
            <div className="h-5 w-16 rounded-full bg-muted" />
            <div className="h-4 w-24 rounded bg-muted" />
          </div>
        ))}
      </div>
    </div>
  );
}

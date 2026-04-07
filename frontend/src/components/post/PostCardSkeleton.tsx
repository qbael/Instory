export function PostCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-bg-card">
      {/* Header */}
      <div className="flex items-center gap-3 px-3 py-2.5">
        <div className="h-8 w-8 shrink-0 animate-pulse rounded-full bg-border" />
        <div className="flex-1 space-y-1.5">
          <div className="h-3 w-24 animate-pulse rounded bg-border" />
          <div className="h-2.5 w-16 animate-pulse rounded bg-border" />
        </div>
      </div>
      {/* Image */}
      <div className="aspect-square animate-pulse bg-border" />
      {/* Actions */}
      <div className="space-y-2.5 p-3">
        <div className="flex gap-4">
          <div className="h-6 w-6 animate-pulse rounded bg-border" />
          <div className="h-6 w-6 animate-pulse rounded bg-border" />
          <div className="h-6 w-6 animate-pulse rounded bg-border" />
        </div>
        <div className="h-3 w-20 animate-pulse rounded bg-border" />
        <div className="h-3 w-full animate-pulse rounded bg-border" />
        <div className="h-3 w-3/4 animate-pulse rounded bg-border" />
      </div>
    </div>
  );
}

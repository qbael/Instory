export function UserCardSkeleton() {
  return (
    <div className="flex items-center gap-3 px-3 py-2.5">
      <div className="h-10 w-10 shrink-0 animate-pulse rounded-full bg-border" />
      <div className="flex-1 space-y-1.5">
        <div className="h-3.5 w-28 animate-pulse rounded bg-border" />
        <div className="h-3 w-20 animate-pulse rounded bg-border" />
      </div>
      <div className="h-8 w-20 animate-pulse rounded-lg bg-border" />
    </div>
  );
}

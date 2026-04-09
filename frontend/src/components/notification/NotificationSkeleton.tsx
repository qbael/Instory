export function NotificationSkeleton() {
  return (
    <div className="flex items-center gap-3 px-3 py-3">
      <div className="h-10 w-10 shrink-0 animate-pulse rounded-full bg-border" />
      <div className="flex-1 space-y-1.5">
        <div className="h-3.5 w-48 animate-pulse rounded bg-border" />
        <div className="h-2.5 w-16 animate-pulse rounded bg-border" />
      </div>
    </div>
  );
}

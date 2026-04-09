export function StorySkeleton() {
  return (
    <div className="flex w-[72px] shrink-0 flex-col items-center gap-1">
      <div className="h-[62px] w-[62px] animate-pulse rounded-full bg-border" />
      <div className="h-2.5 w-12 animate-pulse rounded bg-border" />
    </div>
  );
}

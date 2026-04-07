import { cn } from '@/utils/cn';

interface BadgeProps {
  count: number;
  className?: string;
}

export function Badge({ count, className }: BadgeProps) {
  if (count <= 0) return null;

  return (
    <span
      className={cn(
        'absolute -right-1.5 -top-1.5 flex h-[18px] min-w-[18px] items-center justify-center',
        'rounded-full bg-error px-1 text-[10px] font-bold leading-none text-white',
        className,
      )}
    >
      {count > 99 ? '99+' : count}
    </span>
  );
}

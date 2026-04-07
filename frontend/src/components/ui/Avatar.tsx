import { cn } from '@/utils/cn';

interface AvatarProps {
  src?: string | null;
  alt?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  hasStory?: boolean;
}

const sizeMap = {
  xs: 'h-6 w-6 text-[10px]',
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-14 w-14 text-lg',
  xl: 'h-20 w-20 text-2xl',
} as const;

const ringMap = {
  xs: 'ring-[1.5px] ring-offset-1',
  sm: 'ring-2 ring-offset-1',
  md: 'ring-2 ring-offset-2',
  lg: 'ring-2 ring-offset-2',
  xl: 'ring-[3px] ring-offset-2',
} as const;

export function Avatar({
  src,
  alt = '',
  size = 'md',
  className,
  hasStory,
}: AvatarProps) {
  const initials = alt
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const storyRing = hasStory
    ? cn(ringMap[size], 'ring-accent ring-offset-bg-card')
    : '';

  if (src) {
    return (
      <img
        src={src}
        alt={alt}
        className={cn(
          'shrink-0 rounded-full object-cover',
          sizeMap[size],
          storyRing,
          className,
        )}
      />
    );
  }

  return (
    <div
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full bg-border font-semibold text-text-secondary',
        sizeMap[size],
        storyRing,
        className,
      )}
      role="img"
      aria-label={alt}
    >
      {initials || '?'}
    </div>
  );
}

import { Avatar } from '@/components/ui/Avatar';
import { cn } from '@/utils/cn';
import { Plus } from 'lucide-react';

interface StoryCircleProps {
  src?: string | null;
  name: string;
  hasUnviewed: boolean;
  isOwn?: boolean;
  onClick: () => void;
}

export function StoryCircle({
  src,
  name,
  hasUnviewed,
  isOwn,
  onClick,
}: StoryCircleProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-[72px] shrink-0 cursor-pointer flex-col items-center gap-1"
    >
      <div className="relative">
        <div
          className={cn(
            'rounded-full p-[2px]',
            hasUnviewed
              ? 'bg-gradient-to-tr from-warning via-accent to-primary'
              : isOwn
                ? 'bg-transparent'
                : 'bg-border',
          )}
        >
          <div className="rounded-full bg-bg-card p-[2px]">
            <Avatar
              src={src}
              alt={name}
              size="lg"
              className="!h-14 !w-14"
            />
          </div>
        </div>
        {isOwn && (
          <span className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-white ring-2 ring-bg-card">
            <Plus className="h-3 w-3" strokeWidth={3} />
          </span>
        )}
      </div>
      <span className="w-full truncate text-center text-[11px]">
        {isOwn ? 'Your story' : name}
      </span>
    </button>
  );
}

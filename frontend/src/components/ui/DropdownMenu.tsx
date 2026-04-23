import * as Radix from '@radix-ui/react-dropdown-menu';
import { cn } from '@/utils/cn';

export const DropdownMenu = Radix.Root;
export const DropdownMenuTrigger = Radix.Trigger;

export function DropdownMenuContent({
  className,
  children,
  align = 'start',
  ...props
}: Radix.DropdownMenuContentProps) {
  return (
    <Radix.Portal>
      <Radix.Content
        align={align}
        sideOffset={4}
        className={cn(
          'z-50 min-w-[10rem] overflow-hidden rounded-xl border border-border bg-bg shadow-lg',
          'data-[state=open]:animate-in data-[state=closed]:animate-out',
          'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
          'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
          className,
        )}
        {...props}
      >
        {children}
      </Radix.Content>
    </Radix.Portal>
  );
}

export function DropdownMenuItem({
  className,
  children,
  ...props
}: Radix.DropdownMenuItemProps) {
  return (
    <Radix.Item
      className={cn(
        'flex cursor-pointer select-none items-center gap-2 px-3 py-2.5 text-sm text-text-primary outline-none',
        'hover:bg-border/50 focus:bg-border/50',
        className,
      )}
      {...props}
    >
      {children}
    </Radix.Item>
  );
}

export function DropdownMenuSeparator({ className }: { className?: string }) {
  return <Radix.Separator className={cn('my-1 h-px bg-border', className)} />;
}

import * as RadixDialog from '@radix-ui/react-dialog';
import { cn } from '@/utils/cn';

interface AlertDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'default';
  onConfirm: () => void;
}

export function AlertDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Xác nhận',
  cancelLabel = 'Hủy',
  variant = 'default',
  onConfirm,
}: AlertDialogProps) {
  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay className="fixed inset-0 z-50 bg-black/60 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <RadixDialog.Content
          className={cn(
            'fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2',
            'rounded-xl bg-bg p-6 shadow-xl',
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
            'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
          )}
        >
          <RadixDialog.Title className="text-base font-semibold text-text-primary">
            {title}
          </RadixDialog.Title>
          {description && (
            <RadixDialog.Description className="mt-2 text-sm text-text-secondary">
              {description}
            </RadixDialog.Description>
          )}

          <div className="mt-5 flex justify-end gap-2">
            <RadixDialog.Close asChild>
              <button
                type="button"
                className="cursor-pointer rounded-lg bg-border/60 px-4 py-2 text-sm font-semibold text-text-primary transition-colors hover:bg-border"
              >
                {cancelLabel}
              </button>
            </RadixDialog.Close>
            <button
              type="button"
              onClick={() => {
                onConfirm();
                onOpenChange(false);
              }}
              className={cn(
                'cursor-pointer rounded-lg px-4 py-2 text-sm font-semibold text-white transition-colors',
                variant === 'danger'
                  ? 'bg-red-500 hover:bg-red-600'
                  : 'bg-primary hover:bg-primary-hover',
              )}
            >
              {confirmLabel}
            </button>
          </div>
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}

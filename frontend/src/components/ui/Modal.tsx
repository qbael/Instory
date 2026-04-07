import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '@/utils/cn';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  showClose?: boolean;
  className?: string;
}

const sizeClasses: Record<string, string> = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  full: 'max-w-[calc(100vw-2rem)] max-h-[calc(100vh-2rem)]',
};

export function Modal({
  isOpen,
  onClose,
  children,
  title,
  size = 'md',
  showClose = true,
  className,
}: ModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onEsc);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener('keydown', onEsc);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal
        className={cn(
          'relative z-10 w-full overflow-hidden rounded-xl bg-bg-card shadow-xl',
          sizeClasses[size],
          className,
        )}
      >
        {(title || showClose) && (
          <div className="flex items-center justify-between border-b border-border px-5 py-3">
            <h2 className="text-base font-semibold">{title}</h2>
            {showClose && (
              <button
                type="button"
                onClick={onClose}
                className="cursor-pointer rounded-full p-1 text-text-secondary transition-colors hover:bg-border/30 hover:text-text-primary"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        )}
        {children}
      </div>
    </div>,
    document.body,
  );
}

import { cn } from '@/utils/cn';

interface InputProps extends React.ComponentProps<'input'> {
  label?: string;
  error?: string;
  rightIcon?: React.ReactNode;
}

export function Input({
  label,
  error,
  rightIcon,
  className,
  id,
  ...props
}: InputProps) {
  const inputId = id ?? props.name;

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="mb-1.5 block text-xs font-semibold text-text-secondary uppercase tracking-wide"
        >
          {label}
        </label>
      )}
      <div className="relative">
        <input
          id={inputId}
          className={cn(
            'w-full rounded-lg border border-border bg-bg px-3 py-2.5 text-sm text-text-primary',
            'placeholder:text-text-secondary/70',
            'transition-colors',
            'focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20',
            'disabled:cursor-not-allowed disabled:opacity-50',
            error && 'border-error focus:border-error focus:ring-error/20',
            rightIcon && 'pr-10',
            className,
          )}
          aria-invalid={!!error}
          {...props}
        />
        {rightIcon && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary">
            {rightIcon}
          </div>
        )}
      </div>
      {error && (
        <p className="mt-1 text-xs text-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

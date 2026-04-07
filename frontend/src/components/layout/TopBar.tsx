import { Link } from 'react-router';
import { Heart, Send } from 'lucide-react';
import { useAppSelector } from '@/store';

export function TopBar() {
  const unreadCount = useAppSelector((s) => s.notification.unreadCount);

  return (
    <header
      className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-border bg-bg-card px-4 md:hidden"
    >
      <Link
        to="/"
        className="text-lg font-bold tracking-tight text-text-primary no-underline"
      >
        Instory
      </Link>

      <div className="flex items-center gap-4">
        <Link to="/notifications" className="relative text-text-primary">
          <Heart className="h-6 w-6" />
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-error" />
          )}
        </Link>
        <button type="button" className="cursor-pointer text-text-primary">
          <Send className="h-6 w-6" />
        </button>
      </div>
    </header>
  );
}

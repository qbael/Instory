import { Link, useLocation } from 'react-router';
import { Home, Search, SquarePlus, Heart, User, MessageCircle, TrendingUp } from 'lucide-react';
import { cn } from '@/utils/cn';
import { useAppSelector, useAppDispatch } from '@/store';
import { openModal } from '@/store/slices/uiSlice';

export function MobileNav() {
  const location = useLocation();
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);
  const unreadCount = useAppSelector((s) => s.notification.unreadCount);

  const items = [
    { icon: Home, to: '/' },
    { icon: Search, to: '/search' },
    { icon: SquarePlus, action: () => dispatch(openModal({ modal: 'createPost' })) },
    { icon: MessageCircle, to: '/chat' },
    {icon : TrendingUp, label: 'Xu hướng', to: '/hashtagtrending' },
    // { icon: Heart, to: '/notifications', badge: unreadCount > 0 },
    { icon: User, to: `/profile/${user?.userName}` },
  ];

  return (
    <nav
      className={cn(
        'fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around',
        'h-12 border-t border-border bg-bg-card',
        'md:hidden',
      )}
    >
      {items.map((item, i) => {
        const isActive = item.to ? location.pathname === item.to : false;

        if (item.action) {
          return (
            <button
              key={i}
              type="button"
              onClick={item.action}
              className="flex cursor-pointer items-center justify-center p-2 text-text-primary"
            >
              <item.icon className="h-6 w-6" />
            </button>
          );
        }

        return (
          <Link
            key={i}
            to={item.to!}
            className="relative flex items-center justify-center p-2 text-text-primary"
          >
            <item.icon
              className={cn('h-6 w-6', isActive && 'stroke-[2.5]')}
            />
            {/* {item.badge && (
              <span className="absolute right-0.5 top-0.5 h-2 w-2 rounded-full bg-error" />
            )} */}
          </Link>
        );
      })}
    </nav>
  );
}

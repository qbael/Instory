import { Link, useLocation } from 'react-router';
import {
  Home,
  Search,
  Heart,
  SquarePlus,
  User,
  LogOut,
  Camera,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/utils/cn';
import { useAppSelector, useAppDispatch } from '@/store';
import { logout } from '@/store/slices/authSlice';
import { openModal } from '@/store/slices/uiSlice';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';

interface NavEntry {
  icon: React.ElementType;
  label: string;
  to?: string;
  action?: () => void;
  badge?: number;
}

export function Sidebar() {
  const location = useLocation();
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);
  const unreadCount = useAppSelector((s) => s.notification.unreadCount);

  const navItems: NavEntry[] = [
    { icon: Home, label: 'Trang chủ', to: '/' },
    { icon: Search, label: 'Tìm kiếm', to: '/search' },
    { icon: Heart, label: 'Thông báo', to: '/notifications', badge: unreadCount },
    {
      icon: SquarePlus,
      label: 'Tạo bài',
      action: () => dispatch(openModal({ modal: 'createPost' })),
    },
    { icon: User, label: 'Hồ sơ', to: `/profile/${user?.userName}` },
  ];

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 hidden h-screen flex-col border-r border-border bg-bg-card',
        'md:flex md:w-[72px] lg:w-[220px]',
      )}
    >
      {/* Logo */}
      <div className="flex h-[73px] items-center px-3 lg:px-6">
        <Link to="/" className="flex items-center gap-2 text-text-primary no-underline">
          <Camera className="h-6 w-6 shrink-0 text-accent lg:hidden" />
          <span className="hidden text-xl font-bold tracking-tight lg:block">
            Instory
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-0.5 px-3">
        {navItems.map((item) => {
          const isActive = item.to ? location.pathname === item.to : false;

          const inner = (
            <span
              className={cn(
                'relative flex items-center gap-4 rounded-lg px-3 py-3 transition-colors',
                'hover:bg-border/30',
                isActive && 'font-bold',
              )}
            >
              <span className="relative shrink-0">
                {item.to === `/profile/${user?.userName}` ? (
                  <Avatar
                    src={user?.avatarUrl}
                    alt={user?.fullName ?? user?.userName ?? ''}
                    size="xs"
                    className={cn(isActive && 'ring-2 ring-text-primary ring-offset-1 ring-offset-bg-card')}
                  />
                ) : (
                  <item.icon
                    className={cn('h-6 w-6', isActive && 'stroke-[2.5]')}
                  />
                )}
                {(item.badge ?? 0) > 0 && <Badge count={item.badge!} />}
              </span>
              <span className="hidden text-[15px] lg:inline">{item.label}</span>
            </span>
          );

          if (item.to) {
            return (
              <Link
                key={item.label}
                to={item.to}
                className="block text-text-primary no-underline"
              >
                {inner}
              </Link>
            );
          }

          return (
            <button
              key={item.label}
              type="button"
              onClick={item.action}
              className="w-full cursor-pointer text-left text-text-primary"
            >
              {inner}
            </button>
          );
        })}
      </nav>

      {/* Bottom: Logout */}
      <div className="border-t border-border px-3 py-3">
        <button
          type="button"
          onClick={() => {
            toast.success('Hẹn gặp lại!');
            dispatch(logout());
          }}
          className="flex w-full cursor-pointer items-center gap-4 rounded-lg px-3 py-3 text-text-primary transition-colors hover:bg-border/30"
        >
          <LogOut className="h-6 w-6 shrink-0" />
          <span className="hidden text-[15px] lg:inline">Đăng xuất</span>
        </button>
      </div>
    </aside>
  );
}

import { Users, ShieldCheck, LayoutGrid, LogOut, Shield, ListChecks } from 'lucide-react';
import clsx from 'clsx';
import { useAppDispatch, useAppSelector } from '@/store';
import { logout } from '@/store/slices/authSlice';
import { Avatar } from '@/components/ui/Avatar';

type AdminTab = 'users' | 'posts' | 'reports' | 'reportReasons';

interface AdminSidebarProps {
  activeTab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
}

const tabs = [
  {
    id: 'users' as AdminTab,
    label: 'Người dùng',
    icon: Users,
    description: 'Quản lý tài khoản',
  },
  {
    id: 'posts' as AdminTab,
    label: 'Bài viết',
    icon: LayoutGrid,
    description: 'Kiểm duyệt nội dung',
  },
  {
    id: 'reports' as AdminTab,
    label: 'Báo cáo',
    icon: ShieldCheck,
    description: 'Xử lý khiếu nại',
  },
  {
    id: 'reportReasons' as AdminTab,
    label: 'Lý do báo cáo',
    icon: ListChecks,
    description: 'Thêm / xóa lý do',
  },
] as const;

export function AdminSidebar({ activeTab, onTabChange }: AdminSidebarProps) {
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);

  const handleLogout = () => {
    if (window.confirm('Bạn có chắc chắn muốn đăng xuất?')) {
      dispatch(logout());
    }
  };

  return (
    <aside
      className="w-64 shrink-0 flex flex-col rounded-2xl overflow-hidden"
      style={{
        backgroundColor: '#00376B',
        boxShadow: '0 8px 32px rgba(0,0,0,0.35)',
        border: '1px solid rgba(99,102,241,0.2)',
      }}
    >
      {/* Header */}
      <div className="px-5 pt-6 pb-5" style={{ borderBottom: '1px solid rgba(99,102,241,0.2)' }}>
        <div className="flex items-center gap-3 mb-4">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
          >
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-xs font-semibold text-indigo-300 uppercase tracking-widest">Admin Panel</p>
            <p className="text-white font-bold text-sm leading-tight">Instory</p>
          </div>
        </div>

        {/* Admin info */}
        {user && (
          <div
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
            style={{ background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.2)' }}
          >
            <Avatar src={user.avatarUrl} alt={user.userName} size="sm" />
            <div className="min-w-0">
              <p className="text-white text-xs font-semibold truncate">{user.userName}</p>
              <p className="text-indigo-300 text-xs">Quản trị viên</p>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={clsx(
                'relative w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 text-left group',
                isActive
                  ? 'text-white'
                  : 'text-indigo-300 hover:text-white hover:bg-white/5'
              )}
              style={isActive ? {
                background: 'linear-gradient(135deg, rgba(99,102,241,0.35), rgba(139,92,246,0.25))',
                border: '1px solid rgba(99,102,241,0.4)',
                boxShadow: '0 0 16px rgba(99,102,241,0.2)',
              } : {
                border: '1px solid transparent',
              }}
            >
              {/* Active indicator bar */}
              {isActive && (
                <span
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 rounded-r-full"
                  style={{ background: 'linear-gradient(180deg, #818cf8, #a78bfa)' }}
                />
              )}
              <div
                className={clsx(
                  'w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200',
                  isActive ? '' : 'group-hover:scale-110'
                )}
                style={isActive ? {
                  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  boxShadow: '0 4px 12px rgba(99,102,241,0.4)',
                } : {
                  background: 'rgba(99,102,241,0.1)',
                }}
              >
                <Icon className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-semibold leading-tight">{tab.label}</p>
                <p className={clsx(
                  'text-xs leading-tight',
                  isActive ? 'text-indigo-200' : 'text-indigo-400'
                )}>{tab.description}</p>
              </div>
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 pb-4" style={{ borderTop: '1px solid rgba(99,102,241,0.2)', paddingTop: '1rem' }}>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-all duration-200 text-red-400 hover:text-red-300 hover:bg-red-500/10 group"
          style={{ border: '1px solid transparent' }}
        >
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-red-500/10 group-hover:bg-red-500/20 transition-colors">
            <LogOut className="w-4 h-4" />
          </div>
          <div>
            <p className="text-sm font-semibold leading-tight">Đăng xuất</p>
            <p className="text-xs text-red-500/60 leading-tight">Thoát phiên quản trị</p>
          </div>
        </button>
      </div>
    </aside>
  );
}

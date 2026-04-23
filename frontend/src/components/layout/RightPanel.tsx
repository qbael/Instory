import { useAppSelector } from '@/store';
import { Avatar } from '@/components/ui/Avatar';
import { Link } from 'react-router';

export function RightPanel() {
  const user = useAppSelector((s) => s.auth.user);

  return (
    <div className="sticky top-8 hidden xl:block w-[293px] shrink-0 pl-8">
      {/* Current user */}
      {user && (
        <Link
          to={`/profile/${user.userName}`}
          className="flex items-center gap-3 no-underline"
        >
          <Avatar
            src={user.avatarUrl}
            alt={user.fullName ?? user.userName}
            size="md"
          />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-text-primary">
              {user.userName}
            </p>
            <p className="truncate text-sm text-text-secondary">
              {user.fullName}
            </p>
          </div>
        </Link>
      )}

      {/* Suggested for you */}
      <div className="mt-6">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-semibold text-text-secondary">
            Gợi ý cho bạn
          </p>
          <button
            type="button"
            className="cursor-pointer text-xs font-semibold text-text-primary hover:text-text-secondary"
          >
            Xem tất cả
          </button>
        </div>
        <p className="text-xs text-text-secondary">
          Hãy kết bạn với mọi người để xem ảnh và video của họ tại đây.
        </p>
      </div>

      {/* Footer links */}
      <div className="mt-10 space-y-3">
        <p className="flex flex-wrap gap-x-1.5 text-[11px] text-text-secondary/50">
          <span>Giới thiệu</span>&middot;<span>Hỗ trợ</span>&middot;<span>Báo chí</span>
          &middot;<span>API</span>&middot;<span>Việc làm</span>&middot;
          <span>Bảo mật</span>&middot;<span>Điều khoản</span>
        </p>
        <p className="text-[11px] text-text-secondary/40">&copy; 2026 Instory</p>
      </div>
    </div>
  );
}

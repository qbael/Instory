import { useState, useEffect, useCallback, useRef } from 'react';
import { Users, Lock, Unlock, ShieldAlert, Search, X, UserCheck, UserX } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { adminService } from '@/services/adminService';
import { timeAgo } from '@/utils/formatDate';
import { toast } from 'sonner';
import type { User } from '@/types';

export function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounce search
  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [search]);

  const loadUsers = useCallback(async (pageNumber: number, searchQuery: string) => {
    setIsLoading(true);
    try {
      const { data } = await adminService.getUsers({
        pageNumber,
        pageSize: 20,
        search: searchQuery || undefined,
      });
      if (pageNumber === 1) {
        setUsers(data.data);
      } else {
        setUsers((prev) => [...prev, ...data.data]);
      }
      setHasMore(data.hasNextPage);
    } catch {
      toast.error('Lỗi tải danh sách người dùng');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers(page, debouncedSearch);
  }, [loadUsers, page, debouncedSearch]);

  const handlePromote = async (userId: number) => {
    if (!window.confirm('Bạn có chắc chắn muốn cấp quyền Admin cho người dùng này?')) return;
    try {
      await adminService.promoteToAdmin(userId);
      toast.success('Đã cấp quyền Admin');
      setUsers(users.map(u => u.id === userId ? { ...u, roles: [...u.roles, 'Admin'] } : u));
    } catch {
      toast.error('Thao tác thất bại');
    }
  };

  const handleToggleBlock = async (userId: number, currentStatus: boolean) => {
    try {
      await adminService.toggleUserBlock(userId);
      toast.success(currentStatus ? 'Đã mở khóa tài khoản' : 'Đã khóa tài khoản');
      setUsers(users.map(u => u.id === userId ? { ...u, isBlocked: !currentStatus } : u));
    } catch (err) {
      const e = err as { response?: { data?: { message?: string } } };
      toast.error(e.response?.data?.message || 'Thao tác thất bại');
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
          >
            <Users className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-text-primary">Quản lý người dùng</h2>
            <p className="text-xs text-text-secondary">Tìm kiếm và quản lý tài khoản</p>
          </div>
        </div>
      </div>

      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm theo username hoặc email..."
          className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-bg-card border border-border text-text-primary placeholder:text-text-secondary text-sm transition-all duration-200 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto bg-bg-card rounded-2xl border border-border shadow-sm">
        <table className="w-full text-left text-sm">
          <thead style={{ background: 'rgba(99,102,241,0.04)', borderBottom: '1px solid var(--color-border)' }}>
            <tr>
              <th className="px-5 py-3.5 font-semibold text-text-secondary text-xs uppercase tracking-wide">Người dùng</th>
              <th className="px-5 py-3.5 font-semibold text-text-secondary text-xs uppercase tracking-wide">Email</th>
              <th className="px-5 py-3.5 font-semibold text-text-secondary text-xs uppercase tracking-wide">Vai trò</th>
              <th className="px-5 py-3.5 font-semibold text-text-secondary text-xs uppercase tracking-wide">Trạng thái</th>
              <th className="px-5 py-3.5 font-semibold text-text-secondary text-xs uppercase tracking-wide">Ngày tham gia</th>
              <th className="px-5 py-3.5 font-semibold text-text-secondary text-xs uppercase tracking-wide">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-primary/3 transition-colors group">
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <Avatar src={u.avatarUrl} alt={u.userName} size="sm" />
                    <div>
                      <p className="font-semibold text-text-primary">{u.userName}</p>
                      {u.fullName && <p className="text-xs text-text-secondary">{u.fullName}</p>}
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3.5 text-text-secondary text-xs">{u.email}</td>
                <td className="px-5 py-3.5">
                  {u.roles?.includes('Admin') ? (
                    <span
                      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold"
                      style={{ background: 'rgba(99,102,241,0.12)', color: '#6366f1' }}
                    >
                      <ShieldAlert className="w-3 h-3" /> Admin
                    </span>
                  ) : (
                    <span
                      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold"
                      style={{ background: 'rgba(142,142,142,0.1)', color: '#8e8e8e' }}
                    >
                      <Users className="w-3 h-3" /> User
                    </span>
                  )}
                </td>
                <td className="px-5 py-3.5">
                  {u.isBlocked ? (
                    <span
                      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold"
                      style={{ background: 'rgba(237,73,86,0.1)', color: '#ed4956' }}
                    >
                      <UserX className="w-3 h-3" /> Bị khóa
                    </span>
                  ) : (
                    <span
                      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold"
                      style={{ background: 'rgba(88,195,34,0.1)', color: '#58c322' }}
                    >
                      <UserCheck className="w-3 h-3" /> Hoạt động
                    </span>
                  )}
                </td>
                <td className="px-5 py-3.5 text-text-secondary text-xs">{timeAgo(u.createdAt)}</td>
                <td className="px-5 py-3.5">
                  <div className="flex gap-2 opacity-70 group-hover:opacity-100 transition-opacity">
                    {!u.roles?.includes('Admin') && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handlePromote(u.id)}
                        title="Nâng quyền Admin"
                      >
                        <ShieldAlert className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    <Button
                      variant={u.isBlocked ? 'secondary' : 'danger'}
                      size="sm"
                      onClick={() => handleToggleBlock(u.id, !!u.isBlocked)}
                      title={u.isBlocked ? 'Mở khóa' : 'Khóa tài khoản'}
                    >
                      {u.isBlocked ? <Unlock className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {isLoading && (
          <div className="flex justify-center py-8">
            <Spinner />
          </div>
        )}

        {!isLoading && users.length === 0 && (
          <div className="py-16 text-center">
            <Search className="mx-auto mb-3 h-10 w-10 text-text-secondary opacity-30" />
            <p className="text-text-secondary font-medium">
              {debouncedSearch ? `Không tìm thấy kết quả cho "${debouncedSearch}"` : 'Không có người dùng nào.'}
            </p>
          </div>
        )}

        {hasMore && (
          <div className="border-t border-border p-4 flex justify-center">
            <Button variant="secondary" onClick={() => setPage(p => p + 1)} disabled={isLoading}>
              Tải thêm
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

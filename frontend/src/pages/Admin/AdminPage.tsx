import { useState, useEffect, useCallback } from 'react';
import { ShieldCheck, Trash2, Eye, AlertTriangle } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { adminService } from '@/services/adminService';
import { useAppSelector } from '@/store';
import { timeAgo } from '@/utils/formatDate';
import { toast } from 'sonner';
import type { PostReport } from '@/types';

export default function AdminPage() {
  const user = useAppSelector((s) => s.auth.user);
  const [reports, setReports] = useState<PostReport[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadReports = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await adminService.getReports({ pageNumber: 1, pageSize: 50 });
      setReports(data.data);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const handleResolve = async (reportId: number, action: 'dismiss' | 'remove_post') => {
    try {
      await adminService.resolveReport(reportId, action);
      setReports((prev) => prev.filter((r) => r.id !== reportId));
      toast.success(action === 'dismiss' ? 'Đã bỏ qua báo cáo' : 'Đã xóa bài viết');
    } catch {
      toast.error('Thao tác thất bại');
    }
  };

  if (!user) return null;

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <ShieldCheck className="h-6 w-6 text-primary" />
        <h1 className="text-xl font-semibold">Quản trị — Kiểm duyệt nội dung</h1>
      </div>

      {isLoading && (
        <div className="flex justify-center py-20">
          <Spinner size="lg" />
        </div>
      )}

      {!isLoading && reports.length === 0 && (
        <div className="py-20 text-center">
          <ShieldCheck className="mx-auto mb-3 h-12 w-12 text-success" />
          <p className="text-lg font-semibold">Tất cả ổn</p>
          <p className="mt-1 text-sm text-text-secondary">
            Không có báo cáo nào cần xem xét.
          </p>
        </div>
      )}

      <div className="space-y-3">
        {reports.map((report) => (
          <div
            key={report.id}
            className="rounded-lg border border-border bg-bg-card p-4"
          >
            {/* Reporter info */}
            <div className="mb-3 flex items-center gap-2 text-sm text-text-secondary">
              <AlertTriangle className="h-4 w-4 text-warning" />
              <span>
                Được báo cáo bởi{' '}
                <span className="font-semibold text-text-primary">
                  {report.reporter.userName}
                </span>
              </span>
              <span>&middot;</span>
              <span>{timeAgo(report.createdAt)}</span>
            </div>

            {/* Reason */}
            {report.reason && (
              <p className="mb-3 rounded-md bg-bg px-3 py-2 text-sm text-text-primary">
                &ldquo;{report.reason}&rdquo;
              </p>
            )}

            {/* Post preview */}
            <div className="mb-3 flex items-start gap-3 rounded-md border border-border p-3">
              <Avatar
                src={report.post.user.avatarUrl}
                alt={report.post.user.userName}
                size="sm"
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">
                  {report.post.user.userName}
                </p>
                {report.post.content && (
                  <p className="mt-0.5 text-sm text-text-secondary line-clamp-2">
                    {report.post.content}
                  </p>
                )}
                {report.post.images?.[0]?.imageUrl && (
                  <img
                    src={report.post.images[0].imageUrl}
                    alt=""
                    className="mt-2 h-20 w-20 rounded object-cover"
                  />
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleResolve(report.id, 'dismiss')}
              >
                <Eye className="h-4 w-4" />
                Bỏ qua
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => handleResolve(report.id, 'remove_post')}
              >
                <Trash2 className="h-4 w-4" />
                Xóa bài viết
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

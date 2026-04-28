import { useState, useEffect, useCallback } from 'react';
import { ShieldCheck, Trash2, AlertTriangle, CheckCircle } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { adminService } from '@/services/adminService';
import { timeAgo } from '@/utils/formatDate';
import { toast } from 'sonner';
import type { AdminReport } from '@/types';

export function ReportManagement() {
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [resolvingId, setResolvingId] = useState<number | null>(null);

  const loadReports = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await adminService.getReports({ pageNumber: 1, pageSize: 50 });
      setReports(data.data);
    } catch {
      toast.error('Lỗi tải danh sách báo cáo');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const handleResolve = async (reportId: number, action: 'dismiss' | 'remove_post') => {
    setResolvingId(reportId);
    try {
      await adminService.resolveReport(reportId, action);
      setReports((prev) => prev.filter((r) => r.id !== reportId));
      toast.success(action === 'dismiss' ? 'Đã bỏ qua báo cáo' : 'Đã xóa bài viết');
    } catch {
      toast.error('Thao tác thất bại');
    } finally {
      setResolvingId(null);
    }
  };

  if (isLoading && reports.length === 0) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!isLoading && reports.length === 0) {
    return (
      <div className="py-20 text-center bg-bg-card rounded-2xl border border-border">
        <div
          className="mx-auto mb-4 w-16 h-16 rounded-2xl flex items-center justify-center"
          style={{ background: 'rgba(88,195,34,0.1)' }}
        >
          <ShieldCheck className="h-8 w-8 text-success" />
        </div>
        <p className="text-lg font-bold text-text-primary">Tất cả ổn!</p>
        <p className="mt-1 text-sm text-text-secondary">Không có báo cáo nào cần xem xét.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #f59e0b, #ef4444)' }}
          >
            <ShieldCheck className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-text-primary">Bài viết bị báo cáo</h2>
            <p className="text-xs text-text-secondary">{reports.length} báo cáo đang chờ xử lý</p>
          </div>
        </div>
      </div>

      {/* Report cards */}
      <div className="space-y-4">
        {reports.map((report) => {
          const isProcessing = resolvingId === report.id;
          return (
            <div
              key={report.id}
              className="rounded-2xl border border-border bg-bg-card overflow-hidden transition-all duration-200"
              style={{ borderLeft: '3px solid #f59e0b' }}
            >
              <div className="p-4">
                {/* Reporter info */}
                <div className="flex items-center gap-2 mb-3">
                  <div
                    className="flex items-center gap-1.5 rounded-full px-2.5 py-1"
                    style={{ background: 'rgba(245,158,11,0.1)' }}
                  >
                    <AlertTriangle className="h-3.5 w-3.5" style={{ color: '#f59e0b' }} />
                    <span className="text-xs font-semibold" style={{ color: '#f59e0b' }}>Báo cáo</span>
                  </div>
                  <span className="text-xs text-text-secondary">
                    bởi{' '}
                    <span className="font-semibold text-text-primary">{report.reporter?.userName || 'Ẩn danh'}</span>
                  </span>
                  <span className="text-text-secondary text-xs">·</span>
                  <span className="text-xs text-text-secondary">{timeAgo(report.createdAt)}</span>
                </div>

                {/* Reason */}
                {report.reason && (
                  <div
                    className="mb-3 rounded-xl px-3 py-2.5 text-sm"
                    style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)' }}
                  >
                    <p className="font-semibold text-text-primary text-xs mb-0.5">Lý do báo cáo</p>
                    <p className="text-text-secondary text-xs">
                      {report.reason}
                      {report.reasonDetail && <span> — {report.reasonDetail}</span>}
                    </p>
                  </div>
                )}

                {/* Post preview */}
                <div className="mb-4 rounded-xl border border-border p-3 bg-bg">
                  <div className="flex items-start gap-3">
                    <Avatar
                      src={report.post.user?.avatarUrl}
                      alt={report.post.user?.userName || ''}
                      size="sm"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-text-primary">{report.post.user?.userName}</p>
                      {report.post.content && (
                        <p className="mt-1 text-sm text-text-secondary line-clamp-3 leading-relaxed">
                          {report.post.content}
                        </p>
                      )}
                      {report.post.images?.[0]?.imageUrl && (
                        <img
                          src={report.post.images[0].imageUrl}
                          alt=""
                          className="mt-2 h-24 w-24 rounded-lg object-cover border border-border"
                        />
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleResolve(report.id, 'dismiss')}
                    disabled={isProcessing}
                  >
                    <CheckCircle className="h-4 w-4" />
                    Bỏ qua
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleResolve(report.id, 'remove_post')}
                    disabled={isProcessing}
                  >
                    {isProcessing ? <Spinner size="sm" /> : <Trash2 className="h-4 w-4" />}
                    Xóa bài viết
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

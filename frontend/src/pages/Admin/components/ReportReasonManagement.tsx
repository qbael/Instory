import { useCallback, useEffect, useMemo, useState } from 'react';
import { ListChecks, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { adminService, type AdminReportReason } from '@/services/adminService';

export function ReportReasonManagement() {
  const [reasons, setReasons] = useState<AdminReportReason[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState(1);

  const loadReasons = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await adminService.getReportReasons();
      setReasons(data || []);
    } catch (err) {
      const e = err as { response?: { data?: { message?: string } } };
      toast.error(e.response?.data?.message || 'Lỗi tải danh sách lý do báo cáo');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReasons();
  }, [loadReasons]);

  const canSubmit = useMemo(() => code.trim().length > 0 && name.trim().length > 0, [code, name]);

  const handleCreate = async () => {
    if (!canSubmit) {
      toast.error('Vui lòng nhập code và tên lý do');
      return;
    }

    setIsSubmitting(true);
    try {
      const { data } = await adminService.createReportReason({
        code: code.trim(),
        name: name.trim(),
        description: description.trim() || undefined,
        severity: severity || 1,
      });
      toast.success('Đã thêm lý do báo cáo');
      setReasons((prev) => [data, ...prev]);
      setCode('');
      setName('');
      setDescription('');
      setSeverity(1);
    } catch (err) {
      const e = err as { response?: { data?: { message?: string } } };
      toast.error(e.response?.data?.message || 'Thêm lý do thất bại');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (reasonId: number) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa lý do này?')) return;
    setDeletingId(reasonId);
    try {
      await adminService.deleteReportReason(reasonId);
      toast.success('Đã xóa lý do báo cáo');
      setReasons((prev) => prev.filter((r) => r.id !== reasonId));
    } catch (err) {
      const e = err as { response?: { data?: { message?: string } } };
      toast.error(e.response?.data?.message || 'Xóa lý do thất bại');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #10b981, #6366f1)' }}
          >
            <ListChecks className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-text-primary">Lý do báo cáo</h2>
            <p className="text-xs text-text-secondary">Thêm / xóa lý do báo cáo bài viết</p>
          </div>
        </div>
      </div>

      {/* Create form */}
      <div className="rounded-2xl border border-border bg-bg-card p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">Code</label>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="vd: spam, hate, other..."
              className="w-full px-3 py-2.5 rounded-xl bg-bg border border-border text-text-primary placeholder:text-text-secondary text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">Tên lý do</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="vd: Spam / Lừa đảo..."
              className="w-full px-3 py-2.5 rounded-xl bg-bg border border-border text-text-primary placeholder:text-text-secondary text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-text-secondary mb-1">Mô tả (tuỳ chọn)</label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Mô tả ngắn hiển thị cho người dùng..."
              className="w-full px-3 py-2.5 rounded-xl bg-bg border border-border text-text-primary placeholder:text-text-secondary text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">Mức độ (severity)</label>
            <input
              type="number"
              min={1}
              value={severity}
              onChange={(e) => setSeverity(parseInt(e.target.value || '1', 10))}
              className="w-full px-3 py-2.5 rounded-xl bg-bg border border-border text-text-primary text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div className="flex items-end justify-end">
            <Button onClick={handleCreate} disabled={!canSubmit || isSubmitting}>
              {isSubmitting ? <Spinner size="sm" /> : <Plus className="h-4 w-4" />}
              Thêm lý do
            </Button>
          </div>
        </div>
      </div>

      {/* List */}
      <div className="overflow-x-auto bg-bg-card rounded-2xl border border-border shadow-sm">
        {isLoading && reasons.length === 0 ? (
          <div className="flex justify-center py-16">
            <Spinner size="lg" />
          </div>
        ) : reasons.length === 0 ? (
          <div className="py-16 text-center text-text-secondary">
            Chưa có lý do báo cáo nào.
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead style={{ background: 'rgba(99,102,241,0.04)', borderBottom: '1px solid var(--color-border)' }}>
              <tr>
                <th className="px-5 py-3.5 font-semibold text-text-secondary text-xs uppercase tracking-wide">Code</th>
                <th className="px-5 py-3.5 font-semibold text-text-secondary text-xs uppercase tracking-wide">Tên</th>
                <th className="px-5 py-3.5 font-semibold text-text-secondary text-xs uppercase tracking-wide">Mô tả</th>
                <th className="px-5 py-3.5 font-semibold text-text-secondary text-xs uppercase tracking-wide">Severity</th>
                <th className="px-5 py-3.5 font-semibold text-text-secondary text-xs uppercase tracking-wide">Đã dùng</th>
                <th className="px-5 py-3.5 font-semibold text-text-secondary text-xs uppercase tracking-wide">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {reasons.map((r) => {
                const isDeleting = deletingId === r.id;
                return (
                  <tr key={r.id} className="hover:bg-primary/3 transition-colors group">
                    <td className="px-5 py-3.5 text-text-secondary text-xs">{r.code}</td>
                    <td className="px-5 py-3.5 font-semibold text-text-primary">{r.name}</td>
                    <td className="px-5 py-3.5 text-text-secondary text-xs">{r.description || '-'}</td>
                    <td className="px-5 py-3.5 text-text-secondary text-xs">{r.severity}</td>
                    <td className="px-5 py-3.5 text-text-secondary text-xs">{r.usageCount}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex gap-2 opacity-70 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleDelete(r.id)}
                          disabled={isDeleting}
                          title={r.usageCount > 0 ? 'Lý do đang được dùng sẽ không xóa được' : 'Xóa'}
                        >
                          {isDeleting ? <Spinner size="sm" /> : <Trash2 className="h-3.5 w-3.5" />}
                          Xóa
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}


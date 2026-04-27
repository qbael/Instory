import { useState, useEffect } from "react";
import { AlertTriangle, Loader } from "lucide-react";
import { toast } from "sonner";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { postService } from "@/services/postService";
import type { ReportReason } from "@/types";
import axios from "axios";

interface ReportPostModalProps {
  postId: number;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function ReportPostModal({
  postId,
  isOpen,
  onClose,
  onSuccess,
}: ReportPostModalProps) {
  const [reasons, setReasons] = useState<ReportReason[]>([]);
  const [selectedReasonId, setSelectedReasonId] = useState<number | null>(null);
  const [reasonDetail, setReasonDetail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingReasons, setIsFetchingReasons] = useState(false);
  const [selectedReasonCode, setSelectedReasonCode] = useState<string>("");

  // Fetch report reasons when modal opens
  useEffect(() => {
    if (!isOpen) return;

    const fetchReasons = async () => {
      setIsFetchingReasons(true);
      try {
        const {data}  = await postService.getReportReasons();
        setReasons(data || []);
      } catch (error) {
        toast.error("Không thể tải danh sách lý do báo cáo");
        console.error("Fetch report reasons error:", error);
      } finally {
        setIsFetchingReasons(false);
      }
    };

    fetchReasons();
  }, [isOpen]);

  const handleSubmit = async () => {
    if (selectedReasonId === null) {
      toast.error("Vui lòng chọn lý do báo cáo");
      return;
    }

    // Check if custom reason is selected but no detail provided
    if (selectedReasonCode === "other" && !reasonDetail.trim()) {
      toast.error("Vui lòng nhập lý do chi tiết");
      return;
    }

    setIsLoading(true);
    try {
      const finalReasonDetail =
        selectedReasonCode === "other" ? reasonDetail.trim() : undefined;

      await postService.report(postId, selectedReasonId, finalReasonDetail);
      toast.success("Báo cáo bài viết thành công");
      handleClose();
      onSuccess?.();
    } catch (error: any) {
      const errorMessage = 
        error.response?.data?.message || 
        error.response?.data?.detail || 
        "Lỗi hệ thống khi báo cáo bài viết";

      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    // Reset state
    setSelectedReasonId(null);
    setReasonDetail("");
    setSelectedReasonCode("");
    onClose();
  };

  const isFormValid =
    selectedReasonId !== null &&
    (selectedReasonCode !== "other" || reasonDetail.trim());

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Báo cáo bài viết"
      size="md"
    >
      <div className="flex h-full flex-col overflow-hidden">
        {/* Header warning - fixed */}
        <div className="flex-shrink-0 border-b border-border px-5 pt-5 pb-4">
          <div className="flex gap-3 rounded-lg bg-error/10 p-3">
            <AlertTriangle className="h-5 w-5 flex-shrink-0 text-error" />
            <p className="text-sm text-text-primary">
              Báo cáo bài viết sẽ được gửi đến nhóm quản trị viên của chúng tôi để xem xét.
            </p>
          </div>
        </div>

        {/* Content - scrollable */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {/* Loading state */}
          {isFetchingReasons ? (
            <div className="flex items-center justify-center py-8">
              <Loader className="h-5 w-5 animate-spin text-text-secondary" />
            </div>
          ) : reasons.length === 0 ? (
            <p className="py-4 text-center text-text-secondary">
              Không có lý do báo cáo nào
            </p>
          ) : (
            <>
              {/* Report Reasons */}
              <div className="mb-4">
                <label className="mb-3 block text-sm font-semibold text-text-primary">
                  Lý do báo cáo
                </label>
                <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                  {reasons.map((reason) => (
                    <label
                      key={reason.id}
                      className="flex cursor-pointer items-start gap-3 rounded-lg border border-border px-3 py-2.5 transition-colors hover:bg-border/30"
                    >
                      <input
                        type="radio"
                        name="reason"
                        value={reason.id}
                        checked={selectedReasonId === reason.id}
                        onChange={(e) =>{
                            setSelectedReasonId(parseInt(e.target.value, 10));
                            setSelectedReasonCode(reason.code);          
                        }}
                        className="mt-0.5 flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-text-primary">
                          {reason.name}
                        </p>
                        {reason.description && (
                          <p className="text-xs text-text-secondary line-clamp-2">
                            {reason.description}
                          </p>
                        )}
                      </div>
                    </label>
                  ))}
                 
                </div>
              </div>

              {/* Custom reason textarea */}
              {selectedReasonCode === "other" && (
                <div className="mb-2">
                  <label className="mb-2 block text-sm font-medium text-text-primary">
                    Chi tiết lý do
                  </label>
                  <textarea
                    value={reasonDetail}
                    onChange={(e) => setReasonDetail(e.target.value)}
                    placeholder="Vui lòng mô tả chi tiết lý do báo cáo bài viết này..."
                    maxLength={500}
                    rows={3}
                    className="w-full rounded-lg border border-border bg-bg-primary px-3 py-2 text-sm text-text-primary placeholder-text-secondary transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                  />
                  <p className="mt-1 text-xs text-text-secondary">
                    {reasonDetail.length}/500 ký tự
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Action buttons - fixed */}
        <div className="flex-shrink-0 border-t border-border px-5 py-4 bg-bg-primary">
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
              className="flex-1"
            >
              Hủy
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!isFormValid || isLoading}
              className="flex-1"
            >
              {isLoading ? "Đang gửi..." : "Báo cáo"}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

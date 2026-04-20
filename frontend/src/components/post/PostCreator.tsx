import { useState, useRef, useCallback, useEffect } from "react";
import { ImagePlus, X } from "lucide-react";
import { toast } from "sonner";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { useAppSelector, useAppDispatch } from "@/store";
import { closeModal } from "@/store/slices/uiSlice";
import { postService } from "@/services/postService";
import { cn } from "@/utils/cn";
import { ACCEPTED_IMAGE_TYPES, MAX_IMAGE_SIZE_MB } from "@/utils/constants";

const MAX_CAPTION = 2200;

export function PostCreator() {
  const dispatch = useAppDispatch();
  const isOpen = useAppSelector((s) => s.ui.activeModal === "createPost");
  const user = useAppSelector((s) => s.auth.user);

  const [caption, setCaption] = useState("");
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleClose = useCallback(() => {
    dispatch(closeModal());
    setCaption("");
    setImageFiles([]);
    setImagePreviews([]);
  }, [dispatch]);

  const handleFileSelect = useCallback((files: File[]) => {
    const accepted: File[] = [];
    files.forEach((file) => {
      if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
        toast.error("Chỉ chấp nhận ảnh JPEG, PNG, WebP và GIF");
        return;
      }
      if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
        toast.error(`Ảnh phải nhỏ hơn ${MAX_IMAGE_SIZE_MB}MB`);
        return;
      }
      accepted.push(file);
    });

    if (accepted.length === 0) return;

    // append files and generate previews
    accepted.forEach((file) => {
      setImageFiles((prev) => [...prev, file]);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreviews((prev) => [...prev, e.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });

    // focus to first image when new images are added
    setCurrentIndex(0);
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const list = Array.from(e.dataTransfer.files || []);
      if (list.length) handleFileSelect(list);
    },
    [handleFileSelect],
  );

  const onFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const list = Array.from(e.target.files || []);
      if (list.length) handleFileSelect(list);
    },
    [handleFileSelect],
  );

  const removeAllImages = useCallback(() => {
    setImageFiles([]);
    setImagePreviews([]);
    setCurrentIndex(0);
    if (fileRef.current) fileRef.current.value = "";
  }, []);

  const removeImageAt = useCallback((index: number) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => {
      const next = prev.filter((_, i) => i !== index);
      return next;
    });
    setCurrentIndex((ci) => {
      const newIdx = ci > 0 ? ci - (ci === index ? 1 : 0) : 0;
      return Math.max(0, newIdx);
    });
  }, []);

  useEffect(() => {
    // clamp currentIndex when previews change
    setCurrentIndex((ci) => {
      if (imagePreviews.length === 0) return 0;
      return Math.min(ci, imagePreviews.length - 1);
    });
  }, [imagePreviews]);

  const prevImage = useCallback(() => {
    setCurrentIndex(
      (ci) => (ci - 1 + imagePreviews.length) % imagePreviews.length,
    );
  }, [imagePreviews.length]);

  const nextImage = useCallback(() => {
    setCurrentIndex((ci) => (ci + 1) % imagePreviews.length);
  }, [imagePreviews.length]);

  const handleSubmit = async () => {
    if (!caption.trim() && imageFiles.length === 0) return;
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      if (caption.trim()) formData.append("Content", caption.trim());

      formData.append("AllowComment", "true");

      // append multiple images (backend should accept repeated 'images' fields)
      imageFiles.forEach((f) => formData.append("Images", f));

      await postService.create(formData);
      // console.log("FormData to submit:");
      toast.success("Đã tạo bài viết!");
      handleClose();
      window.dispatchEvent(new CustomEvent("post-created"));
    } catch {
      toast.error("Tạo bài viết thất bại");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Tạo bài viết mới"
      size="md"
    >
      <div className="p-5">
        {/* User info */}
        <div className="mb-4 flex items-center gap-3">
          <Avatar src={user?.avatarUrl} alt={user?.userName ?? ""} size="sm" />
          <span className="text-sm font-semibold">{user?.userName}</span>
        </div>

        {/* Caption */}
        <textarea
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="Viết chú thích…"
          maxLength={MAX_CAPTION}
          rows={4}
          className="w-full resize-none rounded-lg border border-border bg-bg px-3 py-2.5 text-sm text-text-primary placeholder:text-text-secondary/70 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
        <p
          className={cn(
            "mb-4 text-right text-xs",
            caption.length > MAX_CAPTION * 0.9
              ? "text-error"
              : "text-text-secondary",
          )}
        >
          {caption.length}/{MAX_CAPTION}
        </p>

        {/* Image upload / preview */}
        {imagePreviews.length > 0 ? (
          <div className="relative mb-4">
            <div className="relative flex items-center justify-center overflow-hidden rounded-lg px-4">
              <div className="flex items-center justify-center bg-black/5">
                <img
                  src={imagePreviews[currentIndex]}
                  alt={`Xem trước ${currentIndex + 1}`}
                  className="max-h-80 w-full object-contain bg-black/5"
                />
              </div>
              <button
                type="button"
                onClick={() => removeImageAt(currentIndex)}
                className="absolute right-2 top-0 cursor-pointer rounded-full bg-black/60 p-1.5 text-white transition-colors hover:bg-black/80"
              >
                <X className="h-4 w-4" />
              </button>

              {imagePreviews.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={prevImage}
                    className="absolute left-0 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-2 text-white hover:bg-black/60 cursor-pointer"
                    aria-label="Previous"
                  >
                    ‹
                  </button>
                  <button
                    type="button"
                    onClick={nextImage}
                    className="absolute right-0 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-2 text-white hover:bg-black/60 cursor-pointer"
                    aria-label="Next"
                  >
                    ›
                  </button>
                </>
              )}
            </div>

            <div className="mt-2 flex items-center justify-between">
              <div className="flex gap-2">
                {imagePreviews.map((src, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setCurrentIndex(idx)}
                    className={cn(
                      "overflow-hidden rounded-md ring-offset-2",
                      idx === currentIndex ? "ring-2 ring-primary" : "",
                    )}
                  >
                    <img
                      src={src}
                      className="h-12 w-12 object-cover"
                      alt={`thumb-${idx}`}
                    />
                  </button>
                ))}
              </div>
              <div className="text-xs text-text-secondary/70">
                {currentIndex + 1}/{imagePreviews.length}
              </div>
            </div>
          </div>
        ) : (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={onDrop}
            onClick={() => fileRef.current?.click()}
            className={cn(
              "mb-4 flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed py-10 transition-colors",
              isDragging
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50",
            )}
          >
            <ImagePlus className="mb-2 h-10 w-10 text-text-secondary" />
            <p className="text-sm font-medium text-text-secondary">
              Kéo ảnh vào đây hoặc <span className="text-primary">duyệt</span>
            </p>
            <p className="mt-1 text-xs text-text-secondary/60">
              JPEG, PNG, WebP, GIF tối đa {MAX_IMAGE_SIZE_MB}MB
            </p>
          </div>
        )}

        <input
          ref={fileRef}
          type="file"
          accept={ACCEPTED_IMAGE_TYPES.join(",")}
          onChange={onFileChange}
          className="hidden"
          multiple
        />

        {/* Visible image button + Submit */}
        <div className="mb-3 flex items-center gap-2">
          <Button
            onClick={() => fileRef.current?.click()}
            size="sm"
            type="button"
          >
            <ImagePlus className="mr-1 h-4 w-4" /> Thêm ảnh
          </Button>
          {imageFiles.length > 0 ? (
            <Button
              type="button"
              onClick={removeAllImages}
              className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-text-primary bg-transparent hover:bg-border/40"
              size="sm"
            >
              <X className="h-4 w-4" /> Xóa tất cả
            </Button>
          ) : null}
        </div>

        <Button
          onClick={handleSubmit}
          fullWidth
          size="lg"
          isLoading={isSubmitting}
          disabled={!caption.trim() && imageFiles.length === 0}
        >
          Đăng
        </Button>
      </div>
    </Modal>
  );
}

import { useState, useRef, useCallback, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { ImagePlus, X, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { postService } from "@/services/postService";
import { cn } from "@/utils/cn";
import { ACCEPTED_IMAGE_TYPES, MAX_IMAGE_SIZE_MB } from "@/utils/constants";
import type { Post, PostImage } from "@/types";
import { timeAgo } from "@/utils/formatDate";

const MAX_CAPTION = 2200;

export default function EditPost() {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();  
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [caption, setCaption] = useState("");
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<PostImage[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [removedImageIds, setRemovedImageIds] = useState<number[]>([]);   
  const fileRef = useRef<HTMLInputElement>(null);

  // Fetch post data on mount
  useEffect(() => {
    const fetchPost = async () => {
      if (!postId) return;
      try {
        setLoading(true);
        const response = await postService.getById(Number(postId));        
        setPost(response.data);
        // console.log(response.data);
        setCaption(response.data.content || "");
        setExistingImages(response.data.images || []);
        setImagePreviews(response.data.images.map((img) => img.imageUrl) || []);
      } catch (error) {
        toast.error("Không thể tải bài viết");
        navigate(`/`);        
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [postId, navigate]);

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
    // Cập nhật state MỘT LẦN duy nhất
    setImageFiles((prev) => [...prev, ...accepted]);

    // use URL.createObjectURL instead of FileReader to make sure speed and correct order of previews
    const newPreviews = accepted.map(file => URL.createObjectURL(file));
    setImagePreviews((prev) => [...prev, ...newPreviews]);

    // focus to first new image
    setCurrentIndex(existingImages.length);
  }, [existingImages.length]);

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

  const removeExistingImage = useCallback((imageId: number, index: number) => {
    setRemovedImageIds((prev) => [...prev, imageId]);
    setExistingImages((prev) => prev.filter((img) => img.id !== imageId));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
    setCurrentIndex((ci) => {
      if (imagePreviews.length === 1) return 0;
      return ci > 0 ? ci - 1 : 0;
    });
  }, [imagePreviews.length]);

  const removeNewImage = useCallback((fileIndex: number) => {
    const actualIndex = existingImages.length + fileIndex;
    setImageFiles((prev) => prev.filter((_, i) => i !== fileIndex));
    setImagePreviews((prev) => prev.filter((_, i) => i !== actualIndex));
    setCurrentIndex((ci) => {
      if (imagePreviews.length === 1) return 0;
      return ci > 0 ? ci - 1 : 0;
    });
  }, [existingImages.length, imagePreviews.length]);

  const removeAllImages = useCallback(() => {
    setImageFiles([]);
    setImagePreviews([]);
    setExistingImages([]);
    setRemovedImageIds(post?.images.map((img) => img.id) || []);
    setCurrentIndex(0);
    if (fileRef.current) fileRef.current.value = "";
  }, [post?.images]);

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

  const handleRemoveImage = useCallback(() => {
    if (currentIndex < existingImages.length) {
      removeExistingImage(existingImages[currentIndex].id, currentIndex);
    } else {
      const fileIndex = currentIndex - existingImages.length;
      removeNewImage(fileIndex);
    }
  }, [currentIndex, existingImages, removeExistingImage, removeNewImage]);

  const handleSubmit = async () => {
    if (!caption.trim() && imagePreviews.length === 0) return;
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      if (caption.trim()) formData.append("Content", caption.trim());

      formData.append("AllowComment", "true");

      // append new images
      imageFiles.forEach((f) => formData.append("NewImages", f));

      // append removed image IDs
      if (removedImageIds.length > 0) {
        removedImageIds.forEach((id) => {          
          formData.append("RemovedImageIds", id.toString()); 
        });
      }     

      await postService.update(Number(postId), formData);
      toast.success("Đã cập nhật bài viết!");
      navigate(-1);
    } catch {
      toast.error("Cập nhật bài viết thất bại");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-border border-t-primary" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-text-secondary">Không tìm thấy bài viết</p>
      </div>
    );
  }

  const totalImages = existingImages.length + imageFiles.length;

  return (
    <div className="min-h-screen bg-bg py-4 px-4 sm:py-6 sm:px-6 md:py-8 md:px-8">
      <div className="mx-auto w-full max-w-2xl">
        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="rounded-full p-2 hover:bg-border/40 transition-colors cursor-pointer"
            aria-label="Go back"
          >
            <ArrowLeft className="h-5 w-5 text-text-primary" />
          </button>
          <h1 className="text-xl sm:text-2xl font-bold text-text-primary">
            Chỉnh sửa bài viết
          </h1>
        </div>

        {/* Card wrapper */}
        <div className="rounded-lg border border-border bg-surface p-4 sm:p-6">
          {/* User info */}
          <div className="mb-6 flex items-center gap-3">
            <Avatar
              src={post.user.avatarUrl}
              alt={post.user.userName}
              size="sm"
            />
            <div>
              <p className="text-sm font-semibold text-text-primary">
                {post.user.userName}
              </p>
              <p className="text-xs text-text-secondary">
                {timeAgo(post.createdAt)}
              </p>
            </div>
          </div>

          {/* Caption */}
          <div className="mb-6">
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
                "mt-2 text-right text-xs",
                caption.length > MAX_CAPTION * 0.9
                  ? "text-error"
                  : "text-text-secondary",
              )}
            >
              {caption.length}/{MAX_CAPTION}
            </p>
          </div>

          {/* Image upload / preview */}
          {totalImages > 0 ? (
            <div className="relative mb-6">
              <div className="relative flex items-center justify-center overflow-hidden rounded-lg">
                <div className="flex min-h-100 w-full items-center justify-center bg-black/10 py-8 sm:py-12">
                  <img
                    src={imagePreviews[currentIndex]}
                    alt={`Xem trước ${currentIndex + 1}`}
                    className="max-h-100 w-full object-cover"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="absolute right-2 top-2 cursor-pointer rounded-full bg-black/60 p-1.5 text-white transition-colors hover:bg-black/80 sm:p-2"
                  title="Xóa ảnh này"
                >
                  <X className="h-4 w-4 sm:h-5 sm:w-5" />
                </button>

                {totalImages > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={prevImage}
                      className="absolute left-0 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-1.5 text-white hover:bg-black/60 cursor-pointer sm:p-2"
                      aria-label="Previous"
                    >
                      ‹
                    </button>
                    <button
                      type="button"
                      onClick={nextImage}
                      className="absolute right-0 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-1.5 text-white hover:bg-black/60 cursor-pointer sm:p-2"
                      aria-label="Next"
                    >
                      ›
                    </button>
                  </>
                )}
              </div>

              <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0">
                  {imagePreviews.map((src, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setCurrentIndex(idx)}
                      className={cn(
                        "flex-shrink-0 overflow-hidden rounded-md ring-offset-2 transition-all",
                        idx === currentIndex ? "ring-2 ring-primary" : "",
                      )}
                      title={
                        idx < existingImages.length
                          ? "Ảnh gốc"
                          : "Ảnh mới thêm"
                      }
                    >
                      <img
                        src={src}
                        className="h-12 w-12 object-cover sm:h-14 sm:w-14"
                        alt={`thumb-${idx}`}
                      />
                    </button>
                  ))}
                </div>
                <div className="text-xs text-text-secondary/70 whitespace-nowrap">
                  {currentIndex + 1}/{totalImages}
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
                "mb-6 flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed py-8 sm:py-10 transition-colors",
                isDragging
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50",
              )}
            >
              <ImagePlus className="mb-2 h-8 w-8 sm:h-10 sm:w-10 text-text-secondary" />
              <p className="text-center text-sm font-medium text-text-secondary">
                Kéo ảnh vào đây hoặc <span className="text-primary">duyệt</span>
              </p>
              <p className="mt-1 text-center text-xs text-text-secondary/60">
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

          {/* Action buttons */}
          <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
            <Button
              onClick={() => fileRef.current?.click()}
              size="sm"
              type="button"
              className="w-full sm:w-auto"
            >
              <ImagePlus className="mr-1 h-4 w-4" /> Thêm ảnh
            </Button>
            {totalImages > 0 ? (
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

          {/* Submit buttons */}
          <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
            <Button
              onClick={() => navigate(-1)}
              fullWidth
              size="lg"
              type="button"
              className="bg-transparent border border-border text-text-primary hover:bg-border/40"
            >
              Hủy
            </Button>
            <Button
              onClick={handleSubmit}
              fullWidth
              size="lg"
              isLoading={isSubmitting}
              disabled={
                !caption.trim() && totalImages === 0
              }
              className="bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)]"
            >
              Cập nhật
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

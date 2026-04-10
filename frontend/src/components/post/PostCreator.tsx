import { useState, useRef, useCallback } from 'react';
import { ImagePlus, X } from 'lucide-react';
import { toast } from 'sonner';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { useAppSelector, useAppDispatch } from '@/store';
import { closeModal } from '@/store/slices/uiSlice';
import { postService } from '@/services/postService';
import { cn } from '@/utils/cn';
import { ACCEPTED_IMAGE_TYPES, MAX_IMAGE_SIZE_MB } from '@/utils/constants';

const MAX_CAPTION = 2200;

export function PostCreator() {
  const dispatch = useAppDispatch();
  const isOpen = useAppSelector((s) => s.ui.activeModal === 'createPost');
  const user = useAppSelector((s) => s.auth.user);

  const [caption, setCaption] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleClose = useCallback(() => {
    dispatch(closeModal());
    setCaption('');
    setImageFile(null);
    setImagePreview(null);
  }, [dispatch]);

  const handleFileSelect = useCallback((file: File) => {
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      toast.error('Chỉ chấp nhận ảnh JPEG, PNG, WebP và GIF');
      return;
    }
    if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
      toast.error(`Ảnh phải nhỏ hơn ${MAX_IMAGE_SIZE_MB}MB`);
      return;
    }
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target?.result as string);
    reader.readAsDataURL(file);
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFileSelect(file);
    },
    [handleFileSelect],
  );

  const onFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFileSelect(file);
    },
    [handleFileSelect],
  );

  const removeImage = useCallback(() => {
    setImageFile(null);
    setImagePreview(null);
    if (fileRef.current) fileRef.current.value = '';
  }, []);

  const handleSubmit = async () => {
    if (!caption.trim() && !imageFile) return;
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      if (caption.trim()) formData.append('content', caption.trim());
      if (imageFile) formData.append('image', imageFile);

      await postService.create(formData);
      toast.success('Đã tạo bài viết!');
      handleClose();
      window.dispatchEvent(new CustomEvent('post-created'));
    } catch {
      toast.error('Tạo bài viết thất bại');
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
          <Avatar
            src={user?.avatarUrl}
            alt={user?.userName ?? ''}
            size="sm"
          />
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
            'mb-4 text-right text-xs',
            caption.length > MAX_CAPTION * 0.9
              ? 'text-error'
              : 'text-text-secondary',
          )}
        >
          {caption.length}/{MAX_CAPTION}
        </p>

        {/* Image upload / preview */}
        {imagePreview ? (
          <div className="relative mb-4 overflow-hidden rounded-lg">
            <img
              src={imagePreview}
              alt="Xem trước"
              className="max-h-80 w-full object-contain bg-black/5"
            />
            <button
              type="button"
              onClick={removeImage}
              className="absolute right-2 top-2 cursor-pointer rounded-full bg-black/60 p-1.5 text-white transition-colors hover:bg-black/80"
            >
              <X className="h-4 w-4" />
            </button>
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
              'mb-4 flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed py-10 transition-colors',
              isDragging
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50',
            )}
          >
            <ImagePlus className="mb-2 h-10 w-10 text-text-secondary" />
            <p className="text-sm font-medium text-text-secondary">
              Kéo ảnh vào đây hoặc{' '}
              <span className="text-primary">duyệt</span>
            </p>
            <p className="mt-1 text-xs text-text-secondary/60">
              JPEG, PNG, WebP, GIF tối đa {MAX_IMAGE_SIZE_MB}MB
            </p>
          </div>
        )}

        <input
          ref={fileRef}
          type="file"
          accept={ACCEPTED_IMAGE_TYPES.join(',')}
          onChange={onFileChange}
          className="hidden"
        />

        {/* Submit */}
        <Button
          onClick={handleSubmit}
          fullWidth
          size="lg"
          isLoading={isSubmitting}
          disabled={!caption.trim() && !imageFile}
        >
          Đăng
        </Button>
      </div>
    </Modal>
  );
}

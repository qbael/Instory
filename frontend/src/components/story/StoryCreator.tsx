import { useState, useRef, useCallback, useEffect } from 'react';
import { ImagePlus, Video, X, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useAppSelector, useAppDispatch } from '@/store';
import { closeModal } from '@/store/slices/uiSlice';
import { storyService } from '@/services/storyService';
import { highlightService } from '@/services/highlightService';
import { cn } from '@/utils/cn';
import {
  ACCEPTED_IMAGE_TYPES,
  ACCEPTED_VIDEO_TYPES,
  ACCEPTED_MEDIA_TYPES,
  MAX_IMAGE_SIZE_MB,
  MAX_VIDEO_SIZE_MB,
  MAX_VIDEO_DURATION_SECONDS,
} from '@/utils/constants';
import type { StoryHighlight } from '@/types';

function getVideoDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(video.src);
      resolve(video.duration);
    };
    video.onerror = reject;
    video.src = URL.createObjectURL(file);
  });
}

export function StoryCreator() {
  const dispatch = useAppDispatch();
  const isOpen = useAppSelector((s) => s.ui.activeModal === 'createStory');
  const currentUser = useAppSelector((s) => s.auth.user);

  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null);
  const [caption, setCaption] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [highlights, setHighlights] = useState<StoryHighlight[]>([]);
  const [selectedHighlightId, setSelectedHighlightId] = useState<number | null>(null);
  const [showNewHighlight, setShowNewHighlight] = useState(false);
  const [newHighlightTitle, setNewHighlightTitle] = useState('');
  const [isCreatingHighlight, setIsCreatingHighlight] = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && currentUser) {
      highlightService
        .getByUser(currentUser.id)
        .then(({ data }) => setHighlights(data))
        .catch(() => {});
    }
  }, [isOpen, currentUser]);

  const handleClose = useCallback(() => {
    dispatch(closeModal());
    setMediaFile(null);
    setMediaPreview(null);
    setMediaType(null);
    setCaption('');
    setSelectedHighlightId(null);
    setShowNewHighlight(false);
    setNewHighlightTitle('');
  }, [dispatch]);

  const handleFileSelect = useCallback(async (file: File) => {
    const isImage = ACCEPTED_IMAGE_TYPES.includes(file.type);
    const isVideo = ACCEPTED_VIDEO_TYPES.includes(file.type);

    if (!isImage && !isVideo) {
      toast.error('Chỉ chấp nhận ảnh (JPEG, PNG, WebP, GIF) hoặc video (MP4, MOV, WebM)');
      return;
    }

    if (isImage && file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
      toast.error(`Ảnh phải nhỏ hơn ${MAX_IMAGE_SIZE_MB}MB`);
      return;
    }

    if (isVideo) {
      if (file.size > MAX_VIDEO_SIZE_MB * 1024 * 1024) {
        toast.error(`Video phải nhỏ hơn ${MAX_VIDEO_SIZE_MB}MB`);
        return;
      }
      try {
        const duration = await getVideoDuration(file);
        if (duration > MAX_VIDEO_DURATION_SECONDS) {
          toast.error(`Video không được dài hơn ${MAX_VIDEO_DURATION_SECONDS} giây`);
          return;
        }
      } catch {
        toast.error('Không thể đọc thông tin video');
        return;
      }
    }

    setMediaFile(file);
    setMediaType(isVideo ? 'video' : 'image');
    setMediaPreview(URL.createObjectURL(file));
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

  const removeMedia = useCallback(() => {
    if (mediaPreview) URL.revokeObjectURL(mediaPreview);
    setMediaFile(null);
    setMediaPreview(null);
    setMediaType(null);
    if (fileRef.current) fileRef.current.value = '';
  }, [mediaPreview]);

  const handleCreateHighlight = async () => {
    if (!newHighlightTitle.trim()) return;
    setIsCreatingHighlight(true);
    try {
      const { data } = await highlightService.create(newHighlightTitle.trim());
      setHighlights((prev) => [...prev, data]);
      setSelectedHighlightId(data.id);
      setShowNewHighlight(false);
      setNewHighlightTitle('');
      toast.success('Đã tạo highlight!');
    } catch {
      toast.error('Tạo highlight thất bại');
    } finally {
      setIsCreatingHighlight(false);
    }
  };

  const handleSubmit = async () => {
    if (!mediaFile) return;
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('file', mediaFile);
      if (caption.trim()) formData.append('caption', caption.trim());
      if (selectedHighlightId) formData.append('highlightId', String(selectedHighlightId));

      await storyService.create(formData);
      toast.success('Đã đăng story!');
      window.dispatchEvent(new CustomEvent('story-created'));
      handleClose();
    } catch {
      toast.error('Đăng story thất bại');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Tạo story mới" size="md">
      <div className="p-5">
        {/* Media upload / preview */}
        {mediaPreview ? (
          <div className="relative mb-4 overflow-hidden rounded-lg bg-black/5">
            {mediaType === 'video' ? (
              <video
                src={mediaPreview}
                controls
                muted
                className="max-h-80 w-full object-contain"
              />
            ) : (
              <img
                src={mediaPreview}
                alt="Xem trước"
                className="max-h-80 w-full object-contain"
              />
            )}
            <button
              type="button"
              onClick={removeMedia}
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
              isDragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50',
            )}
          >
            <div className="mb-3 flex gap-3">
              <ImagePlus className="h-8 w-8 text-text-secondary" />
              <Video className="h-8 w-8 text-text-secondary" />
            </div>
            <p className="text-sm font-medium text-text-secondary">
              Kéo ảnh / video vào đây hoặc <span className="text-primary">duyệt</span>
            </p>
            <p className="mt-1 text-xs text-text-secondary/60">
              Ảnh ≤ {MAX_IMAGE_SIZE_MB}MB · Video ≤ {MAX_VIDEO_DURATION_SECONDS}s
            </p>
          </div>
        )}

        <input
          ref={fileRef}
          type="file"
          accept={ACCEPTED_MEDIA_TYPES.join(',')}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFileSelect(file);
          }}
          className="hidden"
        />

        {/* Caption */}
        <textarea
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="Thêm chú thích…"
          maxLength={255}
          rows={2}
          className="mb-4 w-full resize-none rounded-lg border border-border bg-bg px-3 py-2.5 text-sm text-text-primary placeholder:text-text-secondary/70 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        />

        {/* Highlight selector */}
        <div className="mb-4">
          <label className="mb-1.5 block text-xs font-medium text-text-secondary">
            Thêm vào highlight (tuỳ chọn)
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setSelectedHighlightId(null)}
              className={cn(
                'rounded-full border px-3 py-1 text-xs transition-colors',
                selectedHighlightId === null
                  ? 'border-primary bg-primary text-white'
                  : 'border-border text-text-secondary hover:border-primary/50',
              )}
            >
              Không
            </button>
            {highlights.map((h) => (
              <button
                key={h.id}
                type="button"
                onClick={() => setSelectedHighlightId(h.id)}
                className={cn(
                  'rounded-full border px-3 py-1 text-xs transition-colors',
                  selectedHighlightId === h.id
                    ? 'border-primary bg-primary text-white'
                    : 'border-border text-text-secondary hover:border-primary/50',
                )}
              >
                {h.title}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setShowNewHighlight((v) => !v)}
              className="flex items-center gap-1 rounded-full border border-dashed border-border px-3 py-1 text-xs text-text-secondary hover:border-primary/50"
            >
              <Plus className="h-3 w-3" />
              Tạo mới
            </button>
          </div>

          {showNewHighlight && (
            <div className="mt-2 flex gap-2">
              <input
                type="text"
                value={newHighlightTitle}
                onChange={(e) => setNewHighlightTitle(e.target.value)}
                placeholder="Tên highlight…"
                maxLength={100}
                className="flex-1 rounded-lg border border-border bg-bg px-3 py-1.5 text-sm text-text-primary placeholder:text-text-secondary/70 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                onKeyDown={(e) => e.key === 'Enter' && handleCreateHighlight()}
              />
              <Button
                size="sm"
                onClick={handleCreateHighlight}
                isLoading={isCreatingHighlight}
                disabled={!newHighlightTitle.trim()}
              >
                Tạo
              </Button>
            </div>
          )}
        </div>

        <Button
          onClick={handleSubmit}
          fullWidth
          size="lg"
          isLoading={isSubmitting}
          disabled={!mediaFile}
        >
          Đăng story
        </Button>
      </div>
    </Modal>
  );
}

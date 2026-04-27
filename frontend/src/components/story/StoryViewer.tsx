import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronLeft, ChevronRight, MoreHorizontal, Pause, Play, Trash2, Plus, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { Avatar } from '@/components/ui/Avatar';
import { timeAgo } from '@/utils/formatDate';
import { storyService } from '@/services/storyService';
import { highlightService } from '@/services/highlightService';
import { useAppSelector } from '@/store';
import { cn } from '@/utils/cn';
import type { StoryGroup, StoryHighlight } from '@/types';

const IMAGE_STORY_DURATION = 5000;
const TICK_INTERVAL = 50;

interface StoryViewerProps {
  groups: StoryGroup[];
  initialGroupIndex: number;
  onClose: () => void;
  onDeleted?: (storyId: number) => void;
  onViewed?: (groupIdx: number, storyIdx: number) => void;
}

export function StoryViewer({
  groups,
  initialGroupIndex,
  onClose,
  onDeleted,
  onViewed,
}: StoryViewerProps) {
  const currentUser = useAppSelector((s) => s.auth.user);
  const [groupIdx, setGroupIdx] = useState(initialGroupIndex);
  const [storyIdx, setStoryIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [highlightPickerOpen, setHighlightPickerOpen] = useState(false);
  const [highlights, setHighlights] = useState<StoryHighlight[]>([]);
  const [addingToHighlightId, setAddingToHighlightId] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const group = groups[groupIdx];
  const story = group?.stories[storyIdx];
  const isVideo = story?.mediaType === 'Video';
  const paused = isPaused || confirmDelete || menuOpen || highlightPickerOpen;

  const stopTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  const goNext = useCallback(() => {
    stopTimer();
    if (videoRef.current) {
      videoRef.current.pause();
    }
    if (storyIdx < group.stories.length - 1) {
      setStoryIdx((i) => i + 1);
      setProgress(0);
    } else if (groupIdx < groups.length - 1) {
      setGroupIdx((i) => i + 1);
      setStoryIdx(0);
      setProgress(0);
    } else {
      onClose();
    }
  }, [storyIdx, groupIdx, group?.stories.length, groups.length, onClose, stopTimer]);

  const goPrev = useCallback(() => {
    stopTimer();
    if (videoRef.current) {
      videoRef.current.pause();
    }
    if (storyIdx > 0) {
      setStoryIdx((i) => i - 1);
      setProgress(0);
    } else if (groupIdx > 0) {
      setGroupIdx((i) => i - 1);
      setStoryIdx(groups[groupIdx - 1].stories.length - 1);
      setProgress(0);
    }
  }, [storyIdx, groupIdx, groups, stopTimer]);

  useEffect(() => {
    if (!story) return;
    if (!story.isViewed) {
      storyService.markViewed(story.id).catch(() => {});
      onViewed?.(groupIdx, storyIdx);
    }
  }, [story]); // eslint-disable-line react-hooks/exhaustive-deps

  // Reset progress whenever the current story changes
  useEffect(() => {
    setProgress(0);
  }, [groupIdx, storyIdx]);

  // Timer for image stories; video stories use onTimeUpdate instead
  useEffect(() => {
    if (isVideo || paused) {
      stopTimer();
      return;
    }
    timerRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          goNext();
          return 100;
        }
        return prev + (TICK_INTERVAL / IMAGE_STORY_DURATION) * 100;
      });
    }, TICK_INTERVAL);
    return stopTimer;
  }, [groupIdx, storyIdx, isVideo, paused, goNext, stopTimer]);

  // Pause/resume video when paused state changes
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !isVideo) return;
    if (paused) video.pause();
    else video.play().catch(() => {});
  }, [paused, isVideo]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') goNext();
      else if (e.key === 'ArrowLeft') goPrev();
      else if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [goNext, goPrev, onClose]);

  const handleVideoTimeUpdate = useCallback(() => {
    const video = videoRef.current;
    if (!video || !video.duration) return;
    setProgress((video.currentTime / video.duration) * 100);
  }, []);

  const handleVideoEnded = useCallback(() => {
    goNext();
  }, [goNext]);

  const isOwnStory = story?.userId === currentUser?.id;

  const handleAddToHighlight = async (highlightId: number) => {
    if (!story) return;
    setAddingToHighlightId(highlightId);
    try {
      await highlightService.addStory(highlightId, story.id);
      toast.success('Đã thêm vào tin nổi bật');
      window.dispatchEvent(new CustomEvent('highlight-updated'));
      setHighlightPickerOpen(false);
    } catch {
      toast.error('Thêm thất bại');
    } finally {
      setAddingToHighlightId(null);
    }
  };

  const handleDelete = async () => {
    if (!story) return;
    setIsDeleting(true);
    try {
      await storyService.delete(story.id);
      toast.success('Đã xóa story');
      setConfirmDelete(false);
      const wasLastInGroup = storyIdx === group.stories.length - 1;
      const groupHadOneStory = group.stories.length === 1;
      onDeleted?.(story.id);
      window.dispatchEvent(new CustomEvent('story-deleted'));
      if (wasLastInGroup) {
        // Group will either be emptied & removed (idx stays, next group slides in)
        // or we were past it already — advance to next group.
        if (!groupHadOneStory) setGroupIdx((i) => i + 1);
        setStoryIdx(0);
        setProgress(0);
      }
      // Otherwise: after parent removes this story, storyIdx naturally points to
      // what was the next story in the same group.
    } catch {
      toast.error('Xóa thất bại');
    } finally {
      setIsDeleting(false);
    }
  };

  // After a deletion, the viewer can end up pointing past the last group — close it.
  useEffect(() => {
    if (groups.length === 0) {
      onClose();
      return;
    }
    if (groupIdx >= groups.length) {
      onClose();
    }
  }, [groups, groupIdx, onClose]);

  if (!group || !story) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95">
      {/* Pause + delete + close buttons */}
      <div className="absolute right-4 top-4 z-10 flex items-center gap-3">
        <button
          type="button"
          onClick={() => setIsPaused((p) => !p)}
          aria-label={isPaused ? 'Tiếp tục' : 'Tạm dừng'}
          className="cursor-pointer text-white/80 hover:text-white"
        >
          {isPaused ? <Play className="h-5 w-5" /> : <Pause className="h-5 w-5" />}
        </button>
        {isOwnStory && (
          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="Tùy chọn"
              className="cursor-pointer text-white/80 hover:text-white"
            >
              <MoreHorizontal className="h-5 w-5" />
            </button>
            {menuOpen && (
              <>
                <div
                  className="fixed inset-0 z-20"
                  onClick={() => setMenuOpen(false)}
                  aria-hidden
                />
                <div className="absolute right-0 top-8 z-30 w-52 overflow-hidden rounded-lg bg-bg-card shadow-xl">
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      setHighlightPickerOpen(true);
                      highlightService
                        .getByUser(currentUser!.id)
                        .then(({ data }) => setHighlights(data))
                        .catch(() => setHighlights([]));
                    }}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-text-primary hover:bg-border/40"
                  >
                    <Plus className="h-4 w-4" />
                    Thêm vào tin nổi bật
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      setConfirmDelete(true);
                    }}
                    className="flex w-full items-center gap-3 border-t border-border px-4 py-2.5 text-left text-sm text-red-500 hover:bg-border/40"
                  >
                    <Trash2 className="h-4 w-4" />
                    Xóa
                  </button>
                </div>
              </>
            )}
          </div>
        )}
        <button
          type="button"
          onClick={onClose}
          className="cursor-pointer text-white/80 hover:text-white"
        >
          <X className="h-7 w-7" />
        </button>
      </div>

      {/* Nav arrows */}
      {(groupIdx > 0 || storyIdx > 0) && (
        <button
          type="button"
          onClick={goPrev}
          className="absolute left-4 z-10 cursor-pointer rounded-full bg-white/20 p-2 text-white backdrop-blur-sm hover:bg-white/30"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
      )}
      {(groupIdx < groups.length - 1 || storyIdx < group.stories.length - 1) && (
        <button
          type="button"
          onClick={goNext}
          className="absolute right-4 z-10 cursor-pointer rounded-full bg-white/20 p-2 text-white backdrop-blur-sm hover:bg-white/30"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      )}

      {/* Story card */}
      <div className="relative flex h-[calc(100vh-2rem)] max-h-[800px] w-full max-w-[440px] flex-col overflow-hidden rounded-xl bg-black">
        {/* Progress bars */}
        <div className="absolute left-0 right-0 top-0 z-10 flex gap-1 px-2 pt-2">
          {group.stories.map((_, i) => (
            <div
              key={i}
              className="h-[3px] flex-1 overflow-hidden rounded-full bg-white/30"
            >
              <div
                className={cn('h-full rounded-full bg-white transition-[width] duration-75')}
                style={{
                  width: i < storyIdx ? '100%' : i === storyIdx ? `${progress}%` : '0%',
                }}
              />
            </div>
          ))}
        </div>

        {/* User info */}
        <div className="absolute left-0 right-0 top-4 z-10 flex items-center gap-2.5 px-3 pt-2">
          <Avatar
            src={group.user.avatarUrl}
            alt={group.user.userName}
            size="sm"
            className="ring-2 ring-white/50"
          />
          <span className="text-sm font-semibold text-white">{group.user.userName}</span>
          <span className="text-xs text-white/60">{timeAgo(story.createdAt)}</span>
        </div>

        {/* Story media */}
        {story.mediaUrl ? (
          isVideo ? (
            <video
              key={story.id}
              ref={videoRef}
              src={story.mediaUrl}
              autoPlay
              muted
              playsInline
              className="h-full w-full object-contain"
              onTimeUpdate={handleVideoTimeUpdate}
              onEnded={handleVideoEnded}
            />
          ) : (
            <img
              key={story.id}
              src={story.mediaUrl}
              alt={story.caption ?? ''}
              className="h-full w-full object-contain"
            />
          )
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary to-accent p-8">
            <p className="text-center text-lg font-medium text-white">{story.caption}</p>
          </div>
        )}

        {/* Caption + view count overlay */}
        {story.mediaUrl && (story.caption || isOwnStory) && (
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-4 pb-4 pt-10">
            {story.caption && (
              <p className="mb-1.5 text-sm text-white">{story.caption}</p>
            )}
            {isOwnStory && (
              <div className="flex items-center gap-1.5 text-white/70">
                <Eye className="h-3.5 w-3.5" />
                <span className="text-xs">{story.viewsCount} lượt xem</span>
              </div>
            )}
          </div>
        )}

        {/* Tap zones */}
        {!confirmDelete && !highlightPickerOpen && !menuOpen && (
          <div className="absolute inset-0 flex">
            <div className="w-1/3 cursor-pointer" onClick={goPrev} />
            <div className="flex-1" />
            <div className="w-1/3 cursor-pointer" onClick={goNext} />
          </div>
        )}

        {/* Highlight picker overlay */}
        {highlightPickerOpen && (
          <div className="absolute inset-0 z-20 flex flex-col bg-black/80">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <span className="text-sm font-semibold text-white">Chọn tin nổi bật</span>
              <button
                type="button"
                onClick={() => setHighlightPickerOpen(false)}
                className="cursor-pointer text-white/80 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-2 py-2">
              {highlights.length === 0 ? (
                <div className="py-10 text-center text-sm text-white/60">
                  Chưa có tin nổi bật nào. Hãy tạo từ trang cá nhân.
                </div>
              ) : (
                highlights.map((h) => (
                  <button
                    key={h.id}
                    type="button"
                    disabled={addingToHighlightId !== null}
                    onClick={() => handleAddToHighlight(h.id)}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left hover:bg-white/10 disabled:opacity-50"
                  >
                    <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full bg-white/10">
                      {h.coverUrl && (
                        <img src={h.coverUrl} alt="" className="h-full w-full object-cover" />
                      )}
                    </div>
                    <span className="flex-1 truncate text-sm text-white">{h.title}</span>
                    {addingToHighlightId === h.id && (
                      <span className="text-xs text-white/60">Đang thêm…</span>
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        )}

        {/* Delete confirm overlay */}
        {confirmDelete && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-end bg-black/60 pb-10">
            <p className="mb-5 text-base font-semibold text-white">Xóa story này?</p>
            <div className="flex w-full flex-col gap-2 px-6">
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="w-full rounded-xl bg-red-500 py-3 text-sm font-semibold text-white disabled:opacity-60"
              >
                {isDeleting ? 'Đang xóa…' : 'Xóa'}
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="w-full rounded-xl bg-white/20 py-3 text-sm font-semibold text-white backdrop-blur-sm"
              >
                Hủy
              </button>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}

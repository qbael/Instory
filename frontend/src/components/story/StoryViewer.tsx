import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { timeAgo } from '@/utils/formatDate';
import { storyService } from '@/services/storyService';
import { cn } from '@/utils/cn';
import type { StoryGroup } from '@/types';

const STORY_DURATION = 5000;
const TICK_INTERVAL = 50;

interface StoryViewerProps {
  groups: StoryGroup[];
  initialGroupIndex: number;
  onClose: () => void;
}

export function StoryViewer({
  groups,
  initialGroupIndex,
  onClose,
}: StoryViewerProps) {
  const [groupIdx, setGroupIdx] = useState(initialGroupIndex);
  const [storyIdx, setStoryIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const group = groups[groupIdx];
  const story = group?.stories[storyIdx];

  const stopTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  const goNext = useCallback(() => {
    stopTimer();
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
    }
  }, [story]);

  useEffect(() => {
    setProgress(0);
    timerRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          goNext();
          return 100;
        }
        return prev + (TICK_INTERVAL / STORY_DURATION) * 100;
      });
    }, TICK_INTERVAL);
    return stopTimer;
  }, [groupIdx, storyIdx, goNext, stopTimer]);

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

  if (!group || !story) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95">
      {/* Close button */}
      <button
        type="button"
        onClick={onClose}
        className="absolute right-4 top-4 z-10 cursor-pointer text-white/80 hover:text-white"
      >
        <X className="h-7 w-7" />
      </button>

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
      {(groupIdx < groups.length - 1 ||
        storyIdx < group.stories.length - 1) && (
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
                className={cn(
                  'h-full rounded-full bg-white transition-[width] duration-75',
                )}
                style={{
                  width:
                    i < storyIdx
                      ? '100%'
                      : i === storyIdx
                        ? `${progress}%`
                        : '0%',
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
          <span className="text-sm font-semibold text-white">
            {group.user.userName}
          </span>
          <span className="text-xs text-white/60">
            {timeAgo(story.createdAt)}
          </span>
        </div>

        {/* Story media */}
        {story.mediaUrl ? (
          <img
            src={story.mediaUrl}
            alt={story.caption ?? ''}
            className="h-full w-full object-contain"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary to-accent p-8">
            <p className="text-center text-lg font-medium text-white">
              {story.caption}
            </p>
          </div>
        )}

        {/* Caption overlay */}
        {story.mediaUrl && story.caption && (
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-4 pb-6 pt-10">
            <p className="text-sm text-white">{story.caption}</p>
          </div>
        )}

        {/* Tap zones */}
        <div className="absolute inset-0 flex">
          <div className="w-1/3 cursor-pointer" onClick={goPrev} />
          <div className="flex-1" />
          <div className="w-1/3 cursor-pointer" onClick={goNext} />
        </div>
      </div>
    </div>,
    document.body,
  );
}

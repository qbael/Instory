import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronLeft, Check, Play } from 'lucide-react';
import { toast } from 'sonner';
import { useAppSelector, useAppDispatch } from '@/store';
import { closeModal } from '@/store/slices/uiSlice';
import { storyService } from '@/services/storyService';
import { highlightService } from '@/services/highlightService';
import { cn } from '@/utils/cn';
import type { Story } from '@/types';

type Step = 'name' | 'pick' | 'cover';

function formatStoryDate(dateString: string): string {
  const d = new Date(dateString);
  return `${d.getDate()} Tháng ${d.getMonth() + 1}${d.getFullYear() !== new Date().getFullYear() ? `\n${d.getFullYear()}` : ''}`;
}

export function CreateHighlightModal() {
  const dispatch = useAppDispatch();
  const isOpen = useAppSelector((s) => s.ui.activeModal === 'createHighlight');
  const currentUser = useAppSelector((s) => s.auth.user);

  const [step, setStep] = useState<Step>('name');
  const [title, setTitle] = useState('');
  const [allStories, setAllStories] = useState<Story[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [coverStoryId, setCoverStoryId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen || !currentUser) return;
    setIsLoading(true);
    Promise.all([
      storyService.getByUser(currentUser.id).then((r) => r.data?.stories ?? []).catch(() => []),
      storyService.getArchive(1, 50).then((r) => r.data.data ?? []).catch(() => []),
    ]).then(([active, archived]) => {
      const seen = new Set<number>();
      const merged: Story[] = [];
      for (const s of [...active, ...archived]) {
        if (!seen.has(s.id)) { seen.add(s.id); merged.push(s); }
      }
      setAllStories(merged);
    }).finally(() => setIsLoading(false));
  }, [isOpen, currentUser]);

  useEffect(() => {
    if (isOpen && step === 'name') {
      setTimeout(() => titleInputRef.current?.focus(), 50);
    }
  }, [isOpen, step]);

  const reset = useCallback(() => {
    setStep('name');
    setTitle('');
    setSelected([]);
    setCoverStoryId(null);
  }, []);

  const handleClose = useCallback(() => {
    dispatch(closeModal());
    reset();
  }, [dispatch, reset]);

  const toggleSelect = (id: number) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const goToPick = () => {
    if (title.trim()) setStep('pick');
  };

  const goToCover = () => {
    if (selected.length === 0) return;
    setCoverStoryId(selected[0]);
    setStep('cover');
  };

  const handleSubmit = async () => {
    if (!title.trim() || selected.length === 0) return;
    setIsSubmitting(true);
    try {
      const coverStory = allStories.find((s) => s.id === coverStoryId);
      const coverUrl = coverStory?.mediaUrl ?? undefined;
      const { data: highlight } = await highlightService.create(title.trim(), undefined, coverUrl);
      await Promise.all(selected.map((storyId) => highlightService.addStory(highlight.id, storyId)));
      toast.success('Đã tạo tin nổi bật!');
      window.dispatchEvent(new CustomEvent('highlight-created'));
      handleClose();
    } catch {
      toast.error('Tạo tin nổi bật thất bại');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedStories = allStories.filter((s) => selected.includes(s.id));
  const coverStory = allStories.find((s) => s.id === coverStoryId);

  if (!isOpen) return null;

  const headerConfig = {
    name:  { back: null,                            title: 'Tin nổi bật mới' },
    pick:  { back: () => setStep('name'),            title: 'Tin'             },
    cover: { back: () => setStep('pick'),            title: 'Chọn ảnh bìa'   },
  }[step];

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
        aria-hidden
      />

      {/* sheet */}
      <div
        role="dialog"
        aria-modal
        className="relative z-10 flex w-full max-w-sm flex-col overflow-hidden rounded-2xl bg-bg-card shadow-2xl"
        style={{ maxHeight: '85vh' }}
      >
        {/* ── Header ── */}
        <div className="relative flex items-center justify-center border-b border-border py-3">
          {headerConfig.back && (
            <button
              type="button"
              onClick={headerConfig.back}
              className="absolute left-3 cursor-pointer rounded-full p-1.5 hover:bg-border/40"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          )}
          <span className="text-sm font-semibold">{headerConfig.title}</span>
          <button
            type="button"
            onClick={handleClose}
            className="absolute right-3 cursor-pointer rounded-full p-1.5 hover:bg-border/40"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* ── Step 1: Name ── */}
        {step === 'name' && (
          <div className="flex flex-col">
            <div className="px-4 py-5">
              <input
                ref={titleInputRef}
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && goToPick()}
                placeholder="Tên tin nổi bật…"
                maxLength={100}
                className="w-full border-b border-border bg-transparent py-2 text-sm text-text-primary placeholder:text-text-secondary/60 focus:border-primary focus:outline-none"
              />
            </div>
            <div className="flex justify-end border-t border-border px-4 py-3">
              <button
                type="button"
                onClick={goToPick}
                disabled={!title.trim()}
                className={cn(
                  'text-sm font-semibold transition-colors',
                  title.trim() ? 'text-primary' : 'text-text-secondary/40',
                )}
              >
                Tiếp
              </button>
            </div>
          </div>
        )}

        {/* ── Step 2: Pick stories ── */}
        {step === 'pick' && (
          <div className="flex min-h-0 flex-1 flex-col">
            {isLoading ? (
              <div className="flex flex-1 items-center justify-center py-20 text-sm text-text-secondary">
                Đang tải…
              </div>
            ) : allStories.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center py-20">
                <p className="font-medium text-text-primary">Chưa có story nào</p>
                <p className="mt-1 text-xs text-text-secondary">Hãy tạo story trước.</p>
              </div>
            ) : (
              <div
                className="grid grid-cols-3 gap-0.5 overflow-y-auto"
                style={{ maxHeight: '55vh' }}
              >
                {allStories.map((story) => {
                  const isSelected = selected.includes(story.id);
                  return (
                    <button
                      key={story.id}
                      type="button"
                      onClick={() => toggleSelect(story.id)}
                      className="group relative aspect-[9/16] overflow-hidden bg-black focus:outline-none"
                    >
                      {story.mediaType === 'Video' ? (
                        <>
                          <video
                            src={story.mediaUrl ?? ''}
                            className="h-full w-full object-cover"
                            muted
                            preload="metadata"
                          />
                          <Play className="absolute bottom-2 left-2 h-3 w-3 fill-white text-white drop-shadow" />
                        </>
                      ) : (
                        <img
                          src={story.mediaUrl ?? ''}
                          alt=""
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      )}

                      {/* date label */}
                      <div className="absolute left-1.5 top-1.5 whitespace-pre-line text-left text-[9px] font-bold leading-tight text-white drop-shadow">
                        {formatStoryDate(story.createdAt)}
                      </div>

                      {/* overlay */}
                      <div className={cn('absolute inset-0 transition-colors', isSelected && 'bg-black/20')} />

                      {/* selector circle */}
                      <div
                        className={cn(
                          'absolute bottom-2 right-2 flex h-5 w-5 items-center justify-center rounded-full border-2 transition-all',
                          isSelected
                            ? 'border-primary bg-primary'
                            : 'border-white bg-transparent',
                        )}
                      >
                        {isSelected && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            <div className="border-t border-border p-3">
              <button
                type="button"
                onClick={goToCover}
                disabled={selected.length === 0}
                className={cn(
                  'w-full rounded-lg py-2.5 text-sm font-semibold transition-colors',
                  selected.length > 0
                    ? 'bg-primary text-white hover:bg-primary/90'
                    : 'bg-border/40 text-text-secondary/40',
                )}
              >
                Tiếp
              </button>
            </div>
          </div>
        )}

        {/* ── Step 3: Cover ── */}
        {step === 'cover' && (
          <div className="flex flex-col">
            {/* big circular preview */}
            <div className="flex justify-center px-6 py-6">
              <div className="h-52 w-52 overflow-hidden rounded-full border-2 border-border bg-border">
                {coverStory?.mediaUrl && coverStory.mediaType === 'Image' && (
                  <img
                    src={coverStory.mediaUrl}
                    alt="cover"
                    className="h-full w-full object-cover"
                  />
                )}
                {coverStory?.mediaUrl && coverStory.mediaType === 'Video' && (
                  <video
                    src={coverStory.mediaUrl}
                    className="h-full w-full object-cover"
                    muted
                    preload="metadata"
                  />
                )}
              </div>
            </div>

            {/* thumbnail strip */}
            <div className="flex gap-1.5 overflow-x-auto px-4 pb-4 scrollbar-none">
              {selectedStories.map((story) => (
                <button
                  key={story.id}
                  type="button"
                  onClick={() => setCoverStoryId(story.id)}
                  className={cn(
                    'relative h-16 w-10 shrink-0 overflow-hidden rounded-md border-2 transition-colors',
                    coverStoryId === story.id ? 'border-primary' : 'border-transparent',
                  )}
                >
                  {story.mediaType === 'Video' ? (
                    <video src={story.mediaUrl ?? ''} className="h-full w-full object-cover" muted preload="metadata" />
                  ) : (
                    <img src={story.mediaUrl ?? ''} alt="" className="h-full w-full object-cover" />
                  )}
                  {coverStoryId === story.id && (
                    <div className="absolute inset-0 flex items-center justify-center bg-primary/25">
                      <Check className="h-3 w-3 text-white drop-shadow" />
                    </div>
                  )}
                </button>
              ))}
            </div>

            <div className="border-t border-border p-3">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary/90 disabled:opacity-60"
              >
                {isSubmitting ? 'Đang tạo…' : 'Xong'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}

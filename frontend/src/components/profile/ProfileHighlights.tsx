import { memo, useState, useCallback } from 'react';
import { Plus, X } from 'lucide-react';
import { toast } from 'sonner';
import { Avatar } from '@/components/ui/Avatar';
import { AlertDialog } from '@/components/ui/AlertDialog';
import { StoryViewer } from '@/components/story/StoryViewer';
import { useAppDispatch } from '@/store';
import { openModal } from '@/store/slices/uiSlice';
import { highlightService } from '@/services/highlightService';
import type { StoryHighlight, StoryGroup } from '@/types';

interface ProfileHighlightsProps {
  highlights: StoryHighlight[];
  isOwn: boolean;
}

function HighlightCircle({
  highlight,
  isOwn,
  onClick,
  onDeleteClick,
}: {
  highlight: StoryHighlight;
  isOwn: boolean;
  onClick: () => void;
  onDeleteClick: () => void;
}) {
  return (
    <div className="group relative flex w-[77px] shrink-0 flex-col items-center gap-1.5">
      <button
        type="button"
        onClick={onClick}
        className="cursor-pointer"
      >
        <div className="rounded-full bg-border p-[2px]">
          <div className="rounded-full bg-bg-card p-[2px]">
            <Avatar
              src={highlight.coverUrl}
              alt={highlight.title}
              size="lg"
              className="!h-[64px] !w-[64px]"
            />
          </div>
        </div>
      </button>

      {isOwn && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDeleteClick();
          }}
          className="absolute -right-1 -top-1 hidden h-5 w-5 cursor-pointer items-center justify-center rounded-full bg-text-primary text-bg-card ring-2 ring-bg-card group-hover:flex"
        >
          <X className="h-3 w-3" strokeWidth={2.5} />
        </button>
      )}

      <span className="w-full truncate text-center text-xs font-semibold">
        {highlight.title}
      </span>
    </div>
  );
}

function NewHighlightButton() {
  const dispatch = useAppDispatch();
  return (
    <button
      type="button"
      onClick={() => dispatch(openModal({ modal: 'createHighlight' }))}
      className="flex w-[77px] shrink-0 cursor-pointer flex-col items-center gap-1.5"
    >
      <div className="flex h-[72px] w-[72px] items-center justify-center rounded-full border-[1.5px] border-border">
        <Plus className="h-8 w-8 text-text-secondary" strokeWidth={1} />
      </div>
      <span className="w-full truncate text-center text-xs font-semibold">
        Mới
      </span>
    </button>
  );
}

export const ProfileHighlights = memo(function ProfileHighlights({
  highlights,
  isOwn,
}: ProfileHighlightsProps) {
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerGroupIdx, setViewerGroupIdx] = useState(0);
  const [deleteTarget, setDeleteTarget] = useState<StoryHighlight | null>(null);

  const storyGroups: StoryGroup[] = highlights
    .filter((h) => h.stories.length > 0)
    .map((h) => ({
      user: h.stories[0].user,
      stories: h.stories,
      hasUnviewed: false,
    }));

  const openViewer = useCallback((index: number) => {
    setViewerGroupIdx(index);
    setViewerOpen(true);
  }, []);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await highlightService.delete(deleteTarget.id);
      toast.success('Đã xóa tin nổi bật');
      window.dispatchEvent(new CustomEvent('highlight-created'));
    } catch {
      toast.error('Xóa thất bại');
    } finally {
      setDeleteTarget(null);
    }
  };

  if (!isOwn && highlights.length === 0) return null;

  return (
    <>
      <div className="flex gap-4 overflow-x-auto px-4 py-4 scrollbar-none md:px-0">
        {highlights.map((h, i) => (
          <HighlightCircle
            key={h.id}
            highlight={h}
            isOwn={isOwn}
            onClick={() => openViewer(i)}
            onDeleteClick={() => setDeleteTarget(h)}
          />
        ))}
        {isOwn && <NewHighlightButton />}
      </div>

      {viewerOpen && storyGroups.length > 0 && (
        <StoryViewer
          groups={storyGroups}
          initialGroupIndex={viewerGroupIdx}
          onClose={() => setViewerOpen(false)}
        />
      )}

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        title={`Xóa "${deleteTarget?.title}"?`}
        description="Tin nổi bật sẽ bị xóa vĩnh viễn. Các story bên trong không bị ảnh hưởng."
        confirmLabel="Xóa"
        cancelLabel="Hủy"
        variant="danger"
        onConfirm={handleDelete}
      />
    </>
  );
});

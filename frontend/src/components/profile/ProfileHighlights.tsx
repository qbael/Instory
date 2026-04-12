import { memo, useState, useCallback } from 'react';
import { Plus } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { StoryViewer } from '@/components/story/StoryViewer';
import type { StoryHighlight, StoryGroup } from '@/types';

interface ProfileHighlightsProps {
  highlights: StoryHighlight[];
  isOwn: boolean;
}

function HighlightCircle({
  highlight,
  onClick,
}: {
  highlight: StoryHighlight;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-[77px] shrink-0 cursor-pointer flex-col items-center gap-1.5"
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
      <span className="w-full truncate text-center text-xs font-semibold">
        {highlight.title}
      </span>
    </button>
  );
}

function NewHighlightButton() {
  return (
    <button
      type="button"
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

  if (!isOwn && highlights.length === 0) return null;

  return (
    <>
      <div className="flex gap-4 overflow-x-auto px-4 py-4 scrollbar-none md:px-0">
        {highlights.map((h, i) => (
          <HighlightCircle
            key={h.id}
            highlight={h}
            onClick={() => openViewer(i)}
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
    </>
  );
});

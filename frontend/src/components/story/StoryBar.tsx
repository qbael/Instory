import { useState, useEffect, useCallback } from 'react';
import { StoryCircle } from './StoryCircle';
import { StoryViewer } from './StoryViewer';
import { storyService } from '@/services/storyService';
import { useAppSelector } from '@/store';
import type { StoryGroup } from '@/types';

export function StoryBar() {
  const currentUser = useAppSelector((s) => s.auth.user);
  const [groups, setGroups] = useState<StoryGroup[]>([]);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerStartIdx, setViewerStartIdx] = useState(0);

  useEffect(() => {
    storyService
      .getFeed()
      .then(({ data }) => setGroups(data.data))
      .catch(() => {});
  }, []);

  const openViewer = useCallback((index: number) => {
    setViewerStartIdx(index);
    setViewerOpen(true);
  }, []);

  const ownGroup: StoryGroup | undefined = groups.find(
    (g) => g.user.id === currentUser?.id,
  );
  const otherGroups = groups.filter((g) => g.user.id !== currentUser?.id);

  return (
    <>
      <div className="mb-4 overflow-hidden rounded-lg border border-border bg-bg-card">
        <div className="flex gap-2 overflow-x-auto px-4 py-3 scrollbar-none">
          {/* Your story */}
          <StoryCircle
            src={currentUser?.avatarUrl}
            name={currentUser?.userName ?? 'You'}
            hasUnviewed={false}
            isOwn
            onClick={() => {
              if (ownGroup) {
                const idx = groups.indexOf(ownGroup);
                openViewer(idx);
              }
            }}
          />

          {/* Friends' stories */}
          {otherGroups.map((g) => {
            const globalIdx = groups.indexOf(g);
            return (
              <StoryCircle
                key={g.user.id}
                src={g.user.avatarUrl}
                name={g.user.userName}
                hasUnviewed={g.hasUnviewed}
                onClick={() => openViewer(globalIdx)}
              />
            );
          })}
        </div>
      </div>

      {/* Viewer */}
      {viewerOpen && groups.length > 0 && (
        <StoryViewer
          groups={groups}
          initialGroupIndex={viewerStartIdx}
          onClose={() => setViewerOpen(false)}
        />
      )}
    </>
  );
}

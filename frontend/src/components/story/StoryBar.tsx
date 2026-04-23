import { useState, useEffect, useCallback } from 'react';
import { StoryCircle } from './StoryCircle';
import { StoryViewer } from './StoryViewer';
import { storyService } from '@/services/storyService';
import { useAppSelector, useAppDispatch } from '@/store';
import { openModal } from '@/store/slices/uiSlice';
import type { StoryGroup } from '@/types';

export function StoryBar() {
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector((s) => s.auth.user);
  const [groups, setGroups] = useState<StoryGroup[]>([]);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerStartIdx, setViewerStartIdx] = useState(0);

  const loadFeed = useCallback(() => {
    storyService
      .getFeed()
      .then(({ data }) => setGroups(data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    loadFeed();
  }, [loadFeed]);

  useEffect(() => {
    window.addEventListener('story-created', loadFeed);
    return () => window.removeEventListener('story-created', loadFeed);
  }, [loadFeed]);

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
          {/* Your story — clicking always opens the creator */}
          <StoryCircle
            src={currentUser?.avatarUrl}
            name={currentUser?.userName ?? 'Bạn'}
            hasUnviewed={false}
            isOwn
            onClick={() => dispatch(openModal({ modal: 'createStory' }))}
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

          {/* Own stories (view) */}
          {ownGroup && (
            <StoryCircle
              src={currentUser?.avatarUrl}
              name="Xem story"
              hasUnviewed={ownGroup.hasUnviewed}
              onClick={() => openViewer(groups.indexOf(ownGroup))}
            />
          )}
        </div>
      </div>

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

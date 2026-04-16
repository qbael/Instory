import { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Video } from 'lucide-react';
import { useNavigate } from 'react-router';
import { storyService } from '@/services/storyService';
import { StoryViewer } from '@/components/story/StoryViewer';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import { Spinner } from '@/components/ui/Spinner';
import { useAppSelector } from '@/store';
import type { Story, StoryGroup } from '@/types';

function groupByMonth(stories: Story[]): { label: string; stories: Story[] }[] {
  const map = new Map<string, Story[]>();
  for (const s of stories) {
    const label = new Date(s.expiresAt).toLocaleDateString('vi-VN', {
      month: 'long',
      year: 'numeric',
    });
    if (!map.has(label)) map.set(label, []);
    map.get(label)!.push(s);
  }
  return Array.from(map.entries()).map(([label, stories]) => ({ label, stories }));
}

export default function StoryArchivePage() {
  const navigate = useNavigate();
  const currentUser = useAppSelector((s) => s.auth.user);

  const [stories, setStories] = useState<Story[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [viewerGroup, setViewerGroup] = useState<StoryGroup | null>(null);

  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore) return;
    setIsLoading(true);
    try {
      const { data } = await storyService.getArchive(page, 20);
      setStories((prev) => [...prev, ...data.data]);
      setHasMore(data.hasNextPage);
      setPage((p) => p + 1);
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  }, [page, isLoading, hasMore]);

  useEffect(() => {
    loadMore();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { sentinelRef } = useInfiniteScroll({ hasMore, isLoading, onLoadMore: loadMore });

  const openViewer = (story: Story) => {
    if (!currentUser) return;
    const group: StoryGroup = {
      user: story.user,
      stories: [story],
      hasUnviewed: false,
    };
    setViewerGroup(group);
  };

  const groups = groupByMonth(stories);

  return (
    <div className="mx-auto max-w-[935px] px-4 py-6">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="cursor-pointer rounded-full p-1.5 text-text-secondary hover:text-text-primary"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-xl font-semibold">Kho lưu trữ</h1>
      </div>

      {groups.length === 0 && !isLoading && (
        <div className="py-20 text-center text-text-secondary">
          <p className="text-lg">Chưa có story nào trong kho lưu trữ</p>
          <p className="mt-1 text-sm">Stories hết hạn sẽ tự động được lưu vào đây.</p>
        </div>
      )}

      {groups.map(({ label, stories: groupStories }) => (
        <section key={label} className="mb-8">
          <h2 className="mb-3 text-sm font-semibold capitalize text-text-secondary">{label}</h2>
          <div className="grid grid-cols-3 gap-1 sm:gap-2">
            {groupStories.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => openViewer(s)}
                className="group relative aspect-[9/16] overflow-hidden rounded-lg bg-bg-card"
              >
                {s.mediaUrl ? (
                  s.mediaType === 'Video' ? (
                    <video
                      src={s.mediaUrl}
                      className="h-full w-full object-cover"
                      muted
                    />
                  ) : (
                    <img
                      src={s.mediaUrl}
                      alt={s.caption ?? ''}
                      className="h-full w-full object-cover"
                    />
                  )
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/60 to-accent/60 p-2">
                    <p className="line-clamp-4 text-center text-xs text-white">{s.caption}</p>
                  </div>
                )}

                {/* Video badge */}
                {s.mediaType === 'Video' && (
                  <div className="absolute right-1.5 top-1.5 rounded bg-black/60 p-0.5">
                    <Video className="h-3 w-3 text-white" />
                  </div>
                )}

                {/* Caption overlay on hover */}
                {s.caption && s.mediaUrl && (
                  <div className="absolute inset-x-0 bottom-0 translate-y-full bg-gradient-to-t from-black/70 to-transparent px-2 pb-2 pt-4 transition-transform duration-200 group-hover:translate-y-0">
                    <p className="line-clamp-2 text-xs text-white">{s.caption}</p>
                  </div>
                )}
              </button>
            ))}
          </div>
        </section>
      ))}

      {isLoading && (
        <div className="flex justify-center py-6">
          <Spinner />
        </div>
      )}

      <div ref={sentinelRef} />

      {/* Viewer */}
      {viewerGroup && (
        <StoryViewer
          groups={[viewerGroup]}
          initialGroupIndex={0}
          onClose={() => setViewerGroup(null)}
        />
      )}
    </div>
  );
}

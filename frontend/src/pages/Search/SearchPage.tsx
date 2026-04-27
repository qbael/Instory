import { useState, memo } from 'react';
import { Link, useSearchParams } from 'react-router';
import { Search, Hash, X } from 'lucide-react';
import { useSearch } from '@/hooks/useSearch';
import { UserCard } from '@/components/user/UserCard';
import { UserCardSkeleton } from '@/components/user/UserCardSkeleton';
import { cn } from '@/utils/cn';
import type { Post, Hashtag } from '@/types';

type Tab = 'people' | 'posts' | 'hashtags';

const tabs: { key: Tab; label: string }[] = [
  { key: 'people', label: 'Mọi người' },
  { key: 'posts', label: 'Bài viết' },
  { key: 'hashtags', label: 'Hashtag' },
];

export default function SearchPage() {
  const [searchParams] = useSearchParams();
  const initialTag = searchParams.get('tag');
  const [tab, setTab] = useState<Tab>(initialTag ? 'hashtags' : 'people');
  const { query, setQuery, results, isLoading, clear } = useSearch(tab);

  // Pre-fill from tag query param
  if (initialTag && !query) {
    setQuery(`#${initialTag}`);
  }

  const isEmpty = results &&
    !results.users.length &&
    !results.posts.length &&
    !results.hashtags.length;

  return (
    <div>
      {/* Tabs — always visible */}
      <div className="mb-4 flex gap-1 rounded-lg bg-bg-card p-1">
        {tabs.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={cn(
              'flex-1 cursor-pointer rounded-md py-2 text-center text-sm font-medium transition-colors',
              tab === key
                ? 'bg-primary text-white shadow-sm'
                : 'text-text-secondary hover:text-text-primary',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Search input */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={
            tab === 'people' ? 'Tìm kiếm mọi người…'
            : tab === 'posts' ? 'Tìm kiếm bài viết…'
            : 'Tìm kiếm hashtag…'
          }
          className="w-full rounded-lg border border-border bg-bg py-2.5 pl-10 pr-10 text-sm text-text-primary placeholder:text-text-secondary/70 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
        {query && (
          <button
            type="button"
            onClick={clear}
            className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer rounded-full bg-border/60 p-0.5 text-text-secondary hover:bg-border"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="space-y-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <UserCardSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Results */}
      {!isLoading && results && (
        <>
          {/* People tab */}
          {tab === 'people' && (
            <div>
              {results.users.length > 0 ? (
                <div className="rounded-lg border border-border bg-bg-card">
                  {results.users.map((u) => (
                    <UserCard key={u.id} user={u} showFriendButton={false} />
                  ))}
                </div>
              ) : (
                <EmptyResults query={query} type="people" />
              )}
            </div>
          )}

          {/* Posts tab */}
          {tab === 'posts' && (
            <div>
              {results.posts.length > 0 ? (
                <PostGrid posts={results.posts} />
              ) : (
                <EmptyResults query={query} type="posts" />
              )}
            </div>
          )}

          {/* Hashtags tab */}
          {tab === 'hashtags' && (
            <div>
              {results.hashtags.length > 0 ? (
                <div className="rounded-lg border border-border bg-bg-card">
                  {results.hashtags.map((h) => (
                    <HashtagRow key={h.id} hashtag={h} />
                  ))}
                </div>
              ) : (
                <EmptyResults query={query} type="hashtags" />
              )}
            </div>
          )}

          {/* Global empty */}
          {isEmpty && <EmptyResults query={query} />}
        </>
      )}

      {/* No query state */}
      {!query.trim() && !isLoading && (
        <div className="py-20 text-center">
          <Search className="mx-auto mb-3 h-12 w-12 text-border" />
          <p className="text-sm text-text-secondary">
            Tìm kiếm mọi người, bài viết hoặc hashtag
          </p>
        </div>
      )}
    </div>
  );
}

const PostGrid = memo(function PostGrid({ posts }: { posts: Post[] }) {
  return (
    <div className="grid grid-cols-3 gap-1">
      {posts.map((post) => (
        <Link
          key={post.id}
          to={`/profile/${post.user.userName}`}
          className="group relative aspect-square overflow-hidden rounded bg-border"
        >
          {post.images?.[0]?.imageUrl ? (
            <img
              src={post.images[0].imageUrl}
              alt=""
              loading="lazy"
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-bg p-2">
              <p className="line-clamp-3 text-center text-xs text-text-secondary">
                {post.content}
              </p>
            </div>
          )}
          <div className="absolute inset-0 flex items-center justify-center gap-4 bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
            <span className="text-sm font-bold text-white">
              ❤️ {post.likesCount}
            </span>
            <span className="text-sm font-bold text-white">
              💬 {post.commentsCount}
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
});

function HashtagRow({ hashtag }: { hashtag: Hashtag }) {
  return (
    <Link
      to={`/search?tag=${hashtag.tag}`}
      className="flex items-center gap-3 px-4 py-3 no-underline transition-colors hover:bg-border/10"
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-bg">
        <Hash className="h-5 w-5 text-text-secondary" />
      </div>
      <div>
        <p className="text-sm font-semibold text-text-primary">#{hashtag.tag}</p>
        <p className="text-xs text-text-secondary">
          {hashtag.postsCount.toLocaleString()} bài viết
        </p>
      </div>
    </Link>
  );
}

const typeLabelsVI: Record<string, string> = {
  people: 'mọi người',
  posts: 'bài viết',
  hashtags: 'hashtag',
};

function EmptyResults({ query, type }: { query: string; type?: string }) {
  const label = type ? (typeLabelsVI[type] ?? type) : 'kết quả';
  return (
    <div className="py-16 text-center">
      <p className="text-base font-semibold text-text-primary">
        Không tìm thấy {label}
      </p>
      <p className="mt-1 text-sm text-text-secondary">
        Không có kết quả cho &ldquo;{query}&rdquo;. Thử tìm kiếm khác.
      </p>
    </div>
  );
}

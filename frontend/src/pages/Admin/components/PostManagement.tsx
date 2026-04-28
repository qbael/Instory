import { useState, useEffect, useCallback, useRef } from 'react';
import {
  LayoutGrid, Trash2, Search, X, Heart, MessageCircle,
  AlertTriangle, ImageIcon, CheckCircle,
} from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { adminService, type AdminPost } from '@/services/adminService';
import { timeAgo } from '@/utils/formatDate';
import { toast } from 'sonner';

export function PostManagement() {
  const [posts, setPosts] = useState<AdminPost[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [search]);

  const loadPosts = useCallback(async (pageNumber: number, searchQuery: string) => {
    setIsLoading(true);
    try {
      const { data } = await adminService.getPosts({
        pageNumber,
        pageSize: 20,
        search: searchQuery || undefined,
      });
      if (pageNumber === 1) {
        setPosts(data.data);
      } else {
        setPosts((prev) => [...prev, ...data.data]);
      }
      setHasMore(data.hasNextPage);
    } catch {
      toast.error('Lỗi tải danh sách bài viết');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPosts(page, debouncedSearch);
  }, [loadPosts, page, debouncedSearch]);

  const handleDelete = async (postId: number) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa bài viết này? Hành động này sẽ ẩn bài viết khỏi hệ thống.')) return;
    setDeletingId(postId);
    try {
      await adminService.deletePost(postId);
      toast.success('Đã xóa bài viết');
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId ? { ...p, isDeleted: true, deletedAt: new Date().toISOString() } : p
        )
      );
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Thao tác thất bại');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #0ea5e9, #6366f1)' }}
          >
            <LayoutGrid className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-text-primary">Kiểm duyệt bài viết</h2>
            <p className="text-xs text-text-secondary">Xem và xóa bài viết vi phạm</p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm theo nội dung hoặc tên tác giả..."
          className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-bg-card border border-border text-text-primary placeholder:text-text-secondary text-sm transition-all duration-200 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Loading state */}
      {isLoading && posts.length === 0 && (
        <div className="flex justify-center py-20">
          <Spinner size="lg" />
        </div>
      )}

      {/* Empty state */}
      {!isLoading && posts.length === 0 && (
        <div className="py-20 text-center bg-bg-card rounded-2xl border border-border">
          <LayoutGrid className="mx-auto mb-3 h-12 w-12 text-text-secondary opacity-30" />
          <p className="text-text-secondary font-medium">
            {debouncedSearch ? `Không tìm thấy bài viết cho "${debouncedSearch}"` : 'Chưa có bài viết nào.'}
          </p>
        </div>
      )}

      {/* Posts grid */}
      <div className="grid gap-4">
        {posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            isDeleting={deletingId === post.id}
            onDelete={handleDelete}
          />
        ))}
      </div>

      {isLoading && posts.length > 0 && (
        <div className="flex justify-center py-4">
          <Spinner />
        </div>
      )}

      {hasMore && !isLoading && (
        <div className="flex justify-center">
          <Button variant="secondary" onClick={() => setPage(p => p + 1)}>
            Tải thêm
          </Button>
        </div>
      )}
    </div>
  );
}

// ─── Post Card ───────────────────────────────────────────────────────────────

interface PostCardProps {
  post: AdminPost;
  isDeleting: boolean;
  onDelete: (id: number) => void;
}

function PostCard({ post, isDeleting, onDelete }: PostCardProps) {
  return (
    <div
      className="rounded-2xl border bg-bg-card overflow-hidden transition-all duration-200"
      style={{
        borderColor: post.isDeleted ? 'rgba(237,73,86,0.3)' : 'var(--color-border)',
        opacity: post.isDeleted ? 0.7 : 1,
      }}
    >
      <div className="p-4">
        {/* Top row: author + status + actions */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <Avatar src={post.user.avatarUrl} alt={post.user.userName} size="sm" />
            <div>
              <p className="font-semibold text-text-primary text-sm">{post.user.userName}</p>
              <p className="text-xs text-text-secondary">{timeAgo(post.createdAt)}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Status badge */}
            {post.isDeleted ? (
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold"
                style={{ background: 'rgba(237,73,86,0.1)', color: '#ed4956' }}
              >
                <X className="w-3 h-3" /> Đã xóa
              </span>
            ) : (
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold"
                style={{ background: 'rgba(88,195,34,0.1)', color: '#58c322' }}
              >
                <CheckCircle className="w-3 h-3" /> Hoạt động
              </span>
            )}

            {/* Delete button */}
            {!post.isDeleted && (
              <Button
                variant="danger"
                size="sm"
                onClick={() => onDelete(post.id)}
                disabled={isDeleting}
                title="Xóa bài viết"
              >
                {isDeleting ? (
                  <Spinner size="sm" />
                ) : (
                  <Trash2 className="h-3.5 w-3.5" />
                )}
                {isDeleting ? 'Đang xóa...' : 'Xóa'}
              </Button>
            )}
          </div>
        </div>

        {/* Post content */}
        {post.content && (
          <p className="text-sm text-text-primary mb-3 line-clamp-3 leading-relaxed">{post.content}</p>
        )}

        {/* Image preview */}
        {post.images.length > 0 && (
          <div className="flex gap-2 mb-3 overflow-x-auto pb-1">
            {post.images.slice(0, 4).map((img, i) => (
              <div
                key={i}
                className="relative shrink-0 w-20 h-20 rounded-lg overflow-hidden bg-bg border border-border"
              >
                <img
                  src={img.imageUrl}
                  alt=""
                  className="w-full h-full object-cover"
                />
                {i === 3 && post.images.length > 4 && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <span className="text-white text-xs font-bold">+{post.images.length - 4}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Stats row */}
        <div className="flex items-center gap-4 pt-2 border-t border-border">
          <span className="flex items-center gap-1.5 text-xs text-text-secondary">
            <Heart className="w-3.5 h-3.5 text-accent" />
            {post.likeCount}
          </span>
          <span className="flex items-center gap-1.5 text-xs text-text-secondary">
            <MessageCircle className="w-3.5 h-3.5 text-primary" />
            {post.commentCount}
          </span>
          {post.images.length > 0 && (
            <span className="flex items-center gap-1.5 text-xs text-text-secondary">
              <ImageIcon className="w-3.5 h-3.5" />
              {post.images.length} ảnh
            </span>
          )}
          {post.reportCount > 0 && (
            <span
              className="flex items-center gap-1.5 text-xs font-semibold ml-auto"
              style={{ color: '#fdcb6e' }}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              {post.reportCount} báo cáo
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

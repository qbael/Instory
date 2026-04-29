// ─── User ────────────────────────────────────────────────────────────────────

export interface User {
  id: number;
  userName: string;
  email: string;
  fullName: string | null;
  bio: string | null;
  avatarUrl: string | null;
  createdAt: string;
  updatedAt: string | null;
}

export interface UserProfile extends User {
  postsCount: number;
  friendsCount: number;
  friendshipStatus: FriendshipStatus | null;
  friendshipRequestId: number | null;
  isRequester: boolean | null;
}

// ─── Post ────────────────────────────────────────────────────────────────────

export interface Post {
  id: number;
  userId: number;
  content: string | null;  
  createdAt: string;
  updatedAt: string | null;
  user: User;
  commentsCount: number;
  likesCount: number;
  sharesCount: number;
  isLiked: boolean;
  hashtags: string[];
  images: PostImage[];
}
export interface PostImage {
  id: number;
  imageUrl: string;
  sortOrder: number;
}

export interface CreatePostDto {
  content?: string;
  image?: File;
}

// ─── Comment ─────────────────────────────────────────────────────────────────

export interface Comment {
  id: number;
  // postId: number;
  // userId: number;
  content: string | null;
  createdAt: string;
  updatedAt: string | null;
  user: User;
}

export interface CreateCommentDto {
  postId: number;
  content: string;
}

// ─── Like ────────────────────────────────────────────────────────────────────

export interface Like {
  id: number;
  postId: number;
  userId: number;
  createdAt: string;
}

// ─── Story ───────────────────────────────────────────────────────────────────

export interface Story {
  id: number;
  userId: number;
  mediaUrl: string | null;
  caption: string | null;
  expiresAt: string;
  createdAt: string;
  user: User;
  viewsCount: number;
  isViewed: boolean;
}

export interface StoryGroup {
  user: User;
  stories: Story[];
  hasUnviewed: boolean;
}

// ─── Story Highlight ────────────────────────────────────────────────────────

export interface StoryHighlight {
  id: number;
  userId: number;
  title: string;
  coverUrl: string | null;
  stories: Story[];
  createdAt: string;
}

// ─── Friendship ──────────────────────────────────────────────────────────────

export type FriendshipStatus = 'pending' | 'accepted' | 'declined';

export interface Friendship {
  id: number;
  requesterId: number;
  addresseeId: number;
  status: FriendshipStatus;
  createdAt: string;
  requester: User;
  addressee: User;
}

// ─── Notification ────────────────────────────────────────────────────────────

export type NotificationType =
  | 'like'
  | 'comment'
  | 'friend_request'
  | 'friend_accept'
  | 'post_share'
  | 'mention';

export interface Notification {
  id: number;
  userId: number;
  type: NotificationType;
  referenceId: number | null;
  message: string | null;
  isRead: boolean;
  createdAt: string;
}

// ─── Hashtag ─────────────────────────────────────────────────────────────────

export interface Hashtag {
  id: number;
  tag: string;
  totalPost: number;
}

// ─── Report Reason ──────────────────────────────────────────────────────────

export interface ReportReason {
  id: number;
  code: string;
  name: string;
  description: string | null;
  severity: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string | null;
}

// ─── Post Report ─────────────────────────────────────────────────────────────

export type ReportStatus = 'pending' | 'reviewed' | 'resolved';

export interface PostReport {
  id: number;
  postId: number;
  reporterId: number;
  reasonId?: number;
  reasonDetail: string | null;
  status: ReportStatus;
  createdAt: string;
  post: Post;
  reporter: User;
}

// ─── Share Post ──────────────────────────────────────────────────────────────

export interface SharePost {
  id: number;
  userId: number;
  postId: number;
  caption: string | null;
  createdAt: string;
  user: User;
  post: Post;
}

// ─── Auth DTOs ───────────────────────────────────────────────────────────────

export interface LoginDto {
  usernameOrEmail: string;
  password: string;
}

export interface RegisterDto {
  username: string;
  email: string;
  password: string;
  fullName?: string;
}

export interface AuthResponse {
  message: string;
  userId: number;
  username: string;
  email: string;
}

// ─── API Response Wrappers ───────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  data: T[];
  items: T[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface PaginationParams {
  pageNumber?: number;
  pageSize?: number;
}

export interface ApiResponse<T> {
  data: T;
  message: string;
  statusCode: number;
  success: boolean;
}
// ─── Search ──────────────────────────────────────────────────────────────────

export type SearchType = 'people' | 'posts' | 'tags';

export interface SearchParams extends PaginationParams {
  query: string;
  type?: SearchType;
}

export interface SearchResults {
  users: User[];
  posts: Post[];
  hashtags: Hashtag[];
}

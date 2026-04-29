using Instory.API.DTOs;
using Instory.API.Helpers;
using Instory.API.Models;
using Instory.API.Repositories;
using Instory.API.Services;

public class PostService : IPostService
{
    private readonly IPostRepository _postRepository;
    private readonly IPostImageRepository _postImageRepository;

    private readonly ILikeRepository _likeRepository;
    private readonly IMediaService _mediaService;

    private readonly IHashtagService _hashtagService;

    private readonly ISharePostRepository _sharePostRepository;
    private readonly IUnitOfWork _unitOfWork;
    public PostService(IPostRepository postRepository, IPostImageRepository postImageRepository, ILikeRepository likeRepository, IMediaService mediaService, IUnitOfWork unitOfWork, IHashtagService hashtagService, ISharePostRepository sharePostRepository)
    {
        _postRepository = postRepository;
        _postImageRepository = postImageRepository;
        _likeRepository = likeRepository;
        _mediaService = mediaService;
        _unitOfWork = unitOfWork;
        _hashtagService = hashtagService;
        _sharePostRepository = sharePostRepository;
    }

    public async Task<PaginatedResult<PostResponseDTO>> GetAllPostsAsync(int currentUserId, int page, int pageSize)
    {
        var query = _postRepository.GetPostsAsync();

        var paginatedPosts = await PaginatedResult<Post>.CreateAsync(query, page, pageSize);

        var likedPostIds = await _likeRepository.GetLikePostIdsByUserIdAsync(currentUserId);

        return paginatedPosts.Map(p => new PostResponseDTO
        {
            Id = p.Id,
            UserId = p.UserId,
            Content = p.Content,
            LikesCount = p.LikeCount,
            CommentsCount = p.CommentCount,
            SharesCount = p.ShareCount,
            CreatedAt = p.CreatedAt,

            IsLiked = likedPostIds.Contains(p.Id),

            User = new UserDTO
            {
                // Id = p.User.Id,
                UserName = p.User.UserName,
                AvatarUrl = p.User.AvatarUrl,
                FullName = p.User.FullName,
                CreatedAt = p.User.CreatedAt
            },
            Images = p.PostImages
            .OrderBy(pi => pi.SortOrder)
            .Select(pi => new PostImageDTO
            {
                Id = pi.Id,
                ImageUrl = pi.ImageUrl,
                SortOrder = pi.SortOrder
            })
            .ToList()
        });
    }

    public async Task<PostResponseDTO> CreatePostAsync(int userId, CreatePostRequestDTO request)
    {
        // 1. Khởi tạo Transaction để đảm bảo tính toàn vẹn dữ liệu
        await _unitOfWork.BeginTransactionAsync();

        try
        {
            // 2. Tạo Post mới
            var post = new Post
            {
                UserId = userId,
                Content = request.Content,
                AllowComment = request.AllowComment
            };

            await _postRepository.AddAsync(post);
            await _unitOfWork.SaveChangesAsync(); // Lưu Post trước để có PostId cho việc lưu ảnh
            Console.WriteLine($"Post đã được lưu với ID: {post.Id}");

            await _hashtagService.ProcessHashtagsAsync(post.Id, request.Content);

            var postImagesDtoList = new List<PostImageDTO>();

            // 3. Xử lý ảnh song song (Concurrent Upload)
            if (request.Images?.Any() == true)
            {
                var allowedTypes = new[] { "image/jpeg", "image/png", "image/jpg" };
                var validImages = request.Images.Where(f => f.Length > 0).ToList();

                // Validate định dạng trước khi mất công gọi AWS S3
                if (validImages.Any(f => !allowedTypes.Contains(f.ContentType)))
                {
                    // Nên dùng Exception tùy chỉnh (ví dụ: BadRequestException) để Middleware bắt mã 400
                    throw new ArgumentException("File không hợp lệ (chỉ chấp nhận định dạng jpg/png).");
                }

                // Tạo danh sách các tác vụ (Tasks) upload lên S3
                var uploadTasks = validImages.Select(async (file, index) =>
                {
                    // Upload file lên S3
                    var imageUrl = await _mediaService.UploadFileAsync(file, "posts");

                    return new PostImage
                    {
                        PostId = post.Id,
                        ImageUrl = imageUrl,
                        SortOrder = index + 1 // Đảm bảo đúng thứ tự người dùng chọn
                    };
                });

                // Chạy tất cả các tác vụ upload cùng một lúc (Tối ưu tốc độ)
                PostImage[] postImages = await Task.WhenAll(uploadTasks);

                if (postImages.Any())
                {
                    await _postImageRepository.AddRangeAsync(postImages);

                    // Map ngay sang DTO để chuẩn bị trả về cho frontend
                    postImagesDtoList = postImages.Select(img => new PostImageDTO
                    {
                        Id = img.Id,
                        ImageUrl = img.ImageUrl,
                        SortOrder = img.SortOrder
                    }).ToList();
                }
            }

            // 4. Save tất cả thay đổi một lần duy nhất
            await _postRepository.SaveChangesAsync();

            // 5. Nếu mọi thứ thành công (cả DB và S3), xác nhận Transaction
            await _unitOfWork.CommitTransactionAsync();

            // 6. Map dữ liệu thành Response DTO và trả về
            return new PostResponseDTO
            {
                // Id = post.Id,
                // UserId = post.UserId,
                Content = post.Content,
                CreatedAt = post.CreatedAt,
                LikesCount = 0,
                CommentsCount = 0,
                SharesCount = 0,
                IsLiked = false,
                Images = postImagesDtoList.OrderBy(img => img.SortOrder).ToList()
            };
        }
        catch (Exception ex)
        {
            // Nếu có bất kỳ lỗi gì (S3 sập, sai định dạng, đứt mạng...), hoàn tác toàn bộ DB
            // Bài viết sẽ KHÔNG bị lưu rác vào database.
            await _unitOfWork.RollbackTransactionAsync();

            // Ném lỗi lên trên để Controller hoặc Exception Middleware xử lý
            throw;
        }
    }
    public async Task<PostResponseDTO> GetPostByIdAsync(int id)
    {
        var post = await _postRepository.GetByIdAsync(id);
        if (post == null)
        {
            return null;
        }
        return MapToResponseDTO(post);
    }

    public async Task<bool> DeletePostAsync(int userId, int postId)
    {
        var post = await _postRepository.GetByIdAsync(postId);
        if (post == null || post.UserId != userId)
        {
            return false;
        }

        post.IsDeleted = true;
        post.DeletedAt = DateTime.UtcNow;
        await _postRepository.SaveChangesAsync();
        return true;
    }

    public async Task<PaginatedResult<PostResponseDTO>> GetPostsByHashtagAsync(int currentUserId, string tag, int page, int pageSize)
    {
        tag = tag.Trim().ToLower();

        var likedPostIds = await _likeRepository.GetLikePostIdsByUserIdAsync(currentUserId);

        var query = _postRepository.GetPostsByHashtag(tag)
        .Select(p => new PostResponseDTO
        {
            Id = p.Id,
            UserId = p.UserId,
            Content = p.Content,
            LikesCount = p.LikeCount,
            CommentsCount = p.CommentCount,
            SharesCount = p.ShareCount,
            CreatedAt = p.CreatedAt,

            IsLiked = likedPostIds.Contains(p.Id),

            User = new UserDTO
            {
                Id = p.User.Id,
                UserName = p.User.UserName,
                AvatarUrl = p.User.AvatarUrl,
                FullName = p.User.FullName,
                CreatedAt = p.User.CreatedAt
            },
            Images = p.PostImages
            .OrderBy(pi => pi.SortOrder)
            .Select(pi => new PostImageDTO
            {
                Id = pi.Id,
                ImageUrl = pi.ImageUrl,
                SortOrder = pi.SortOrder
            })
            .ToList()
        });

        return await PaginatedResult<PostResponseDTO>.CreateAsync(query, page, pageSize);
    }

    public async Task<PostResponseDTO> GetPostDetailByPostId(int postId, int currentUserId)
    {
        var post = await _postRepository.GetPostDetailByPostIdAsync(postId, currentUserId);
        if (post == null)
        {
            throw new UnauthorizedAccessException("Bạn không có quyền chỉnh sửa bài viết này");
        }
        return new PostResponseDTO
        {
            Id = post.Id,
            // UserId = post.UserId,
            Content = post.Content,
            // LikesCount = post.LikeCount,
            // CommentsCount = post.CommentCount,
            // SharesCount = post.ShareCount,            
            CreatedAt = post.CreatedAt,

            User = new UserDTO
            {
                // Id = post.User.Id,
                UserName = post.User.UserName,
                AvatarUrl = post.User.AvatarUrl,
                FullName = post.User.FullName,
                // CreatedAt = post.User.CreatedAt
            },
            Images = post.PostImages
            .OrderBy(pi => pi.SortOrder)
            .Select(pi => new PostImageDTO
            {
                Id = pi.Id,
                ImageUrl = pi.ImageUrl,
                SortOrder = pi.SortOrder
            })
            .ToList()
        };
    }

    public async Task<PostResponseDTO> UpdatePostAsync(int postId, int currentUserId, UpdatePostRequestDTO request)
    {
        await _unitOfWork.BeginTransactionAsync();

        try
        {
            var post = await _postRepository.GetPostAndImagesByPostId(postId);

            if (post == null)
            {
                throw new Exception("Bài viết không tồn tại.");
            }

            if (post.UserId != currentUserId)
            {
                throw new UnauthorizedAccessException("Bạn không có quyền chỉnh sửa bài viết này.");
            }

            post.UpdatedAt = DateTime.UtcNow;

            // Update content
            var oldContent = post.Content ?? "";
            if (request.Content != null && request.Content != oldContent)
            {
                post.Content = request.Content;
                await _hashtagService.UpdateHashtagAsync(post.Id, oldContent, request.Content, post.CreatedAt);
            }

            // remove previous images
            if (request.RemovedImageIds != null && request.RemovedImageIds.Any())
            {
                var imagesToRemove = post.PostImages
                .Where(img => request.RemovedImageIds.Contains(img.Id))
                .ToList();

                if (imagesToRemove.Any())
                {
                    _postImageRepository.RemoveRange(imagesToRemove);

                    var deleteTasks = imagesToRemove.Select(img => _mediaService.DeleteFileAsync(img.ImageUrl));
                    await Task.WhenAll(deleteTasks);

                    // Xóa khỏi tracking list hiện tại để tính SortOrder chính xác
                    foreach (var img in imagesToRemove)
                    {
                        post.PostImages.Remove(img);
                    }
                }

            }
            // Add new img
            if (request.NewImages?.Any() == true)
            {
                // Update thêm định dạng webp, gif cho khớp với frontend bạn làm
                var allowedTypes = new[] { "image/jpeg", "image/png", "image/jpg", "image/webp", "image/gif" };
                var validImages = request.NewImages.Where(f => f.Length > 0).ToList();

                if (validImages.Any(f => !allowedTypes.Contains(f.ContentType)))
                {
                    throw new ArgumentException("File không hợp lệ (chỉ chấp nhận jpg, png, webp, gif).");
                }

                // Tìm SortOrder lớn nhất hiện tại
                int currentMaxSortOrder = post.PostImages.Any() ? post.PostImages.Max(img => img.SortOrder) : 0;

                // Tạo danh sách các tác vụ upload lên S3
                var uploadTasks = validImages.Select(async (file, index) =>
                {
                    var imageUrl = await _mediaService.UploadFileAsync(file, "posts");

                    return new PostImage
                    {
                        PostId = post.Id,
                        ImageUrl = imageUrl,
                        SortOrder = currentMaxSortOrder + index + 1 // Đẩy SortOrder nối tiếp ảnh cũ
                    };
                });

                // Chạy upload song song
                PostImage[] newPostImages = await Task.WhenAll(uploadTasks);

                if (newPostImages.Any())
                {
                    await _postImageRepository.AddRangeAsync(newPostImages);

                    foreach (var img in newPostImages)
                    {
                        post.PostImages.Add(img);
                    }
                }
            }
            _postRepository.Update(post);
            await _unitOfWork.SaveChangesAsync();
            await _unitOfWork.CommitTransactionAsync();

            return new PostResponseDTO
            {
                // Id = post.Id,
                Content = post.Content,
                CreatedAt = post.CreatedAt,
                CommentsCount = post.CommentCount,
                SharesCount = post.ShareCount,
                LikesCount = post.LikeCount,
                Images = post.PostImages
                .OrderBy(img => img.SortOrder)
                .Select(img => new PostImageDTO
                {
                    Id = img.Id,
                    ImageUrl = img.ImageUrl,
                    SortOrder = img.SortOrder
                }).ToList()
            };
        }
        catch (Exception ex)
        {
            await _unitOfWork.RollbackTransactionAsync();
            Console.WriteLine($"[Error] Lỗi khi cập nhật bài viết: {ex.Message}");
            throw;
        }


    }

    public async Task<PaginatedResult<NewsFeedItemDTO>> GetNewsFeedAsync(int currentId, int pageNumber, int pageSize)
    {
        var postsQuery = _postRepository.GetBaseQuery()
        .Where(p => !p.IsDeleted)
        .Select(p => new NewsFeedItemDTO
        {
            FeedType = "POST",
            FeedCreatedAt = p.CreatedAt,
            ShareId = null,
            ShareCaption = null,
            Sharer = null,

            Post = new PostResponseDTO
            {
                Id = p.Id,
                // UserId = p.UserId,
                Content = p.Content,
                LikesCount = p.LikeCount,
                CommentsCount = p.CommentCount,
                SharesCount = p.ShareCount,
                CreatedAt = p.CreatedAt,
                User = new UserDTO
                {
                    UserName = p.User.UserName,
                    AvatarUrl = p.User.AvatarUrl,
                    FullName = p.User.FullName,
                    CreatedAt = p.User.CreatedAt
                },
                Images = p.PostImages
                    .OrderBy(pi => pi.SortOrder)
                    .Select(pi => new PostImageDTO
                    {
                        Id = pi.Id,
                        ImageUrl = pi.ImageUrl,
                        SortOrder = pi.SortOrder
                    }).ToList()
            }
        });
        var sharesQuery = _sharePostRepository.GetBaseQuery()
        .Where(s => !s.Post.IsDeleted)
        .Select(s => new NewsFeedItemDTO
        {
            FeedType = "SHARE",
            FeedCreatedAt = s.CreatedAt,
            ShareId = s.Id,
            ShareCaption = s.Caption,
            Sharer = new UserDTO
            {
                UserName = s.User.UserName,
                AvatarUrl = s.User.AvatarUrl,
                FullName = s.User.FullName,
                CreatedAt = s.User.CreatedAt
            },

            Post = new PostResponseDTO
            {
                Id = s.Post.Id,
                UserId = s.Post.UserId,
                Content = s.Post.Content,
                LikesCount = s.Post.LikeCount,
                CommentsCount = s.Post.CommentCount,
                SharesCount = s.Post.ShareCount,
                CreatedAt = s.Post.CreatedAt,
                // IsLiked sẽ gán sau

                User = new UserDTO
                {
                    UserName = s.Post.User.UserName,
                    AvatarUrl = s.Post.User.AvatarUrl,
                    FullName = s.Post.User.FullName,
                    CreatedAt = s.Post.User.CreatedAt
                },
                Images = s.Post.PostImages
                    .OrderBy(pi => pi.SortOrder)
                    .Select(pi => new PostImageDTO
                    {
                        Id = pi.Id,
                        ImageUrl = pi.ImageUrl,
                        SortOrder = pi.SortOrder
                    }).ToList()
            }
        });

        var combinedQuery = postsQuery.Concat(sharesQuery)
        .OrderByDescending(f => f.FeedCreatedAt);

        var paginatedFeed = await PaginatedResult<NewsFeedItemDTO>.CreateAsync(combinedQuery, pageNumber, pageSize);
        var likedPostIds = await _likeRepository.GetLikePostIdsByUserIdAsync(currentId);
        foreach (var item in paginatedFeed.Data)
        {
            item.Post.IsLiked = likedPostIds.Contains(item.Post.Id);
        }
        return paginatedFeed;

    }
    private static PostResponseDTO MapToResponseDTO(Post post)
    {
        return new PostResponseDTO
        {
            Id = post.Id,
            UserId = post.UserId,
            Content = post.Content,
            LikesCount = post.LikeCount,
            CommentsCount = post.CommentCount,
            SharesCount = post.ShareCount,
            CreatedAt = post.CreatedAt,
            Images = post.PostImages?.Select(img => new PostImageDTO
            {
                Id = img.Id,
                ImageUrl = img.ImageUrl,
                SortOrder = img.SortOrder
            }).OrderBy(img => img.SortOrder).ToList() ?? new List<PostImageDTO>()
        };
    }
}
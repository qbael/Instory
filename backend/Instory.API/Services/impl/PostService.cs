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
    private readonly IUnitOfWork _unitOfWork;
    public PostService(IPostRepository postRepository, IPostImageRepository postImageRepository, ILikeRepository likeRepository, IMediaService mediaService, IUnitOfWork unitOfWork, IHashtagService hashtagService)
    {
        _postRepository = postRepository;
        _postImageRepository = postImageRepository;
        _likeRepository = likeRepository;
        _mediaService = mediaService;
        _unitOfWork = unitOfWork;
        _hashtagService = hashtagService;
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
    private static PostResponseDTO MapToResponseDTO(Post post)
    {
        return new PostResponseDTO
        {
            Id = post.Id,
            UserId = post.UserId,
            Content = post.Content,
            // ImageUrl = post.ImageUrl,
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
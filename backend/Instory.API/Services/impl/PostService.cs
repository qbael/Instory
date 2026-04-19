using Instory.API.DTOs;
using Instory.API.Helpers;
using Instory.API.Models;
using Instory.API.Repositories;

public class PostService : IPostService
{
    private readonly IPostRepository _postRepository;
    private readonly IPostImageRepository _postImageRepository;

    private readonly ILikeRepository _likeRepository;
    public PostService(IPostRepository postRepository, IPostImageRepository postImageRepository, ILikeRepository likeRepository)
    {
        _postRepository = postRepository;
        _postImageRepository = postImageRepository;
        _likeRepository = likeRepository;
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
    }

    public async Task<PostResponseDTO> CreatePostAsync(int userId, CreatePostRequestDTO request)
    {
        // 1. Tạo post
        var post = new Post
        {
            UserId = userId,
            Content = request.Content,
            AllowComment = request.AllowComment
        };

        await _postRepository.AddAsync(post);
        await _postRepository.SaveChangesAsync();

        // 2. Xử lý upload ảnh
        if (request.Images?.Any() == true)
        {
            // Lấy đường dẫn tuyệt đối tới wwwroot/uploads
            var folder = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads");

            // Tạo folder nếu chưa tồn tại
            if (!Directory.Exists(folder))
            {
                Directory.CreateDirectory(folder);
            }

            var postImages = new List<PostImage>();
            int sortOrder = 1;

            foreach (var file in request.Images)
            {
                if (file.Length == 0) continue;

                // (Optional) validate đơn giản
                var allowedTypes = new[] { "image/jpeg", "image/png", "image/jpg" };
                if (!allowedTypes.Contains(file.ContentType))
                {
                    throw new Exception("File không hợp lệ (chỉ chấp nhận jpg/png)");
                }

                // Tạo tên file unique
                var fileName = Guid.NewGuid() + Path.GetExtension(file.FileName);

                var filePath = Path.Combine(folder, fileName);

                // Lưu file
                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    await file.CopyToAsync(stream);
                }

                // Lưu DB
                postImages.Add(new PostImage
                {
                    PostId = post.Id,
                    ImageUrl = "/uploads/" + fileName,
                    SortOrder = sortOrder++
                });
            }

            if (postImages.Any())
            {
                await _postImageRepository.AddRangeAsync(postImages);
                await _postImageRepository.SaveChangesAsync();
            }
        }

        // 3. Trả response
        return MapToResponseDTO(post);
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
            // Images = post.PostImages.OrderBy(pi => pi.SortOrder).ToList()
        };
    }
}
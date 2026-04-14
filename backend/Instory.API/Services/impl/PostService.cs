using Instory.API.DTOs;
using Instory.API.Models;
using Instory.API.Repositories;

public class PostService : IPostService
{
    private readonly IPostRepository _postRepository;
    private readonly IPostImageRepository _postImageRepository;
    public PostService(IPostRepository postRepository, IPostImageRepository postImageRepository)
    {
        _postRepository = postRepository;
        _postImageRepository = postImageRepository;
    }

    public async Task<IEnumerable<PostResponseDTO>> GetAllPostsAsync(int currrentUserId)
    {
        var posts = await _postRepository.GetPostsWithUserAsync();
        if (posts == null)
            return new List<PostResponseDTO>();

        return posts.Select(p => new PostResponseDTO
        {
            Id = p.Id,
            UserId = p.UserId,
            Content = p.Content,
            // ImageUrl = p.ImageUrl,
            LikeCount = p.LikeCount,
            CommentCount = p.CommentCount,
            ShareCount = p.ShareCount,
            CreatedAt = p.CreatedAt,
            // EF convert --> Exists in sql, do not load whole likes only check if exist like of current user
            IsLiked = p.Likes.Any(l => l.UserId == currrentUserId),
            Images = p.PostImages.OrderBy(pi => pi.SortOrder).ToList()
        }).ToList();
    }

    public async Task<PostResponseDTO> CreatePostAsync(int userId, CreatePostRequestDTO request)
    {
        var post = new Post
        {
            UserId = userId,
            Content = request.Content,
            AllowComment = request.AllowComment
        };

        await _postRepository.AddAsync(post);
        await _postRepository.SaveChangesAsync();

        if (request.Images != null && request.Images.Count > 0)
        {
            var postImages = new List<PostImage>();
            int sortOrder = 1;
            foreach (var file in request.Images)
            {
                //generate unique filename
                var filename = Guid.NewGuid() + Path.GetExtension(file.FileName);

                //save file to wwwroot/images/posts
                var filePath = Path.Combine("wwwroot/uploads", filename);
                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    await file.CopyToAsync(stream);
                }

                postImages.Add(new PostImage
                {
                    PostId = post.Id,
                    ImageUrl = "/uploads" + filename,
                    SortOrder = sortOrder++
                });
            }

            await _postImageRepository.AddRangeAsync(postImages);
            await _postImageRepository.SaveChangesAsync();
        }
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
            LikeCount = post.LikeCount,
            CommentCount = post.CommentCount,
            ShareCount = post.ShareCount,
            CreatedAt = post.CreatedAt,
            // Images = post.PostImages.OrderBy(pi => pi.SortOrder).ToList()
        };
    }
}
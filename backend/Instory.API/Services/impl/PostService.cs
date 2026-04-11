using Instory.API.DTOs;
using Instory.API.Models;
using Instory.API.Repositories;

public class PostService : IPostService
{
    private readonly IPostRepository _postRepository;

    public PostService(IPostRepository postRepository)
    {
        _postRepository = postRepository;
    }

    public async Task<IEnumerable<PostResponseDTO>> GetAllPostsAsync()
    {
        var posts = await _postRepository.GetPostsWithUserAsync();
        return posts.Select(MapToResonseDTO);
    }

    public async Task<PostResponseDTO> CreatePostAsync(int userId, CreatePostRequestDTO request)
    {
        var post = new Post
        {
            UserId = userId,
            Content = request.Content,
            ImageUrl = request.ImageUrl,
            AllowComment = request.AllowComment
        };

        await _postRepository.AddAsync(post);
        await _postRepository.SaveChangesAsync();

        return MapToResonseDTO(post);
    }

    public async Task<PostResponseDTO> GetPostByIdAsync(int id)
    {
        var post = await _postRepository.GetByIdAsync(id);
        if (post == null)
        {
            throw new Exception("Post not found");
        }
        return MapToResonseDTO(post);
    }
    private static PostResponseDTO MapToResonseDTO(Post post)
    {
        return new PostResponseDTO
        {
            Id = post.Id,
            UserId = post.UserId,
            Content = post.Content,
            ImageUrl = post.ImageUrl,
            LikeCount = post.LikeCount,
            CommentCount = post.CommentCount,
            ShareCount = post.ShareCount,
            CreatedAt = post.CreatedAt
        };
    }
}
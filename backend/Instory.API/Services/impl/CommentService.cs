using Instory.API.Helpers;
using Instory.API.Models;
using Instory.API.Repositories;
public class CommentService : ICommentService
{
    private readonly ICommentRepository _commentRepository;
    private readonly IPostRepository _postRepository;

    public CommentService(ICommentRepository commentRepository, IPostRepository postRepository)
    {
        _commentRepository = commentRepository;
        _postRepository = postRepository;
    }
    public async Task<CommentResponseDTO?> AddCommentAsync(int userId, int postId, CreateCommentRequestDTO request)
    {

        var post = await _postRepository.GetByIdAsync(postId);
        Console.WriteLine("POST: " + post);
        if (post == null || !post.AllowComment)
        {
            return null;
        }

        var comment = new Comment
        {
            UserId = userId,
            PostId = postId,
            Content = request.Content,
            CreatedAt = DateTime.UtcNow
        };


        await _commentRepository.AddAsync(comment);

        post.CommentCount++;
        // await _postRepository.SaveChangesAsync(); // save change in Comment and Post
        await _commentRepository.SaveChangesAsync();

        return new CommentResponseDTO
        {
            Id = comment.Id,
            // PostId = comment.PostId,
            // UserId = comment.UserId,
            Content = comment.Content,
            CreatedAt = comment.CreatedAt,
        };

    }

    public async Task<bool> DeleteCommentAsync(int commentId, int userId)
    {
        var comment = await _commentRepository.GetByIdAsync(commentId);
        if (comment == null)
        {
            return false;
        }
        var post = await _postRepository.GetByIdAsync(comment.PostId);
        if (post == null) return false;

        bool isCommentOwner = comment.UserId == userId;
        bool isPostOwner = post.UserId == userId;

        if (!isCommentOwner && !isPostOwner)
        {
            return false; // user is not the owner of the comment or the post
        }

        _commentRepository.Remove(comment);

        post.CommentCount = Math.Max(0, post.CommentCount - 1); // decrease comment count but not less than 0

        await _commentRepository.SaveChangesAsync();
        return true;
    }

    public async Task<PaginatedResult<CommentResponseDTO>> GetCommentsAsync(int postId, int page, int pageSize)
    {
        var paginatedEntities = await _commentRepository.GetCommentsByPostIdAsync(postId, page, pageSize);

        // Dùng hàm Map() để chuyển từ PaginatedResult<Comment> sang PaginatedResult<CommentResponseDTO>
        var paginatedDtos = paginatedEntities.Map(entity => new CommentResponseDTO
        {
            Id = entity.Id,
            Content = entity.Content ?? string.Empty,
            User = new UserDTO
            {
                Id = entity.User.Id,
                UserName = entity.User.UserName ?? string.Empty,
                AvatarUrl = entity.User.AvatarUrl,
                FullName = entity.User.FullName,
                CreatedAt = entity.User.CreatedAt
            },
            CreatedAt = entity.CreatedAt
        });

        return paginatedDtos;
    }
}
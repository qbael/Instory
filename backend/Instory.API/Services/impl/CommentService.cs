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

    public async Task<CommentResponseDTO> AddCommentAsync(int userId, CreateCommentRequestDTO request)
    {

        var post = await _postRepository.GetByIdAsync(request.PostId);
        if (post == null || !post.AllowComment)
        {
            return null;
        }

        var comment = new Comment
        {
            UserId = userId,
            PostId = request.PostId,
            Content = request.Content
        };

        await _commentRepository.AddAsync(comment);
        post.CommentCount++;
        await _postRepository.SaveChangesAsync(); // save change in Comment and Post

        return new CommentResponseDTO
        {
            Id = comment.Id,
            PostId = comment.PostId,
            UserId = comment.UserId,
            Content = comment.Content,
            CreatedAt = comment.CreatedAt
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
}
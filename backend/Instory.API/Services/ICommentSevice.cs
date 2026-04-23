using Instory.API.Helpers;

public interface ICommentService
{
    Task<PaginatedResult<CommentResponseDTO>> GetCommentsAsync(int postId, int page, int pageSize);
    Task<CommentResponseDTO> AddCommentAsync(int userId, int postId, CreateCommentRequestDTO request);
    Task<bool> DeleteCommentAsync(int commentId, int userId);
}
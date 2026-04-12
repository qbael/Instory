public interface ICommentService
{
    Task<CommentResponseDTO> AddCommentAsync(int userId, CreateCommentRequestDTO request);
    Task<bool> DeleteCommentAsync(int commentId, int userId);
}
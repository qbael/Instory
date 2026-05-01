using Instory.API.DTOs;
using Instory.API.Helpers;

public interface ISharePostService
{
    Task SharePostAsync(int postId, int userId, SharePostDto dto);
    Task<PaginatedResult<PostResponseDTO>> GetUserSharedPostsAsync(int targetUserId, int currentUserId, int page, int pageSize);
}
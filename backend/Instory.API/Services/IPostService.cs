using Instory.API.DTOs;
using Instory.API.Helpers;
using Instory.API.Models;

public interface IPostService
{
    Task<PostResponseDTO> CreatePostAsync(int userId, CreatePostRequestDTO request);

    Task<PostResponseDTO> GetPostByIdAsync(int id);
    Task<PaginatedResult<PostResponseDTO>> GetAllPostsAsync(int currrentUserId, int page, int pageSize);

    Task<bool> DeletePostAsync(int userId, int postId);

}
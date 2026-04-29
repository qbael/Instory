using Instory.API.DTOs;
using Instory.API.Models;

namespace Instory.API.Services;

public interface ISearchService
{
    Task<List<UserDTO>> SearchUsersAsync(string query);

    Task<List<PostResponseDTO>> SearchPostsAsync(string query);

}
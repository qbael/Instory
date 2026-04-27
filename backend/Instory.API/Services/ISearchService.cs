namespace Instory.API.Services;

public interface ISearchService
{
    Task<List<UserDTO>> SearchUsersAsync(string query);
}
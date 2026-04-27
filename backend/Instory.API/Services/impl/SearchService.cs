using Instory.API.Repositories;

namespace Instory.API.Services.impl;

public class SearchService : ISearchService
{
    private readonly IUserRepository _userRepository;

    public SearchService(IUserRepository userRepository)
    {
        _userRepository = userRepository;
    }

    public async Task<List<UserDTO>> SearchUsersAsync(string query)
    {
        var users = await _userRepository.SearchAsync(query);
        return users.Select(UserDTO.FromEntity).ToList();
    }
}
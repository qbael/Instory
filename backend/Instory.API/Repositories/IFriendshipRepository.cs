using Instory.API.Models;

namespace Instory.API.Repositories;

public interface IFriendshipRepository : IRepository<Friendship>
{
    Task<Friendship?> GetBetweenUsersAsync(int userId1, int userId2);
    Task<List<Friendship>> GetPendingRequestsAsync(int userId);
    Task<List<Friendship>> GetSentPendingRequestsAsync(int userId);
}

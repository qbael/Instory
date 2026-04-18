using Instory.API.Models;

namespace Instory.API.Repositories;

public interface ILikeRepository : IRepository<Like>
{
    Task<Like?> GetLikeAsync(int postId, int userId);

    //Liked Posts
    Task<HashSet<int>> GetLikePostIdsByUserIdAsync(int userId);
}
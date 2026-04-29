using Instory.API.Models;

namespace Instory.API.Repositories;

public interface ISharePostRepository : IRepository<SharePost>
{
    Task<bool> ExistsAsync(int postId, int userId);
    IQueryable<SharePost> GetByUserQueryable(int userId);
}
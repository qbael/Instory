using Instory.API.Models;

namespace Instory.API.Repositories;

public interface IPostReportRepository : IRepository<PostReport>
{
    Task<bool> ExistsAsync(int postId, int reporterId);
    // Task CreateAsync(PostReport postReport);
}
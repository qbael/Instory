using Instory.API.Helpers;
using Instory.API.Models;

namespace Instory.API.Repositories;

public interface ICommentRepository : IRepository<Comment>
{
    Task<PaginatedResult<Comment>> GetCommentsByPostIdAsync(int postId, int page, int pageSize);
}
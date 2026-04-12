using Instory.API.Models;

namespace Instory.API.Repositories;

public interface ICommentRepository : IRepository<Comment>
{
    Task<IEnumerable<Comment>> GetCommentsByPostIdAsync(int postId);
}
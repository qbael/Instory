using Instory.API.Models;

namespace Instory.API.Repositories;

public interface IPostImageRepository : IRepository<PostImage>
{
    Task<IEnumerable<PostImage>> GetImagesByPostIdAsync(int postId);
}
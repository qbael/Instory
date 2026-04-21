using Instory.API.Models;
using Instory.API.Repositories;
namespace Instory.API.Repositories;

public interface IHashtagRepository : IRepository<Hashtag>
{
    Task<Hashtag?> GetByTagAsync(string tag);
    Task IncreasePostCountAsync(int hashtagId);

    // IQueryable<Post> GetPostsByHashtag(string tag);
}
using Instory.API.Models;
using Instory.API.Repositories;

public interface IHashtagRepository : IRepository<Hashtag>
{
    Task<Hashtag?> GetByTagAsync(string tag);
    Task IncreasePostCountAsync(int hashtagId);

    Task<IEnumerable<Post>> GetPostsByHashtag(string tag, int page, int pageSize);
}
using Instory.API.Models;
namespace Instory.API.Repositories;

public interface IPostHashtagRepository : IRepository<PostHashtag>
{
    Task<PostHashtag?> GetByPostAndHashtagAsync(int postId, int hashtagId);
}
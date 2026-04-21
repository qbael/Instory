using Instory.API.Models;

namespace Instory.API.Repositories;

public interface IPostRepository : IRepository<Post>
{
    //Display (avatar/Username)
    IQueryable<Post> GetPostsAsync();

    // Get detail one post (avatar/Username/Like/Comments)
    Task<Post?> GetPostDetailAsync(int id);

    Task<IEnumerable<Post>> GetPostsByUserIdAsync(int userId);

    IQueryable<Post> GetPostsByHashtag(string tag);

}
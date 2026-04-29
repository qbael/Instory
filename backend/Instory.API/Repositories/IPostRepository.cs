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

    Task<Post?> GetPostDetailByPostIdAsync(int postId, int currentUserId);

    Task<Post?> GetPostAndImagesByPostId(int postId);

    IQueryable<Post> GetBaseQuery();

    Task<List<Post>> SearchPostsAsync(string query, int limit = 20);

}
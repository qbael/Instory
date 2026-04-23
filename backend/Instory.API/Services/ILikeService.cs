public interface ILikeService
{
    Task<bool> ToggleLikeAsync(int postId, int userId);

    // Task<IEnumerable<int>> GetUserLikedPostsAsync(int userId);
}
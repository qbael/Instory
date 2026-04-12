public interface ILikeService
{
    Task<bool> ToggleLikeAsync(int postId, int userId);
}
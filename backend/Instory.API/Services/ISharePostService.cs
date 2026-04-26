public interface ISharePostService
{
    Task SharePostAsync(int postId, int userId, SharePostDto dto);
}
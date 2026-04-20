public interface IHashtagService
{
    Task ProcessHashtagsAsync(int postId, string caption);
}
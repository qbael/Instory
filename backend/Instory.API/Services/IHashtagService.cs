public interface IHashtagService
{
    Task ProcessHashtagsAsync(int postId, string caption);

    Task<List<HashtagDTO>> GetTrendingHashtagsAsync(int top = 10);
}
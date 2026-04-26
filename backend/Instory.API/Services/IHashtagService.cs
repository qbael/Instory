public interface IHashtagService
{
    Task ProcessHashtagsAsync(int postId, string caption);

    Task<List<HashtagDTO>> GetTrendingHashtagsAsync(int top = 10);

    Task<List<HashtagDTO>> SearchHashtagsAsync(string query, int limit = 10);
    Task UpdateHashtagAsync(int postId, string oldCaption, string newCaption, DateTime postCreateAt);
}
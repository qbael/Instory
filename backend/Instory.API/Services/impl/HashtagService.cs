using System.Text.RegularExpressions;
using Instory.API.Models;
using Instory.API.Repositories;
using Microsoft.EntityFrameworkCore;

public class HashtagService : IHashtagService
{
    private readonly IHashtagRepository _hashtagRepository;
    private readonly IPostHashtagRepository _postHashtagRepository;
    private readonly IHashtagTrendRepository _hashtagTrendRepository;

    public HashtagService(IHashtagRepository hashtagRepository, IHashtagTrendRepository hashtagTrendRepository, IPostHashtagRepository postHashtagRepository)
    {
        _hashtagRepository = hashtagRepository;
        _hashtagTrendRepository = hashtagTrendRepository;
        _postHashtagRepository = postHashtagRepository;
    }
    private List<string> ExtractHashtags(string caption)
    {
        if (string.IsNullOrWhiteSpace(caption)) return new List<string>();

        // \p{L} bắt tất cả các chữ cái có dấu trong Unicode
        // \p{N} bắt các chữ số
        // _ bắt dấu gạch dưới
        var matches = Regex.Matches(caption, @"#([\p{L}\p{N}_]+)");

        return matches
            .Select(m => m.Groups[1].Value.ToLower()) // Lấy Group 1 để bỏ qua dấu # mà không cần Substring
            .Distinct()
            .ToList();
    }

    public async Task ProcessHashtagsAsync(int postId, string caption)
    {
        var tags = ExtractHashtags(caption);

        var postHashtags = new List<PostHashtag>();

        foreach (var tag in tags)
        {
            // 1. tìm hashtag
            var hashtag = await _hashtagRepository.GetByTagAsync(tag);

            // 2. nếu chưa có → tạo mới
            if (hashtag == null)
            {
                hashtag = new Hashtag
                {
                    Tag = tag,
                    TotalPost = 0,
                    CreatedAt = DateTime.UtcNow
                };

                await _hashtagRepository.AddAsync(hashtag);
                await _hashtagRepository.SaveChangesAsync();
            }

            // 3. tăng post_count
            await _hashtagRepository.IncreasePostCountAsync(hashtag.Id);

            // 4. insert mapping
            postHashtags.Add(new PostHashtag
            {
                PostId = postId,
                HashtagId = hashtag.Id
            });

            // 5. update trending
            await _hashtagTrendRepository.UpsertTrendAsync(hashtag.Id, DateTime.UtcNow);
        }

        await _postHashtagRepository.AddRangeAsync(postHashtags);
    }

    public async Task<List<HashtagDTO>> GetTrendingHashtagsAsync(int top = 10)
    {
        var now = DateTime.UtcNow;
        var last1Days = now.AddDays(-1);
        var last3Days = now.AddDays(-3);
        var last7Days = now.AddDays(-7);

        // Get data recent 7 days
        var trendQuery = _hashtagTrendRepository.GetRecentTrends(last7Days);

        // Group + Calc
        var grouped = trendQuery
            .GroupBy(ht => ht.HashtagId)
            .Select(g => new
            {
                HashtagId = g.Key,
                Last24h = g.Where(x => x.Date >= last1Days).Sum(x => x.PostCount),
                Last3d = g.Where(x => x.Date >= last3Days).Sum(x => x.PostCount),
                Last7d = g.Sum(x => x.PostCount)
            });

        // Calc score
        var scored = grouped.Select(x => new
        {
            x.HashtagId,
            Score = x.Last24h * 0.7 + x.Last3d * 0.2 + x.Last7d * 0.1
        });

        // Join Hashtag + return DTO
        var result = await scored
            .OrderByDescending(x => x.Score)
            .Take(top)
            .Join(_hashtagRepository.GetAllHashtags(),
                x => x.HashtagId,
                h => h.Id,
                (x, h) => new HashtagDTO
                {
                    Id = h.Id,
                    Tag = h.Tag,
                    TotalPost = h.TotalPost,
                    Score = x.Score
                }).ToListAsync();
        return result;
    }
}
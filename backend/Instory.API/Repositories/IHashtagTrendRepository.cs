using Instory.API.Models;

namespace Instory.API.Repositories;

public interface IHashtagTrendRepository : IRepository<HashtagTrend>
{
    Task<HashtagTrend?> GetHashtagTrendAsync(int hashtagId, DateTime date);

    IQueryable<HashtagTrend> GetRecentTrends(DateTime fromDate);

    // Task DecreaseTrendAsync(int hashtagId, DateTime date);
}
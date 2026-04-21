using Instory.API.Models;

namespace Instory.API.Repositories;

public interface IHashtagTrendRepository : IRepository<HashtagTrend>
{
    Task UpsertTrendAsync(int hashtagId, DateTime date);

    IQueryable<HashtagTrend> GetRecentTrends(DateTime fromDate);
}
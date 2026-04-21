using Instory.API.Models;

namespace Instory.API.Repositories;

public interface IHashtagTrendRepository : IRepository<HashtagTrend>
{
    Task UpsertTrendAsync(int hashtagId, DateTime date);
}
using Instory.API.Data;
using Instory.API.Models;
using Microsoft.EntityFrameworkCore;

namespace Instory.API.Repositories.impl;

public class HashtagTrendRepository : Repository<HashtagTrend>, IHashtagTrendRepository
{
    public HashtagTrendRepository(InstoryDbContext context) : base(context)
    {
    }

    public async Task UpsertTrendAsync(int hashtagId, DateTime date)
    {
        var trend = await _dbSet.FirstOrDefaultAsync(t => t.HashtagId == hashtagId && t.Date == date);
        if (trend != null)
        {
            trend.PostCount++;
        }
        else
        {
            trend = new HashtagTrend
            {
                HashtagId = hashtagId,
                Date = date,
                PostCount = 1
            };
            await _dbSet.AddAsync(trend);
        }
    }

    public IQueryable<HashtagTrend> GetRecentTrends(DateTime fromDate)
    {
        return _context.HashtagTrends
            .Where(ht => ht.Date >= fromDate);
    }
}
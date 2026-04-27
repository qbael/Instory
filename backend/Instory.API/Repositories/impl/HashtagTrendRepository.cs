using Instory.API.Data;
using Instory.API.Models;
using Microsoft.EntityFrameworkCore;

namespace Instory.API.Repositories.impl;

public class HashtagTrendRepository : Repository<HashtagTrend>, IHashtagTrendRepository
{
    public HashtagTrendRepository(InstoryDbContext context) : base(context)
    {
    }
    public async Task<HashtagTrend?> GetHashtagTrendAsync(int hashtagId, DateTime date)
    {
        return await _dbSet.FirstOrDefaultAsync(t => t.HashtagId == hashtagId && t.Date == date);
    }
    // public async Task UpsertTrendAsync(int hashtagId, DateTime date)
    // {
    //     var trend = await _dbSet.FirstOrDefaultAsync(t => t.HashtagId == hashtagId && t.Date == date);
    //     if (trend != null)
    //     {
    //         trend.PostCount++;
    //     }
    //     else
    //     {
    //         trend = new HashtagTrend
    //         {
    //             HashtagId = hashtagId,
    //             Date = date,
    //             PostCount = 1
    //         };
    //         await _dbSet.AddAsync(trend);
    //     }
    // }

    // public async Task DecreaseTrendAsync(int hashtagId, DateTime date)
    // {
    //     var trend = await _dbSet.FirstOrDefaultAsync(t => t.HashtagId == hashtagId && t.Date == date);
    //     if (trend != null && trend.PostCount > 0)
    //     {
    //         trend.PostCount--;
    //         if (trend.PostCount == 0)
    //         {
    //             _dbSet.Remove(trend);
    //         }
    //     }
    // }
    public IQueryable<HashtagTrend> GetRecentTrends(DateTime fromDate)
    {
        return _context.HashtagTrends
            .Where(ht => ht.Date >= fromDate);
    }
}
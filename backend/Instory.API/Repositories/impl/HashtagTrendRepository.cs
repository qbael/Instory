using Instory.API.Data;
using Instory.API.Models;
using Instory.API.Repositories.impl;
using Microsoft.EntityFrameworkCore;

public class HashtgTrendRepository : Repository<HashtagTrend>, IHashtagTrendRepository
{
    public HashtgTrendRepository(InstoryDbContext context) : base(context)
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
}
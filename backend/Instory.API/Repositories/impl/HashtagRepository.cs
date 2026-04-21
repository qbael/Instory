using Instory.API.Data;
using Instory.API.Helpers;
using Instory.API.Models;
using Microsoft.AspNetCore.Connections;
using Microsoft.EntityFrameworkCore;

namespace Instory.API.Repositories.impl;

public class HashtagRepository : Repository<Hashtag>, IHashtagRepository
{
    public HashtagRepository(InstoryDbContext context) : base(context)
    {
    }

    public async Task<Hashtag?> GetByTagAsync(string tag)
    {
        return await _dbSet.FirstOrDefaultAsync(h => h.Tag == tag);
    }
    public async Task IncreasePostCountAsync(int hashtagId)
    {
        var hashtag = await _dbSet.FindAsync(hashtagId);
        if (hashtag != null)
        {
            hashtag.TotalPost++;
        }
    }

    public async Task<IEnumerable<Hashtag>> GetByIdsAsync(List<int> ids)
    {
        return await _dbSet.Where(h => ids.Contains(h.Id)).ToListAsync();
    }

    public IQueryable<Hashtag> GetAllHashtags()
    {
        return _dbSet.AsNoTracking();
    }
}
using Instory.API.Data;
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

    public async Task<IEnumerable<Post>> GetPostsByHashtag(string tag, int page, int pageSize)
    {
        var hashtag = await _dbSet.FirstOrDefaultAsync(h => h.Tag == tag);
        if (hashtag == null) return Enumerable.Empty<Post>();

        return await _context.PostHashtags
            .Where(ph => ph.HashtagId == hashtag.Id)
            .Select(ph => ph.Post)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();
    }
}
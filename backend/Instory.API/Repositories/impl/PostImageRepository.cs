using Instory.API.Data;
using Instory.API.Models;
using Microsoft.EntityFrameworkCore;

namespace Instory.API.Repositories.impl;

public class PostImageRepository : Repository<PostImage>, IPostImageRepository
{
    public PostImageRepository(InstoryDbContext context) : base(context)
    {
    }

    public async Task<IEnumerable<PostImage>> GetImagesByPostIdAsync(int postId)
    {
        return await _dbSet
            .Where(pi => pi.PostId == postId)
            .OrderBy(pi => pi.SortOrder)
            .ToListAsync();
    }
}
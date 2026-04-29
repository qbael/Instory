using Instory.API.Data;
using Instory.API.Models;
using Microsoft.EntityFrameworkCore;

namespace Instory.API.Repositories.impl;

public class SharePostRepository : Repository<SharePost>, ISharePostRepository
{
    public SharePostRepository(InstoryDbContext context) : base(context)
    {

    }
    public async Task<bool> ExistsAsync(int postId, int userId)
    {
        return await _dbSet
        .AnyAsync(x => x.PostId == postId && x.UserId == userId);
    }

    public IQueryable<SharePost> GetByUserQueryable(int userId)
    {
        return _dbSet
            .Where(s => s.UserId == userId)
            .Include(s => s.Post)
                .ThenInclude(p => p.PostImages)
            .Include(s => s.Post)
                .ThenInclude(p => p.User)
            .Where(s => !s.Post.IsDeleted)
            .OrderByDescending(s => s.CreatedAt);
    }
}
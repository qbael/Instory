using Instory.API.Data;
using Instory.API.Models;
using Instory.API.Repositories;
using Instory.API.Repositories.impl;
using Microsoft.EntityFrameworkCore;

public class LikeRepository : Repository<Like>, ILikeRepository
{
    public LikeRepository(InstoryDbContext context) : base(context) { }

    public async Task<Like?> GetLikeAsync(int postId, int userId)
    {
        return await _dbSet.FirstOrDefaultAsync(l => l.PostId == postId && l.UserId == userId);
    }

    public async Task<IEnumerable<Like>> GetLikePostIdsByUserIdAsync(int userId)
    {
        return await _dbSet
            .Where(l => l.UserId == userId)
            .Include(l => l.Post) // Include the Post entity to access its details
            .ToListAsync();
    }
}
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

    public async Task<HashSet<int>> GetLikePostIdsByUserIdAsync(int userId)
    {
        return await _dbSet
            .Where(l => l.UserId == userId && !l.IsDeleted)
            .Select(l => l.PostId)
            .ToHashSetAsync();
    }

    // Trả về IQueryable<Post> để PostService có thể paginate
    // JOIN: Likes → Posts, chỉ lấy like chưa xóa và post chưa xóa
    public IQueryable<Post> GetLikedPostsByUserQueryable(int userId)
    {
        return _dbSet
            .Where(l => l.UserId == userId && !l.IsDeleted)
            .Include(l => l.Post).ThenInclude(p => p.PostImages)
            .Include(l => l.Post).ThenInclude(p => p.User)
            .Where(l => !l.Post.IsDeleted)
            .OrderByDescending(l => l.CreatedAt)
            .Select(l => l.Post);
    }
}
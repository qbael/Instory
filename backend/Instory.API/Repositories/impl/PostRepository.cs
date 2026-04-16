using Instory.API.Data;
using Instory.API.Models;
using Microsoft.EntityFrameworkCore;

namespace Instory.API.Repositories.impl;

public class PostRepository : Repository<Post>, IPostRepository
{
    public PostRepository(InstoryDbContext context) : base(context)
    {
    }

    public async Task<IEnumerable<Post>> GetPostsWithUserAsync()
    {
        return await _dbSet
            .Include(p => p.User)
            .Include(p => p.PostImages)
            .Where(p => p.IsDeleted == false)
            .OrderByDescending(p => p.CreatedAt)
            .ToListAsync();
    }

    public async Task<Post?> GetPostDetailAsync(int id)
    {
        return await _dbSet
        .Include(p => p.User)
        .Include(p => p.Likes)
        .Include(p => p.Comments)
        .FirstOrDefaultAsync(p => p.Id == id && !p.IsDeleted);
    }
    public async Task<IEnumerable<Post>> GetPostsByUserIdAsync(int userId)
    {
        return await _dbSet
        .Where(p => p.UserId == userId && !p.IsDeleted)
        .OrderByDescending(p => p.CreatedAt)
        .ToListAsync();
    }
}
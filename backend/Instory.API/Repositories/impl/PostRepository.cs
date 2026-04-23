using Instory.API.Data;
using Instory.API.DTOs;
using Instory.API.Helpers;
using Instory.API.Models;
using Microsoft.EntityFrameworkCore;

namespace Instory.API.Repositories.impl;

public class PostRepository : Repository<Post>, IPostRepository
{
    public PostRepository(InstoryDbContext context) : base(context)
    {
    }

    public IQueryable<Post> GetPostsAsync()
    {
        return _dbSet
            .Where(p => !p.IsDeleted)
            .Include(p => p.PostImages)
            .Include(p => p.User)
            .OrderByDescending(p => p.CreatedAt);
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
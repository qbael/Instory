using Instory.API.Data;
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
    public async Task<Post?> GetPostDetailByPostIdAsync(int postId, int currentUserId)
    {
        return await _dbSet
            .Include(p => p.PostImages)
            .Include(p => p.User)
            .FirstOrDefaultAsync(p =>
            !p.IsDeleted &&
             p.Id == postId &&
             p.UserId == currentUserId
             );
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

    public IQueryable<Post> GetPostsByUserIdQueryable(int userId)
    {
        return _dbSet
            .Where(p => p.UserId == userId && !p.IsDeleted)
            .Include(p => p.PostImages)
            .Include(p => p.User)
            .OrderByDescending(p => p.CreatedAt);
    }

    public IQueryable<Post> GetPostsByHashtag(string tag)
    {
        return _dbSet
            .Where(p => p.PostHashtags.Any(ph => ph.Hashtag.Tag == tag) && !p.IsDeleted) // Any equivalent to EXISTS in SQL
            .OrderByDescending(p => p.CreatedAt);
    }

    public async Task<Post?> GetPostAndImagesByPostId(int postId)
    {
        return await _dbSet
        .Include(p => p.PostImages)
        .FirstOrDefaultAsync(p => p.Id == postId);
    }
}
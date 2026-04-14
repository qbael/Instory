using Instory.API.Data;
using Instory.API.Models;
using Instory.API.Repositories;
using Instory.API.Repositories.impl;
using Microsoft.EntityFrameworkCore;

public class CommentRepository : Repository<Comment>, ICommentRepository
{
    public CommentRepository(InstoryDbContext context) : base(context) { }

    public async Task<IEnumerable<Comment>> GetCommentsByPostIdAsync(int postId)
    {
        return await _dbSet
            .Where(c => c.PostId == postId)
            .Include(c => c.User)
            .OrderByDescending(c => c.CreatedAt)
            .ToListAsync();
    }
}
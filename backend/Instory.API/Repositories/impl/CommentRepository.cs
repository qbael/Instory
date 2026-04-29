using Instory.API.Data;
using Instory.API.Helpers;
using Instory.API.Models;
using Instory.API.Repositories;
using Instory.API.Repositories.impl;
using Microsoft.EntityFrameworkCore;

public class CommentRepository : Repository<Comment>, ICommentRepository
{
    public CommentRepository(InstoryDbContext context) : base(context) { }

    public async Task<PaginatedResult<Comment>> GetCommentsByPostIdAsync(int postId, int page, int pageSize)
    {
        // Tạo câu Query (chưa execute xuống DB)
        var query = _dbSet
            .Include(c => c.User)
            .Where(c => c.PostId == postId)
            .OrderByDescending(c => c.CreatedAt);

        // Phân trang 
        return await PaginatedResult<Comment>.CreateAsync(query, page, pageSize);
    }
}
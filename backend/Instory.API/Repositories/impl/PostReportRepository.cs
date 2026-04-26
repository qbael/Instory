using Instory.API.Data;
using Instory.API.Models;
using Microsoft.EntityFrameworkCore;

namespace Instory.API.Repositories.impl;

public class PostReportRepository : Repository<PostReport>, IPostReportRepository
{
    public PostReportRepository(InstoryDbContext context) : base(context)
    {
    }
    public async Task<bool> ExistsAsync(int postId, int reporterId)
    {
        return await _dbSet
        .AnyAsync(x => x.PostId == postId && x.ReporterId == reporterId);
    }
}
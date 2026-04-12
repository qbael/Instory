using Instory.API.Data;
using Instory.API.Helpers;
using Instory.API.Models;
using Microsoft.EntityFrameworkCore;

namespace Instory.API.Repositories.impl;

public class StoryRepository : Repository<Story>, IStoryRepository
{
    public StoryRepository(InstoryDbContext context) : base(context)
    {
    }

    public async Task<PaginatedResult<Story>> GetStoriesPaginatedAsync(int page, int pageSize)
    {
        return await PaginatedResult<Story>.CreateAsync(
            _dbSet.AsNoTracking().OrderBy(s => s.CreatedAt),
            page,
            pageSize
        );
    }
}

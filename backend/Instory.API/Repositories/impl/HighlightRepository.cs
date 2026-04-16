using System.Collections.Generic;
using System.Threading.Tasks;
using Instory.API.Data;
using Instory.API.Models;
using Microsoft.EntityFrameworkCore;

namespace Instory.API.Repositories.impl;

public class HighlightRepository : Repository<StoryHighlight>, IHighlightRepository
{
    public HighlightRepository(InstoryDbContext context) : base(context)
    {
    }

    public async Task<List<StoryHighlight>> GetByUserIdAsync(int userId)
    {
        return await _dbSet
            .AsNoTracking()
            .Where(h => h.UserId == userId)
            .Include(h => h.HighlightStories)
                .ThenInclude(hs => hs.Story)
                    .ThenInclude(s => s.User)
            .Include(h => h.HighlightStories)
                .ThenInclude(hs => hs.Story)
                    .ThenInclude(s => s.StoryViews)
            .OrderByDescending(h => h.CreatedAt)
            .ToListAsync();
    }

    public async Task<StoryHighlight?> GetByIdWithStoriesAsync(int id)
    {
        return await _dbSet
            .Where(h => h.Id == id)
            .Include(h => h.HighlightStories)
                .ThenInclude(hs => hs.Story)
                    .ThenInclude(s => s.User)
            .Include(h => h.HighlightStories)
                .ThenInclude(hs => hs.Story)
                    .ThenInclude(s => s.StoryViews)
            .FirstOrDefaultAsync();
    }
}

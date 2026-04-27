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

    public async Task AddStoryAsync(StoryHighlightStory item)
    {
        await _context.Set<StoryHighlightStory>().AddAsync(item);
        await _context.SaveChangesAsync();
    }

    public async Task<StoryHighlightStory?> FindStoryHighlightAsync(int highlightId, int storyId)
    {
        return await _context.Set<StoryHighlightStory>()
            .FirstOrDefaultAsync(hs => hs.HighlightId == highlightId && hs.StoryId == storyId);
    }

    public void RemoveStory(StoryHighlightStory item)
    {
        _context.Set<StoryHighlightStory>().Remove(item);
    }
}

using Instory.API.Data;
using Instory.API.Helpers;
using Instory.API.Models;
using Microsoft.EntityFrameworkCore;

namespace Instory.API.Repositories;

public class StoryRepository(InstoryDbContext db) : IStoryRepository
{
    public async Task<PaginatedResult<Story>> GetAllAsync(
        int page, int pageSize)
    {
        return await db.Stories
            .AsNoTracking()
            .OrderBy(story => story.CreatedAt)
            .ToPaginatedResultAsync(page, pageSize);
    }

    public async Task<Story?> GetByIdAsync(int id)
    {
        return await db.Stories
            .AsSingleQuery()
            .FirstOrDefaultAsync(story => story.Id == id);
    }

    public async Task<Story> CreateAsync(Story story)
    {
        db.Stories.Add(story);
        await db.SaveChangesAsync();
        return story;
    }

    public async Task<bool> DeleteByIdAsync(int id)
    {
        var story = await db.Stories.FirstOrDefaultAsync(story => story.Id == id);
        if (story == null)
            return  false;

        story.IsDeleted = true;
        await db.SaveChangesAsync();
        return true;
    }
}
using Instory.API.Data;
using Instory.API.DTOs.Story;
using Instory.API.DTOs.StoryDtos;
using Instory.API.Helpers;
using Instory.API.Models;
using Instory.API.Services.impl;
using Instory.API.Exceptions;
using Microsoft.EntityFrameworkCore;

namespace Instory.API.Services;

public class StoryService(InstoryDbContext db) : IStoryService 
{
    public async Task<PaginatedResult<StoryResponseDto>> GetAllAsync(int page, int pageSize)
    {
        var result = await db.Stories
            .AsNoTracking()
            .OrderBy(s => s.CreatedAt)
            .ToPaginatedResultAsync(page, pageSize);
            
        return result.Map(StoryResponseDto.FromEntity);    }

    public async Task<StoryResponseDto> GetByIdAsync(int id)
    {
        var story = await db.Stories
            .AsSingleQuery()
            .FirstOrDefaultAsync(story => story.Id == id);
        
        if (story == null)
            throw new NotFoundException("Story not found with id: " + id);
        
        return StoryResponseDto.FromEntity(story);
    }
    
    public async Task<StoryResponseDto> CreateAsync(CreateStoryDto dto)
    {
        var story = new Story
        {
            UserId = dto.UserId,
            MediaUrl = dto.MediaUrl,
            Caption = dto.Caption,
            ExpiresAt = DateTime.UtcNow.AddHours(24),
        };
            
        db.Stories.Add(story);
        await db.SaveChangesAsync();
        return StoryResponseDto.FromEntity(story);
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
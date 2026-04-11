using Instory.API.DTOs.Story;
using Instory.API.DTOs.StoryDtos;
using Instory.API.Exceptions;
using Instory.API.Helpers;
using Instory.API.Models;
using Instory.API.Repositories;

namespace Instory.API.Services.impl;

public class StoryService(IStoryRepository storyRepository) : IStoryService 
{
    public async Task<PaginatedResult<StoryResponseDto>> GetAllAsync(int page, int pageSize)
    {
        var result = await storyRepository.GetStoriesPaginatedAsync(page, pageSize);
            
        return result.Map(StoryResponseDto.FromEntity);
    }

    public async Task<StoryResponseDto> GetByIdAsync(int id)
    {
        var story = await storyRepository.GetByIdAsync(id);
        
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
            
        await storyRepository.AddAsync(story);
        await storyRepository.SaveChangesAsync();
        return StoryResponseDto.FromEntity(story);
    }

    public async Task<bool> DeleteByIdAsync(int id)
    {
        var story = await storyRepository.GetByIdAsync(id);
        if (story == null)
            return false;

        story.IsDeleted = true;
        await storyRepository.SaveChangesAsync();
        return true;
    }
}
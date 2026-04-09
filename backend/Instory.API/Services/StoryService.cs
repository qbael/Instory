using Instory.API.DTOs.Story;
using Instory.API.DTOs.StoryDtos;
using Instory.API.Helpers;
using Instory.API.Models;
using Instory.API.Repositories;
using Instory.API.Repositories.impl;
using Instory.API.Services.impl;

namespace Instory.API.Services;

public class StoryService(IStoryRepository repo) : IStoryService 
{
    public async Task<PaginatedResult<StoryResponseDto>> GetAllAsync(int page, int pageSize)
    {
        var result = await repo.GetAllAsync(page, pageSize);
        return result.Map(StoryResponseDto.FromEntity);
    }

    public async Task<StoryResponseDto> GetByIdAsync(int id)
    {
        var story =  await repo.GetByIdAsync(id);
        if (story == null)
            throw new Exception("Story not found");
        
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
        }
}
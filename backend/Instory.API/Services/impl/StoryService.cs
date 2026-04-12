using System;
using System.Threading.Tasks;
using Instory.API.DTOs.Story;
using Instory.API.DTOs.StoryDtos;
using Instory.API.Exceptions;
using Instory.API.Helpers;
using Instory.API.Models;
using Instory.API.Repositories;

namespace Instory.API.Services.impl;

public class StoryService: IStoryService 
{
    private readonly IStoryRepository _storyRepository;
    
    public StoryService(IStoryRepository storyRepository)
    {
        _storyRepository = storyRepository;
    }
    public async Task<PaginatedResult<StoryResponseDto>> GetAllAsync(int page, int pageSize)
    {
        var result = await _storyRepository.GetStoriesPaginatedAsync(page, pageSize);
            
        return result.Map(StoryResponseDto.FromEntity);
    }

    public async Task<StoryResponseDto> GetByIdAsync(int id)
    {
        var story = await _storyRepository.GetByIdAsync(id)
            ?? throw new NotFoundException($"Story not found with id: {id}");
        
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
            
        await _storyRepository.AddAsync(story);
        await _storyRepository.SaveChangesAsync();
        return StoryResponseDto.FromEntity(story);
    }

    public async Task DeleteByIdAsync(int id)
    {
        var story = await _storyRepository.GetByIdAsync(id)
            ?? throw new NotFoundException($"Story not found with id: {id}");

        story.IsDeleted = true;
        await _storyRepository.SaveChangesAsync();
    }
}
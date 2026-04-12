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
    public async Task<List<StoryGroupDto>> GetFeedAsync(int currentUserId)
    {
        var stories = await _storyRepository.GetFeedStoriesAsync();

        return stories
            .GroupBy(s => s.UserId)
            .Select(g =>
            {
                var u = g.First().User;
                var userDto = new StoryFeedUserDto(
                    u.Id, u.UserName!, u.Email, u.FullName, u.Bio, u.AvatarUrl,
                    u.CreatedAt, u.UpdatedAt
                );

                var items = g.Select(s => new StoryFeedItemDto(
                    s.Id,
                    s.UserId,
                    s.MediaUrl,
                    s.Caption,
                    s.ExpiresAt,
                    s.CreatedAt,
                    userDto,
                    s.StoryViews.Count,
                    s.StoryViews.Any(v => v.ViewerId == currentUserId)
                )).ToList();

                return new StoryGroupDto(userDto, items, items.Any(i => !i.IsViewed));
            })
            .ToList();
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
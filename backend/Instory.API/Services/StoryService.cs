using Instory.API.DTOs;
using Instory.API.Helpers;
using Instory.API.Models;
using Instory.API.Repositories;
using Instory.API.Services.impl;

namespace Instory.API.Services;

public class StoryService(IStoryRepository repo) : IStoryService 
{
    public async Task<PaginatedResult<StoryResponseDto>> GetAllAsync(int page, int pageSize)
    {
        var result = await repo.GetAllAsync(page, pageSize);
        return result.Map<StoryResponseDto>(StoryResponseDto.FromEntity);
    }

    public async Task<StoryResponseDto> GetByIdAsync(int id)
    {
        
    }

    public async Task<StoryRepository> CreateAsync(Story story)
    {
        
    }
}
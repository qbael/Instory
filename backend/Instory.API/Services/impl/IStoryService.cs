using Instory.API.DTOs.Story;
using Instory.API.Helpers;
using Instory.API.Models;

namespace Instory.API.Services.impl;

public interface IStoryService
{
    Task<PaginatedResult<StoryResponseDto>> GetAllAsync(int page, int pageSize);
    Task<StoryResponseDto?> GetByIdAsync(int id);
    Task<StoryResponseDto> CreateAsync(Story story);
    Task<bool> DeleteByIdAsync(int id);
}
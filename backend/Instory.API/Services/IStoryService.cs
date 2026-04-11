using Instory.API.DTOs.Story;
using Instory.API.DTOs.StoryDtos;
using Instory.API.Helpers;

namespace Instory.API.Services;

public interface IStoryService
{
    Task<PaginatedResult<StoryResponseDto>> GetAllAsync(int page, int pageSize);
    Task<StoryResponseDto> GetByIdAsync(int id);
    Task<StoryResponseDto> CreateAsync(CreateStoryDto dto);
    Task<bool> DeleteByIdAsync(int id);
}
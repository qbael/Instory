using System.Threading.Tasks;
using Instory.API.DTOs.Story;
using Instory.API.DTOs.StoryDtos;
using Instory.API.Helpers;

namespace Instory.API.Services;

public interface IStoryService
{
    Task<List<StoryGroupDto>> GetFeedAsync(int currentUserId);
    Task<StoryGroupDto?> GetUserStoriesAsync(int userId, int currentUserId);
    Task<PaginatedResult<StoryResponseDto>> GetAllAsync(int page, int pageSize);
    Task<StoryResponseDto> GetByIdAsync(int id);
    Task<StoryResponseDto> CreateAsync(CreateStoryDto dto, int currentUserId);
    Task<PaginatedResult<StoryResponseDto>> GetArchiveAsync(int userId, int page, int pageSize);
    Task DeleteByIdAsync(int id, int currentUserId);
    Task MarkViewedAsync(int storyId, int currentUserId);
}

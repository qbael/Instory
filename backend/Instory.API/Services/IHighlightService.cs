using System.Collections.Generic;
using System.Threading.Tasks;
using Instory.API.DTOs.HighlightDtos;

namespace Instory.API.Services;

public interface IHighlightService
{
    Task<List<HighlightResponseDto>> GetByUserIdAsync(int userId);
    Task<HighlightResponseDto> CreateAsync(CreateHighlightDto dto, int currentUserId);
    Task<HighlightResponseDto> AddStoryAsync(int highlightId, int storyId, int currentUserId);
    Task RemoveStoryAsync(int highlightId, int storyId, int currentUserId);
    Task DeleteAsync(int highlightId, int currentUserId);
}

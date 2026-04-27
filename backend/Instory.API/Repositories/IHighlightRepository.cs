using System.Collections.Generic;
using System.Threading.Tasks;
using Instory.API.Models;

namespace Instory.API.Repositories;

public interface IHighlightRepository : IRepository<StoryHighlight>
{
    Task<List<StoryHighlight>> GetByUserIdAsync(int userId);
    Task<StoryHighlight?> GetByIdWithStoriesAsync(int id);
    Task AddStoryAsync(StoryHighlightStory item);
    Task<StoryHighlightStory?> FindStoryHighlightAsync(int highlightId, int storyId);
    void RemoveStory(StoryHighlightStory item);
}

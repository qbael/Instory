using Instory.API.DTOs.Story;
using Microsoft.AspNetCore.Mvc;

namespace Instory.API.Controllers;

[ApiController]
[Route("api/v1/story")]
public class StoryController(IStory)
{
    private readonly StoryManager _storyManager;

    [HttpPost("post")]
    public async Task<IActionResult> PostStory([FromBody] CreateStoryDto dto)
    {
        var story = await 
    }
}
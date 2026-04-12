using System.Security.Claims;
using Instory.API.DTOs.Story;
using Instory.API.DTOs.StoryDtos;
using Instory.API.Helpers;
using Instory.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Instory.API.Controllers;

[ApiController]
[Route("/api/v1/story")]
public class StoryController : ControllerBase
{
    private readonly IStoryService _storyService;

    public StoryController(IStoryService storyService)
    {
        _storyService = storyService;
    }

    [HttpGet]
    [Authorize]
    public async Task<IActionResult> GetFeed()
    {
        var currentUserId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var result = await _storyService.GetFeedAsync(currentUserId);
        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var result = await _storyService.GetByIdAsync(id);
        return Ok(result);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateStoryDto dto)
    {
        var result = await _storyService.CreateAsync(dto);
        return Ok(result);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        await _storyService.DeleteByIdAsync(id);
        return NoContent();
    }
}

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
    [Authorize]
    public async Task<IActionResult> GetById(int id)
    {
        var result = await _storyService.GetByIdAsync(id);
        return Ok(result);
    }

    [HttpPost]
    [Authorize]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> Create([FromForm] CreateStoryDto dto)
    {
        var currentUserId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var result = await _storyService.CreateAsync(dto, currentUserId);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
    }

    [HttpGet("archive")]
    [Authorize]
    public async Task<IActionResult> GetArchive([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var currentUserId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var result = await _storyService.GetArchiveAsync(currentUserId, page, pageSize);
        return Ok(result);
    }

    [HttpDelete("{id}")]
    [Authorize]
    public async Task<IActionResult> Delete(int id)
    {
        var currentUserId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        await _storyService.DeleteByIdAsync(id, currentUserId);
        return NoContent();
    }
}

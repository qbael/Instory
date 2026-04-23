using System.Security.Claims;
using Instory.API.DTOs.HighlightDtos;
using Instory.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Instory.API.Controllers;

[ApiController]
[Route("/api/v1/highlights")]
[Authorize]
public class HighlightController : ControllerBase
{
    private readonly IHighlightService _highlightService;

    public HighlightController(IHighlightService highlightService)
    {
        _highlightService = highlightService;
    }

    [HttpGet]
    public async Task<IActionResult> GetByUserId([FromQuery] int userId)
    {
        var result = await _highlightService.GetByUserIdAsync(userId);
        return Ok(result);
    }

    [HttpPost]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> Create([FromForm] CreateHighlightDto dto)
    {
        var currentUserId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var result = await _highlightService.CreateAsync(dto, currentUserId);
        return CreatedAtAction(nameof(GetByUserId), new { userId = currentUserId }, result);
    }

    [HttpPost("{id}/stories")]
    public async Task<IActionResult> AddStory(int id, [FromBody] AddStoryToHighlightDto dto)
    {
        var currentUserId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var result = await _highlightService.AddStoryAsync(id, dto.StoryId, currentUserId);
        return Ok(result);
    }

    [HttpDelete("{id}/stories/{storyId}")]
    public async Task<IActionResult> RemoveStory(int id, int storyId)
    {
        var currentUserId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        await _highlightService.RemoveStoryAsync(id, storyId, currentUserId);
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var currentUserId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        await _highlightService.DeleteAsync(id, currentUserId);
        return NoContent();
    }
}

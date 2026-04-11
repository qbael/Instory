using Instory.API.DTOs.Story;
using Instory.API.Services;
using Microsoft.AspNetCore.Mvc;

namespace Instory.API.Controllers;

[ApiController]
[Route("/api/v1/story")]
public class StoryController(IStoryService service) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] int page = 1, [FromQuery] int pageSize = 10)
    {
        var result = await service.GetAllAsync(page, pageSize);
        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var result = await service.GetByIdAsync(id);
        return Ok(result);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateStoryDto dto)
    {
        var result = await service.CreateAsync(dto);
        return Ok(result);
    }

	[HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        await service.DeleteByIdAsync(id);
        return NoContent();
    }
}
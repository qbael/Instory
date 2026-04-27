using Instory.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Instory.API.Controllers;

[ApiController]
[Route("api/v1/search")]
[Authorize]
public class SearchController : ControllerBase
{
    private readonly ISearchService _searchService;

    public SearchController(ISearchService searchService)
    {
        _searchService = searchService;
    }

    [HttpGet("users")]
    public async Task<IActionResult> SearchUsers([FromQuery] string? query)
    {
        if (string.IsNullOrWhiteSpace(query))
            return BadRequest("Query không được để trống.");

        var result = await _searchService.SearchUsersAsync(query.Trim());
        return Ok(result);
    }
}
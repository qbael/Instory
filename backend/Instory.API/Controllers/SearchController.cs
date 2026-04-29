using Instory.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Instory.API.Controllers;

[ApiController]
[Route("api/v1/search")]
// [Authorize]
public class SearchController : ControllerBase
{
    private readonly ISearchService _searchService;

    private readonly IHashtagService _hashtagService;

    public SearchController(ISearchService searchService, IHashtagService hashtagService)
    {
        _searchService = searchService;
        _hashtagService = hashtagService;
    }

    [HttpGet("users")]
    public async Task<IActionResult> SearchUsers([FromQuery] string? query)
    {
        if (string.IsNullOrWhiteSpace(query))
            return BadRequest("Query không được để trống.");

        var result = await _searchService.SearchUsersAsync(query.Trim());
        return Ok(result);
    }

    [HttpGet("hashtags")]
    public async Task<IActionResult> SearchHashtags([FromQuery] string? query)
    {
        if (string.IsNullOrWhiteSpace(query))
            return BadRequest("Query không được để trống.");

        var result = await _hashtagService.SearchHashtagsAsync(query.Trim());
        return Ok(result);
    }

    [HttpGet("posts")]
    public async Task<IActionResult> SearchPosts([FromQuery] string? query)
    {
        if (string.IsNullOrWhiteSpace(query))
            return BadRequest("Query không được để trống.");

        var result = await _searchService.SearchPostsAsync(query.Trim());
        return Ok(result);
    }
}
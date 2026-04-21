using Microsoft.AspNetCore.Mvc;

namespace Instory.API.Controllers;

[ApiController]
[Route("api/v1/hashtags")]

public class HashtagController : ControllerBase
{
    private readonly IHashtagService _hashtagService;

    public HashtagController(IHashtagService hashtagService)
    {
        _hashtagService = hashtagService;
    }

    //api/v1/hashtags/trending?top=10
    [HttpGet("trending")]
    public async Task<IActionResult> GetTrendingHashtags([FromQuery] int top = 10)
    {
        var result = await _hashtagService.GetTrendingHashtagsAsync(top);
        return Ok(result);
    }
}
using Instory.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Instory.API.Controllers;

[ApiController]
[Route("api/v1/users")]
[Authorize]
public class UserController : ControllerBase
{
    private readonly IPostService _postService;
    private readonly ISharePostService _sharePostService;

    public UserController(IPostService postService, ISharePostService sharePostService)
    {
        _postService = postService;
        _sharePostService = sharePostService;
    }

    [HttpGet("{userId}/posts")]
    public async Task<IActionResult> GetUserPosts(
        int userId,
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 10)
    {
        var currentUserId = User.GetUserId();
        var result = await _postService.GetUserPostsAsync(userId, currentUserId, pageNumber, pageSize);
        return Ok(result);
    }

    [HttpGet("{userId}/liked-posts")]
    public async Task<IActionResult> GetUserLikedPosts(
        int userId,
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 10)
    {
        var currentUserId = User.GetUserId();
        var result = await _postService.GetUserLikedPostsAsync(userId, currentUserId, pageNumber, pageSize);
        return Ok(result);
    }

    [HttpGet("{userId}/shared-posts")]
    public async Task<IActionResult> GetUserSharedPosts(
        int userId,
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 10)
    {
        var currentUserId = User.GetUserId();
        var result = await _sharePostService.GetUserSharedPostsAsync(userId, currentUserId, pageNumber, pageSize);
        return Ok(result);
    }
}

using System.Security.Claims;
using Instory.API.DTOs;
using Instory.API.Services;
using Microsoft.AspNetCore.Mvc;

namespace Instory.API.Controllers;

[ApiController]
[Route("api/v1/posts")]

public class PostController : ControllerBase
{
    private readonly IPostService _postService;

    public PostController(IPostService postService)
    {
        _postService = postService;
    }


    [HttpGet("feed")]
    public async Task<IActionResult> getFeed(
    [FromQuery] int pageNumber = 1,
    [FromQuery] int pageSize = 10)
    {
        var currentUserId = User.GetUserId();

        var result = await _postService.GetAllPostsAsync(currentUserId, pageNumber, pageSize);

        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var result = await _postService.GetPostByIdAsync(id);
        if (result == null)
        {
            return NotFound();
        }
        return Ok(result);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromForm] CreatePostRequestDTO request)
    {
        var userId = User.GetUserId();
        var result = await _postService.CreatePostAsync(userId, request);

        return Ok(result);
    }
}
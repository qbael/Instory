using System.Security.Claims;
using Instory.API.DTOs;
using Instory.API.Services;
using Microsoft.AspNetCore.Mvc;

namespace Instory.API.Controllers;

[ApiController]
[Route("/api/v1/posts")]

public class PostController : ControllerBase
{
    private readonly IPostService _postService;

    public PostController(IPostService postService)
    {
        _postService = postService;
    }


    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var currentUserId = User.GetUserId();
        var result = await _postService.GetAllPostsAsync(currentUserId);
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
    public async Task<IActionResult> Create([FromBody] CreatePostRequestDTO request)
    {
        // var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        var result = await _postService.CreatePostAsync(request.UserId, request);

        return Ok(result);
    }
}
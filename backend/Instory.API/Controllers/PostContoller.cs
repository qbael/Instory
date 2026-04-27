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
    public async Task<IActionResult> GetDetailByPostId(int id)
    {
        try
        {
            var userId = User.GetUserId();

            var result = await _postService.GetPostDetailByPostId(id, userId);

            // return Ok(new
            // {
            //     message = "Lấy chi tiết bài viết thành công",
            //     data = result
            // });
            return Ok(result);
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(StatusCodes.Status403Forbidden, new
            {
                message = ex.Message
            });
        }
        catch (Exception)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new
            {
                message = "Đã xảy ra lỗi hệ thống"
            });
        }
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromForm] CreatePostRequestDTO request)
    {
        // THÊM DÒNG NÀY ĐỂ DEBUG:
        Console.WriteLine($"======= SỐ LƯỢNG ẢNH NHẬN ĐƯỢC: {request.Images?.Count ?? 0} =======");
        var userId = User.GetUserId();
        Console.WriteLine($"========== USER ID LẤY ĐƯỢC TỪ TOKEN LÀ: {userId} ==========");
        var result = await _postService.CreatePostAsync(userId, request);

        return Ok(result);
        // return Ok(new { Message = "Tính năng tạo bài viết đang được phát triển. Vui lòng thử lại sau!" });
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var userId = User.GetUserId();
        var success = await _postService.DeletePostAsync(userId, id);
        if (!success)
        {
            return NotFound();
        }
        return NoContent();
    }

    [HttpGet("search")]
    public async Task<IActionResult> SearchByHashtag(
        [FromQuery] string hashtag,
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 10)
    {
        var currentUserId = User.GetUserId();
        var result = await _postService.GetPostsByHashtagAsync(currentUserId, hashtag, pageNumber, pageSize);
        return Ok(result);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromForm] UpdatePostRequestDTO request)
    {
        var userId = User.GetUserId();
        var result = await _postService.UpdatePostAsync(id, userId, request);
        if (result == null)
        {
            return NotFound();
        }
        return Ok(result);
    }
}
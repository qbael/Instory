using Instory.API.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

[ApiController]
[Route("/api/v1/posts/{postId}")]
public class LikeController : ControllerBase
{
    private readonly ILikeService _likeService;

    public LikeController(ILikeService likeService)
    {
        _likeService = likeService;
    }

    // [HttpPost("like")]
    // public async Task<IActionResult> Like(int postId, [FromBody] int userId)
    // {
    //     var result = await _likeService.ToggleLikeAsync(postId, userId);

    //     if (!result) return NotFound(new ServiceResponse<string> { Success = false, Message = "Không tìm thấy bài viết" });

    //     return Ok(new ServiceResponse<string> { Success = true, Message = "Đã thích bài viết" });
    // }
    [Authorize] // require login
    [HttpPost("like")]
    public async Task<IActionResult> Like(int postId)
    {
        var userId = User.GetUserId();

        var result = await _likeService.ToggleLikeAsync(postId, userId);

        if (!result) return NotFound(new ServiceResponse<string> { Success = false, Message = "Không tìm thấy bài viết" });

        return Ok(new ServiceResponse<string> { Success = true, Message = "Đã thích bài viết" });
    }
    [Authorize] // require login
    [HttpDelete("like")]
    public async Task<IActionResult> Unlike(int postId)
    {
        var userId = User.GetUserId();

        var result = await _likeService.ToggleLikeAsync(postId, userId);

        if (!result)
            return NotFound(new ServiceResponse<string> { Success = false, Message = "Không tìm thấy bài viết" });

        return Ok(new ServiceResponse<string> { Success = true, Message = "Đã bỏ thích bài viết" });
    }
}
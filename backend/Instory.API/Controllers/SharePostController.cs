using System.Security.Claims;
using Instory.API.DTOs;
using Instory.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Instory.API.Controllers;

[ApiController]
[Route("api/v1/share-post")]

public class SharePostController : ControllerBase
{
    private readonly ISharePostService _sharePostService;

    public SharePostController(ISharePostService sharePostService)
    {
        _sharePostService = sharePostService;
    }
    [Authorize]
    [HttpPost("{postId}")]
    public async Task<IActionResult> SharePost(int postId, [FromBody] SharePostDto dto)
    {
        try
        {
            var userId = User.GetUserId();
            await _sharePostService.SharePostAsync(postId, userId, dto);
            return Ok(new
            {
                message = "Chia sẻ bài viết thành công"
            });
        }
        catch (Exception ex)
        {
            return BadRequest(new
            {
                message = ex.Message
            });
        }
    }
}
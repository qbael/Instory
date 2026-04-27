using System.Security.Claims;
using Instory.API.DTOs;
using Instory.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Instory.API.Controllers;

[ApiController]
[Route("api/v1/reports")]

public class PostReportController : ControllerBase
{
    private readonly IPostReportService _postReportService;

    public PostReportController(IPostReportService postReportService)
    {
        _postReportService = postReportService;
    }

    [HttpGet("reasons")]
    public async Task<IActionResult> GetReasons()
    {
        var reasons = await _postReportService.GetReasonsAsync();
        return Ok(reasons);
    }

    [Authorize]
    [HttpPost("{postId}")]
    public async Task<IActionResult> ReportPost(
    int postId,
    [FromBody] CreatePostReportDto dto)
    {
        try
        {
            var userId = int.Parse(
            User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

            await _postReportService.ReportPostAsync(
                postId,
                userId,
                dto);

            return Ok(new
            {
                message = "Báo cáo bài viết thành công"
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
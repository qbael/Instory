using System.Threading.Tasks;
using Instory.API.DTOs.Admin;
using Instory.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Instory.API.Controllers;

[ApiController]
[Route("api/v1/admin")]
[Authorize(Roles = "Admin")]
public class AdminController : ControllerBase
{
    private readonly IAdminService _adminService;

    public AdminController(IAdminService adminService)
    {
        _adminService = adminService;
    }

    // ─── Users ────────────────────────────────────────────────────────────────

    [HttpGet("users")]
    public async Task<IActionResult> GetUsers(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? search = null)
    {
        var users = await _adminService.GetUsersAsync(pageNumber, pageSize, search);
        return Ok(users);
    }

    [HttpPost("users/{userId}/promote")]
    public async Task<IActionResult> PromoteToAdmin(int userId)
    {
        await _adminService.PromoteToAdminAsync(userId);
        return Ok(new { message = "Đã cấp quyền Admin thành công" });
    }

    [HttpPost("users/{userId}/toggle-block")]
    public async Task<IActionResult> ToggleBlockUser(int userId)
    {
        await _adminService.ToggleUserBlockAsync(userId);
        return Ok(new { message = "Cập nhật trạng thái người dùng thành công" });
    }

    // ─── Reports ──────────────────────────────────────────────────────────────

    [HttpGet("reports")]
    public async Task<IActionResult> GetReports(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 50)
    {
        var reports = await _adminService.GetReportsAsync(pageNumber, pageSize);
        return Ok(reports);
    }

    [HttpPut("reports/{reportId}/resolve")]
    public async Task<IActionResult> ResolveReport(int reportId, [FromBody] ResolveReportDto dto)
    {
        await _adminService.ResolveReportAsync(reportId, dto.Action);
        return Ok(new { message = "Đã xử lý báo cáo" });
    }

    // ─── Report Reasons ────────────────────────────────────────────────────────

    [HttpGet("report-reasons")]
    public async Task<IActionResult> GetReportReasons()
    {
        var reasons = await _adminService.GetReportReasonsAsync();
        return Ok(reasons);
    }

    [HttpPost("report-reasons")]
    public async Task<IActionResult> CreateReportReason([FromBody] CreateReportReasonDto dto)
    {
        var created = await _adminService.CreateReportReasonAsync(dto);
        return Ok(created);
    }

    [HttpDelete("report-reasons/{reasonId}")]
    public async Task<IActionResult> DeleteReportReason(int reasonId)
    {
        await _adminService.DeleteReportReasonAsync(reasonId);
        return Ok(new { message = "Đã xóa lý do báo cáo" });
    }

    // ─── Posts ────────────────────────────────────────────────────────────────

    [HttpGet("posts")]
    public async Task<IActionResult> GetPosts(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? search = null)
    {
        var posts = await _adminService.GetPostsAsync(pageNumber, pageSize, search);
        return Ok(posts);
    }

    [HttpDelete("posts/{postId}")]
    public async Task<IActionResult> DeletePost(int postId)
    {
        await _adminService.DeletePostAsync(postId);
        return Ok(new { message = "Đã xóa bài viết thành công" });
    }
}

using Microsoft.AspNetCore.Mvc;
using Instory.API.DTOs;
using Instory.API.Services;
using Microsoft.AspNetCore.Authorization;

namespace Instory.API.Controllers;

[ApiController]
[Route("api/v1/posts/{postId}/comments")]
public class CommentsController : ControllerBase
{
    private readonly ICommentService _commentService;

    public CommentsController(ICommentService commentService)
    {
        _commentService = commentService;
    }

    //Get    
    [HttpGet]
    public async Task<IActionResult> GetComments(
        int postId,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10)
    {
        // Validate cơ bản
        if (page < 1 || pageSize < 1)
        {
            return BadRequest("Page và PageSize phải lớn hơn 0.");
        }

        // Gọi Service
        var result = await _commentService.GetCommentsAsync(postId, page, pageSize);

        return Ok(result);
    }

    // POST: api/v1/posts/1/comments
    [Authorize] // require login
    [HttpPost]
    public async Task<IActionResult> AddComment(int postId, [FromBody] CreateCommentRequestDTO dto)
    {
        var userId = User.GetUserId();

        var request = new CreateCommentRequestDTO
        {
            Content = dto.Content
        };

        var result = await _commentService.AddCommentAsync(userId, postId, request);

        return Ok(new ServiceResponse<CommentResponseDTO>
        {
            Success = true,
            Data = result,
            Message = "Bình luận thành công"
        });
    }

    // DELETE: api/v1/posts/1/comments/5
    [Authorize] // require login
    [HttpDelete("{commentId}")]
    public async Task<IActionResult> DeleteComment(int commentId)
    {
        var userId = User.GetUserId();

        var result = await _commentService.DeleteCommentAsync(commentId, userId);

        if (!result)
        {
            return BadRequest(new ServiceResponse<string>
            {
                Success = false,
                Message = "Không thể xóa bình luận. Bạn không có quyền hoặc bình luận không tồn tại."
            });
        }

        return Ok(new ServiceResponse<string>
        {
            Success = true,
            Message = "Đã xóa bình luận"
        });
    }
}
using Microsoft.AspNetCore.Mvc;
using Instory.API.DTOs;
using Instory.API.Services;
using Microsoft.AspNetCore.Authorization;

namespace Instory.API.Controllers;

[ApiController]
[Route("api/v1/posts/comments")]
public class CommentsController : ControllerBase
{
    private readonly ICommentService _commentService;

    public CommentsController(ICommentService commentService)
    {
        _commentService = commentService;
    }

    // POST: api/v1/posts/1/comments
    [Authorize] // require login
    [HttpPost]
    public async Task<IActionResult> AddComment(int postId, [FromBody] CreateCommentRequestDTO dto)
    {
        var userId = User.GetUserId();

        var request = new CreateCommentRequestDTO
        {
            PostId = postId,
            Content = dto.Content
        };

        var result = await _commentService.AddCommentAsync(userId, request);

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
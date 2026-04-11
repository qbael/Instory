namespace Instory.API.DTOs;

public class PostResponseDTO
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public string? Content { get; set; }
    public string? ImageUrl { get; set; }
    public int LikeCount { get; set; }
    public int CommentCount { get; set; }
    public int ShareCount { get; set; }
    public DateTime CreatedAt { get; set; } // Giả định có từ BaseEntity
}
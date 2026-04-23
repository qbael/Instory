using Instory.API.Models;

namespace Instory.API.DTOs;

public class PostResponseDTO
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public string? Content { get; set; }
    public int LikesCount { get; set; }
    public int CommentsCount { get; set; }
    public int SharesCount { get; set; }
    public DateTime CreatedAt { get; set; } // Giả định có từ BaseEntity
    public bool IsLiked { get; set; } = false;
    public UserDTO User { get; set; } = null!;
    public List<PostImageDTO> Images
    { get; set; } = new List<PostImageDTO>();
}
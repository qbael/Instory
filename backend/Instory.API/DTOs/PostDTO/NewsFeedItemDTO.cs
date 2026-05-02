using Instory.API.DTOs;

public class NewsFeedItemDTO
{
    public required string FeedType { get; set; } // "POST" hoặc "SHARE"
    public DateTime FeedCreatedAt { get; set; }

    // Thông tin của hành động share (sẽ null nếu là bài POST thường)
    public int? ShareId { get; set; }
    public string? ShareCaption { get; set; }
    public UserDTO? Sharer { get; set; }

    // Bài viết gốc
    public required PostResponseDTO Post { get; set; }
}
namespace Instory.API.DTOs;

public class CreatePostRequestDTO
{
    public int UserId { get; set; }
    public string? Content { get; set; }
    public string? ImageUrl { get; set; }
    public bool AllowComment { get; set; } = true;

    public List<IFormFile> Images { get; set; }
}
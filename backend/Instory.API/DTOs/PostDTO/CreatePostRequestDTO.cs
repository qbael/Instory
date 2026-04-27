namespace Instory.API.DTOs;

public class CreatePostRequestDTO
{
    // public int UserId { get; set; }
    public string? Content { get; set; }
    public bool AllowComment { get; set; } = true;

    public List<IFormFile>? Images { get; set; } = new List<IFormFile>();
}
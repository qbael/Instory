namespace Instory.API.DTOs;

public class CreatePostRequestDTO
{
    public string? Content { get; set; }
    public string? ImageUrl { get; set; }
    public bool AllowComment { get; set; } = true;
}
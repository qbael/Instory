namespace Instory.API.DTOs.Story;
using System.ComponentModel.DataAnnotations;

public class CreateStoryDto
{
    [Required] public int UserId { get; set; }

    [MaxLength(255)] public string? MediaUrl { get; set; }

    public string? Caption { get; set; }

    public DateTime ExpiresAt { get; set; }
}
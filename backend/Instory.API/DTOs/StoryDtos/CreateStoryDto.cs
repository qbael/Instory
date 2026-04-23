using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Http;

namespace Instory.API.DTOs.Story;

public class CreateStoryDto
{
    [Required]
    public IFormFile File { get; set; } = null!;

    public string? Caption { get; set; }

    public int? HighlightId { get; set; }
}

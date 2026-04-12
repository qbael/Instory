namespace Instory.API.DTOs.Story;
using System.ComponentModel.DataAnnotations;

public record CreateStoryDto(
    [Required] int UserId,
    [MaxLength(255)] string? MediaUrl,
    string? Caption
);
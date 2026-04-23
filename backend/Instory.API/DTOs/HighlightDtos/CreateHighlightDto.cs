using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Http;

namespace Instory.API.DTOs.HighlightDtos;

public class CreateHighlightDto
{
    [Required]
    [MaxLength(100)]
    public string Title { get; set; } = string.Empty;

    public IFormFile? Cover { get; set; }
}

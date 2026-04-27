using System.ComponentModel.DataAnnotations;

namespace Instory.API.DTOs;

public class CreatePostReportDto
{
    [Required]
    public int ReasonId { get; set; }

    [MaxLength(500)]
    public string? ReasonDetail { get; set; }
}
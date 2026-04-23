using System.ComponentModel.DataAnnotations;

namespace Instory.API.DTOs.Profile;

public class UpdateProfileDto
{
    [MaxLength(100)]
    public string? FullName { get; set; }

    public string? Bio { get; set; }

    [MaxLength(255)]
    public string? AvatarUrl { get; set; }

    [MaxLength(256)]
    public string? UserName { get; set; }
}
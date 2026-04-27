using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Http;

namespace Instory.API.DTOs.Profile;

public class UpdateProfileDto
{
    [MaxLength(100)]
    public string? FullName { get; set; }

    public string? Bio { get; set; }

    [MaxLength(256)]
    public string? UserName { get; set; }

    public IFormFile? Avatar { get; set; }
}
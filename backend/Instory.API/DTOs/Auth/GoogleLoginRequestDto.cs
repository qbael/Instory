using System.ComponentModel.DataAnnotations;

namespace Instory.API.DTOs.Auth;

public class GoogleLoginRequestDto
{
    [Required]
    public string IdToken { get; set; } = string.Empty;
}

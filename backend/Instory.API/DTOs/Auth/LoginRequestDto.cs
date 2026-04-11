using System.ComponentModel.DataAnnotations;

namespace Instory.API.DTOs.Auth;

    public class LoginRequestDto
    {
        [Required]
        public string UsernameOrEmail { get; set; } = null!;

        [Required]
        public string Password { get; set; } = null!;
    }

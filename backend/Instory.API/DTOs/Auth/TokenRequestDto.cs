using System.ComponentModel.DataAnnotations;

namespace Instory.API.DTOs.Auth;

    public class TokenRequestDto
    {
        [Required]
        public string Token { get; set; } = null!;

        [Required]
        public string RefreshToken { get; set; } = null!;
    }

using Instory.API.Models;

namespace Instory.API.DTOs.Auth;

public record LoginDto
{
    public string Token { get; init; } = null!;
    public string RefreshToken { get; init; } = null!;
    public User User { get; init; } = null!;
    public int RefreshTokenValidityInDays { get; init; }
    public IList<string> Roles { get; init; } = new List<string>();
}
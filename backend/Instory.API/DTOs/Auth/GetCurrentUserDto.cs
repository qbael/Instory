using Instory.API.Models;

namespace Instory.API.DTOs.Auth;

public record GetCurrentUserDto
{
    public User user { get; init; } = null!;
    public IList<string> Roles { get; init; } = new List<string>();
}
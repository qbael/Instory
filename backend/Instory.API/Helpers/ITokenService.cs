using Instory.API.Models;

namespace Instory.API.Helpers;

public interface ITokenService
{
    Task<string> GenerateTokenAsync(User user);
    string GenerateRefreshToken();
}

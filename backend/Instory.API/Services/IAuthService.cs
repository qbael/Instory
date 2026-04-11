using Instory.API.DTOs;
using Instory.API.DTOs.Auth;
using Instory.API.Models;

namespace Instory.API.Services;

public interface IAuthService
{
    Task<ServiceResponse<bool>> RegisterAsync(RegisterRequestDto model);
    Task<ServiceResponse<LoginDto>> LoginAsync(LoginRequestDto model);
    Task<ServiceResponse<LoginDto>> RefreshTokenAsync(string refreshToken);
    Task<ServiceResponse<User>> GetCurrentUserAsync(string userName);
}
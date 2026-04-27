using System.Threading.Tasks;
using Instory.API.DTOs;
using Instory.API.DTOs.Auth;
using Instory.API.Models;

namespace Instory.API.Services;

public interface IAuthService
{
    Task<ServiceResponse<bool>> RegisterAsync(RegisterRequestDto model);
    Task<ServiceResponse<LoginDto>> LoginAsync(LoginRequestDto model);
    Task<ServiceResponse<bool>> SendSignupOtpAsync(SendOtpRequestDto model);
    Task<ServiceResponse<bool>> VerifySignupOtpAsync(VerifyOtpRequestDto model);
    Task<ServiceResponse<LoginDto>> GoogleLoginAsync(GoogleLoginRequestDto model);
    Task<ServiceResponse<LoginDto>> RefreshTokenAsync(string refreshToken);
    Task<ServiceResponse<User>> GetCurrentUserAsync(string userName);
}
using Instory.API.DTOs.Auth;
using Instory.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Instory.API.Controllers;

[ApiController]
[Route("/api/v1/auth")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly IConfiguration _configuration;
    
    public AuthController(IAuthService authService, IConfiguration configuration)
    {
        _authService = authService;
        _configuration = configuration;
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequestDto model)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var result = await _authService.RegisterAsync(model);
        
        return StatusCode(result.StatusCode, new { result.Message });
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequestDto model)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var result = await _authService.LoginAsync(model);
        if (!result.Success) return StatusCode(result.StatusCode, new { result.Message });

        AppendTokenCookies(result.Data!.Token, result.Data.RefreshToken, result.Data.RefreshTokenValidityInDays);

        return Ok(new LoginResponseDto()
        {
            Message = result.Message,
            UserId = result.Data.User.Id,
            Username = result.Data.User.UserName!,
            Email = result.Data.User.Email!,
            Roles = result.Data.Roles
        });
    }

    [HttpPost("signin-google")]
    public async Task<IActionResult> GoogleLogin([FromBody] GoogleLoginRequestDto model)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var result = await _authService.GoogleLoginAsync(model);
        if (!result.Success) return StatusCode(result.StatusCode, new { result.Message });

        AppendTokenCookies(result.Data!.Token, result.Data.RefreshToken, result.Data.RefreshTokenValidityInDays);

        return Ok(new LoginResponseDto()
        {
            Message = result.Message,
            UserId = result.Data.User.Id,
            Username = result.Data.User.UserName!,
            Email = result.Data.User.Email!
        });
    }

    [HttpPost("signup/send-otp")]
    public async Task<IActionResult> SendSignupOtp([FromBody] SendOtpRequestDto model)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var result = await _authService.SendSignupOtpAsync(model);
        return StatusCode(result.StatusCode, new { result.Message });
    }

    [HttpPost("signup/verify-otp")]
    public async Task<IActionResult> VerifySignupOtp([FromBody] VerifyOtpRequestDto model)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var result = await _authService.VerifySignupOtpAsync(model);
        return StatusCode(result.StatusCode, new { result.Message });
    }

    [HttpPost("refresh")]
    public async Task<IActionResult> RefreshToken()
    {
        var refreshToken = Request.Cookies["refreshToken"];
        if (string.IsNullOrEmpty(refreshToken))
            return BadRequest(new { Message = "Invalid client request" });

        var result = await _authService.RefreshTokenAsync(refreshToken);
        if (!result.Success) return StatusCode(result.StatusCode, new { result.Message });
        
        AppendTokenCookies(result.Data!.Token, result.Data.RefreshToken, result.Data.RefreshTokenValidityInDays);

        return Ok(new LoginResponseDto()
        {
            Message = result.Message,
            UserId = result.Data.User.Id,
            Username = result.Data.User.UserName!,
            Email = result.Data.User.Email!
        });
    }
    
    [Authorize]
    [HttpGet("me")]
    public async Task<IActionResult> GetCurrentUser()
    {
        var userName = User.Identity?.Name;
        if (string.IsNullOrEmpty(userName)) return Unauthorized();
        
        var result = await _authService.GetCurrentUserAsync(userName);
        if (!result.Success) return StatusCode(result.StatusCode, new { result.Message });
        
        return Ok(new
        {
            result.Data!.user.Id,
            result.Data.user.UserName,
            result.Data.user.Email,
            result.Data.user.FullName,
            result.Data.user.Bio,
            result.Data.user.AvatarUrl,
            result.Data.Roles
        });
    }

    [Authorize]
    [HttpPost("logout")]
    public async Task<IActionResult> Logout()
    {
        Response.Cookies.Delete("jwt");
        Response.Cookies.Delete("refreshToken");
        return Ok(new { Message = "Logged out successfully" });
    }

    private void AppendTokenCookies(string jwt, string refreshToken, int refreshTokenValidityInDays)
    {
        int.TryParse(_configuration["JwtSettings:ExpirationMinutes"] ?? "4320", out int expirationMinutes);
        var isDevelopment = _configuration["ASPNETCORE_ENVIRONMENT"] == "Development"
                            || Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") == "Development";

        var cookieOptions = new CookieOptions
        {
            HttpOnly = true,
            Secure = !isDevelopment,
            SameSite = isDevelopment ? SameSiteMode.Lax : SameSiteMode.Strict,
            Expires = DateTime.UtcNow.AddMinutes(expirationMinutes)
        };

        Response.Cookies.Append("jwt", jwt, cookieOptions);

        var refreshCookieOptions = new CookieOptions
        {
            HttpOnly = true,
            Secure = !isDevelopment,
            SameSite = isDevelopment ? SameSiteMode.Lax : SameSiteMode.Strict,
            Expires = DateTime.UtcNow.AddDays(refreshTokenValidityInDays)
        };

        Response.Cookies.Append("refreshToken", refreshToken, refreshCookieOptions);
    }
}

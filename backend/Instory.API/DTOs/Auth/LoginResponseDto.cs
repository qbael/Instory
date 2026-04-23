namespace Instory.API.DTOs.Auth;

public class LoginResponseDto
{
    public string Message { get; set; } = string.Empty;
    public int UserId { get; set; }
    public string Username { get; set; } = null!;
    public string Email { get; set; } = null!;
}
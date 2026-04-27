using System.Security.Cryptography;
using System.Text;
using Google.Apis.Auth;
using Instory.API.DTOs;
using Instory.API.DTOs.Auth;
using Instory.API.Helpers;
using Instory.API.Models;
using Instory.API.Repositories;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace Instory.API.Services.impl;

public class AuthService : IAuthService
{
    private readonly UserManager<User> _userManager;
    private readonly RoleManager<Role> _roleManager;
    private readonly ITokenService _tokenService;
    private readonly IConfiguration _configuration;
    private readonly IUserRepository _userRepository;
    private readonly IEmailOtpRepository _emailOtpRepository;
    private readonly IEmailSender _emailSender;
    private readonly IPasswordHasher<User> _passwordHasher;
    
    public AuthService(
        UserManager<User> userManager,
        RoleManager<Role> roleManager,
        ITokenService tokenService,
        IConfiguration configuration,
        IUserRepository userRepository,
        IEmailOtpRepository emailOtpRepository,
        IEmailSender emailSender,
        IPasswordHasher<User> passwordHasher)
    {
        _userManager = userManager;
        _roleManager = roleManager;
        _tokenService = tokenService;
        _configuration = configuration;
        _userRepository = userRepository;
        _emailOtpRepository = emailOtpRepository;
        _emailSender = emailSender;
        _passwordHasher = passwordHasher;
    }
    
    public async Task<ServiceResponse<bool>> RegisterAsync(RegisterRequestDto model)
    {
        var existingUser = await _userManager.FindByEmailAsync(model.Email);
        if (existingUser != null)
            return new ServiceResponse<bool> { Success = false, Message = "Email is already in use", StatusCode = 400 };
        
        var existingUsername = await _userManager.FindByNameAsync(model.Username);
        if (existingUsername != null)
            return new ServiceResponse<bool> { Success = false, Message = "Username is already taken", StatusCode = 400 };

        var user = new User
        {
            UserName = model.Username, 
            Email = model.Email, 
            FullName = model.FullName
        };
        
        var result = await _userManager.CreateAsync(user, model.Password);

        if (!result.Succeeded)
            return new ServiceResponse<bool> { Success = false, Message = result.Errors.First().Description, StatusCode = 400 };

        if (await _roleManager.RoleExistsAsync("User"))
            await _userManager.AddToRoleAsync(user, "User");

        return new ServiceResponse<bool> { Success = true, Message = "User registered successfully", StatusCode = 201 };
    }
    
    public async Task<ServiceResponse<LoginDto>> LoginAsync(LoginRequestDto model)
    {
        var user = await _userManager.FindByNameAsync(model.UsernameOrEmail) ?? 
                   await _userManager.FindByEmailAsync(model.UsernameOrEmail);
        
        if (user == null || !await _userManager.CheckPasswordAsync(user, model.Password))
            return new ServiceResponse<LoginDto> { Success = false, Message = "Invalid credentials", StatusCode = 401 };
        
        if (user.IsBlocked)
            return new ServiceResponse<LoginDto> { Success = false, Message = "User account is deactivated", StatusCode = 403 };

        if (!user.EmailConfirmed)
            return new ServiceResponse<LoginDto> { Success = false, Message = "Email is not verified", StatusCode = 403 };

        var token = await _tokenService.GenerateTokenAsync(user);
        var refreshToken = _tokenService.GenerateRefreshToken();
        
        int.TryParse(_configuration["JwtSettings:RefreshTokenExpirationDays"] ?? "7", out int refreshTokenValidityInDays);
        
        user.RefreshToken = refreshToken;
        user.RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(refreshTokenValidityInDays);
        await _userManager.UpdateAsync(user);

        return new ServiceResponse<LoginDto> {
            Success = true,
            Message = "Login successful",
            Data = new LoginDto(){ 
                Token = token, 
                RefreshToken = refreshToken, 
                User = user,
                RefreshTokenValidityInDays = refreshTokenValidityInDays
            }
        };
    }

    public async Task<ServiceResponse<bool>> SendSignupOtpAsync(SendOtpRequestDto model)
    {
        var existingUser = await _userManager.FindByEmailAsync(model.Email);
        if (existingUser != null)
            return new ServiceResponse<bool> { Success = false, Message = "Email is already in use", StatusCode = 400 };

        var existingUsername = await _userManager.FindByNameAsync(model.Username);
        if (existingUsername != null)
            return new ServiceResponse<bool> { Success = false, Message = "Username is already taken", StatusCode = 400 };

        var now = DateTime.UtcNow;
        var otp = RandomNumberGenerator.GetInt32(0, 1_000_000).ToString("D6");
        var otpHash = AuthHelper.Sha256Hex(otp);

        var dummyUser = new User { UserName = model.Username, Email = model.Email };
        var passwordHash = _passwordHasher.HashPassword(dummyUser, model.Password);

        var existingPending = await _emailOtpRepository.GetLatestActiveAsync(model.Email, "signup", now);

        if (existingPending != null)
        {
            existingPending.OtpHash = otpHash;
            existingPending.Username = model.Username;
            existingPending.FullName = model.FullName;
            existingPending.PasswordHash = passwordHash;
            existingPending.Attempts = 0;
            existingPending.CreatedAt = now;
            existingPending.ExpiresAt = now.AddMinutes(10);
            _emailOtpRepository.Update(existingPending);
        }
        else
        {
            await _emailOtpRepository.AddAsync(new EmailOtp
            {
                Email = model.Email,
                Username = model.Username,
                FullName = model.FullName,
                PasswordHash = passwordHash,
                OtpHash = otpHash,
                Purpose = "signup",
                Attempts = 0,
                CreatedAt = now,
                ExpiresAt = now.AddMinutes(10)
            });
        }

        await _emailOtpRepository.SaveChangesAsync();

        await _emailSender.SendAsync(
            model.Email,
            "Instory verification code",
            $"Your verification code is: {otp}\n\nThis code expires in 10 minutes."
        );

        return new ServiceResponse<bool> { Success = true, Message = "OTP sent successfully", StatusCode = 200, Data = true };
    }

    public async Task<ServiceResponse<bool>> VerifySignupOtpAsync(VerifyOtpRequestDto model)
    {
        var now = DateTime.UtcNow;
        var pending = await _emailOtpRepository.GetLatestUnconsumedAsync(model.Email, "signup");

        if (pending == null)
            return new ServiceResponse<bool> { Success = false, Message = "No OTP request found", StatusCode = 404 };

        if (pending.ExpiresAt <= now)
            return new ServiceResponse<bool> { Success = false, Message = "OTP expired", StatusCode = 400 };

        if (pending.Attempts >= 5)
            return new ServiceResponse<bool> { Success = false, Message = "Too many attempts", StatusCode = 429 };

        var providedHash = AuthHelper.Sha256Hex(model.OtpCode);
        if (!AuthHelper.FixedTimeEquals(pending.OtpHash, providedHash))
        {
            pending.Attempts += 1;
            _emailOtpRepository.Update(pending);
            await _emailOtpRepository.SaveChangesAsync();
            return new ServiceResponse<bool> { Success = false, Message = "Invalid OTP", StatusCode = 400 };
        }

        var existingUser = await _userManager.FindByEmailAsync(pending.Email);
        if (existingUser != null)
            return new ServiceResponse<bool> { Success = false, Message = "Email is already in use", StatusCode = 400 };

        var existingUsername = await _userManager.FindByNameAsync(pending.Username);
        if (existingUsername != null)
            return new ServiceResponse<bool> { Success = false, Message = "Username is already taken", StatusCode = 400 };

        var user = new User
        {
            UserName = pending.Username,
            Email = pending.Email,
            FullName = pending.FullName,
            EmailConfirmed = true,
            PasswordHash = pending.PasswordHash
        };

        var result = await _userManager.CreateAsync(user);
        if (!result.Succeeded)
            return new ServiceResponse<bool> { Success = false, Message = result.Errors.First().Description, StatusCode = 400 };

        if (await _roleManager.RoleExistsAsync("User"))
            await _userManager.AddToRoleAsync(user, "User");

        pending.ConsumedAt = now;
        _emailOtpRepository.Update(pending);
        await _emailOtpRepository.SaveChangesAsync();

        return new ServiceResponse<bool> { Success = true, Message = "Email verified and account created", StatusCode = 201, Data = true };
    }

    public async Task<ServiceResponse<LoginDto>> GoogleLoginAsync(GoogleLoginRequestDto model)
    {
        var clientId = _configuration["Google:ClientId"];
        if (string.IsNullOrWhiteSpace(clientId))
            return new ServiceResponse<LoginDto> { Success = false, Message = "Google auth is not configured", StatusCode = 500 };

        GoogleJsonWebSignature.Payload payload;
        try
        {
            payload = await GoogleJsonWebSignature.ValidateAsync(model.IdToken, new GoogleJsonWebSignature.ValidationSettings
            {
                Audience = new[] { clientId }
            });
        }
        catch
        {
            return new ServiceResponse<LoginDto> { Success = false, Message = "Invalid Google token", StatusCode = 401 };
        }

        if (string.IsNullOrWhiteSpace(payload.Email))
            return new ServiceResponse<LoginDto> { Success = false, Message = "Google token missing email", StatusCode = 400 };

        var user = await _userManager.FindByEmailAsync(payload.Email);
        if (user == null)
        {
            var baseUsername = AuthHelper.MakeUsernameFromEmail(payload.Email);
            var username = await EnsureUniqueUsernameAsync(baseUsername);

            user = new User
            {
                UserName = username,
                Email = payload.Email,
                FullName = payload.Name,
                AvatarUrl = payload.Picture,
                EmailConfirmed = payload.EmailVerified
            };

            var createResult = await _userManager.CreateAsync(user);
            if (!createResult.Succeeded)
                return new ServiceResponse<LoginDto> { Success = false, Message = createResult.Errors.First().Description, StatusCode = 400 };

            if (await _roleManager.RoleExistsAsync("User"))
                await _userManager.AddToRoleAsync(user, "User");
        }

        if (user.IsBlocked)
            return new ServiceResponse<LoginDto> { Success = false, Message = "User account is deactivated", StatusCode = 403 };

        var logins = await _userManager.GetLoginsAsync(user);
        var hasGoogleLogin = logins.Any(l => l.LoginProvider == "Google");
        if (!hasGoogleLogin)
        {
            var addLogin = await _userManager.AddLoginAsync(user, new UserLoginInfo("Google", payload.Subject, "Google"));
            if (!addLogin.Succeeded)
                return new ServiceResponse<LoginDto> { Success = false, Message = addLogin.Errors.First().Description, StatusCode = 400 };
        }

        if (!user.EmailConfirmed && payload.EmailVerified)
        {
            user.EmailConfirmed = true;
            await _userManager.UpdateAsync(user);
        }

        var token = await _tokenService.GenerateTokenAsync(user);
        var refreshToken = _tokenService.GenerateRefreshToken();
        int.TryParse(_configuration["JwtSettings:RefreshTokenExpirationDays"] ?? "7", out int refreshTokenValidityInDays);

        user.RefreshToken = refreshToken;
        user.RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(refreshTokenValidityInDays);
        await _userManager.UpdateAsync(user);

        return new ServiceResponse<LoginDto>
        {
            Success = true,
            Message = "Login successful",
            Data = new LoginDto
            {
                Token = token,
                RefreshToken = refreshToken,
                User = user,
                RefreshTokenValidityInDays = refreshTokenValidityInDays
            }
        };
    }

    public async Task<ServiceResponse<LoginDto>> RefreshTokenAsync(string refreshToken)
    {
        var user = await _userRepository.GetUserByRefreshTokenAsync(refreshToken);

        if (user == null || user.RefreshTokenExpiryTime <= DateTime.UtcNow)
        {
            return new ServiceResponse<LoginDto> { Success = false, Message = "Invalid or expired refresh token", StatusCode = 401 };
        }
        
        if (user.IsBlocked)
        {
            return new ServiceResponse<LoginDto> { Success = false, Message = "User account is deactivated", StatusCode = 403 };
        }

        var newAccessToken = await _tokenService.GenerateTokenAsync(user);
        var newRefreshToken = _tokenService.GenerateRefreshToken();

        int.TryParse(_configuration["JwtSettings:RefreshTokenExpirationDays"] ?? "7", out int refreshTokenValidityInDays);

        user.RefreshToken = newRefreshToken;
        user.RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(refreshTokenValidityInDays);

        await _userManager.UpdateAsync(user);
        
        return new ServiceResponse<LoginDto>
        {
            Success = true,
            Message = "Token refreshed successfully",
            Data = new LoginDto
            {
                Token = newAccessToken,
                RefreshToken = newRefreshToken,
                User = user,
                RefreshTokenValidityInDays = refreshTokenValidityInDays
            }
        };
    }

    public async Task<ServiceResponse<User>> GetCurrentUserAsync(string userName)
    {
        var user = await _userManager.FindByNameAsync(userName);
        if (user == null) return new ServiceResponse<User>() { Success = false, Message = "User not found", StatusCode = 404 };
        
        if (user.IsBlocked) return new ServiceResponse<User>() { Success = false, Message = "User account is deactivated", StatusCode = 403 };
        
        return new ServiceResponse<User>() { Success = true, Data = user, StatusCode = 200, Message = "User retrieved successfully" };
    }

    private async Task<string> EnsureUniqueUsernameAsync(string baseUsername)
    {
        var candidate = baseUsername;
        var suffix = 0;
        while (await _userManager.FindByNameAsync(candidate) != null)
        {
            suffix++;
            candidate = (baseUsername.Length > 16 ? baseUsername[..16] : baseUsername) + suffix.ToString();
        }
        return candidate;
    }
}
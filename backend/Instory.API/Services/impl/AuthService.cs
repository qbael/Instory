using System;
using System.Linq;
using System.Threading.Tasks;
using Instory.API.DTOs;
using Instory.API.DTOs.Auth;
using Instory.API.Helpers;
using Instory.API.Models;
using Instory.API.Repositories;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;

namespace Instory.API.Services.impl;

public class AuthService : IAuthService
{
    private readonly UserManager<User> _userManager;
    private readonly RoleManager<Role> _roleManager;
    private readonly ITokenService _tokenService;
    private readonly IConfiguration _configuration;
    private readonly IUserRepository _userRepository;
    
    public AuthService(
        UserManager<User> userManager,
        RoleManager<Role> roleManager,
        ITokenService tokenService,
        IConfiguration configuration,
        IUserRepository userRepository)
    {
        _userManager = userManager;
        _roleManager = roleManager;
        _tokenService = tokenService;
        _configuration = configuration;
        _userRepository = userRepository;
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

        var token = await _tokenService.GenerateTokenAsync(user);
        var refreshToken = _tokenService.GenerateRefreshToken();
        
        int.TryParse(_configuration["JwtSettings:RefreshTokenExpirationDays"] ?? "7", out int refreshTokenValidityInDays);
        
        user.RefreshToken = refreshToken;
        user.RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(7);
        await _userManager.UpdateAsync(user);

        return new ServiceResponse<LoginDto> {
            Success = true,
            Message = "Login successful",
            Data = new LoginDto(){ 
                Token = token, 
                RefreshToken = refreshToken, 
                User = user,
                ReshTokenValidityInDays = refreshTokenValidityInDays
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
                ReshTokenValidityInDays = refreshTokenValidityInDays
            }
        };
    }

    public async Task<ServiceResponse<User>> GetCurrentUserAsync(string userName)
    {
        var user = await _userManager.FindByNameAsync(userName);
        if (user == null) return new ServiceResponse<User>() { Success = false, Message = "User not found", StatusCode = 404 };
        
        return new ServiceResponse<User>() { Success = true, Data = user, StatusCode = 200, Message = "User retrieved successfully" };
    }
}
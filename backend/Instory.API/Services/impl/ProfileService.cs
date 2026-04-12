using System.ComponentModel.DataAnnotations;
using System.Threading.Tasks;
using Instory.API.DTOs.Profile;
using Instory.API.Exceptions;
using Instory.API.Helpers;
using Instory.API.Models;
using Instory.API.Repositories;
using Microsoft.AspNetCore.Identity;

namespace Instory.API.Services.impl;

public class ProfileService : IProfileService
{
    private readonly IUserRepository _userRepository;
    private readonly UserManager<User> _userManager;
    
    public ProfileService(IUserRepository userRepository, UserManager<User> userManager)
    {
        _userRepository = userRepository;
        _userManager = userManager;
    }

    public async Task<UserProfileDto> GetByIdAsync(int id, int currentUserId)
    {
        var user = await _userRepository.GetByIdWithDetailsAsync(id)
                      ?? throw new NotFoundException($"Profile not found with id: {id}");

        return UserProfileDto.FromUser(user, currentUserId);
    }

    public async Task<UserProfileDto> GetByUsernameAsync(string username, int currentUserId)
    {
        var user = await _userRepository.GetByUsernameAsync(username)
                      ?? throw new NotFoundException($"Profile not found with username: {username}");
        
        return UserProfileDto.FromUser(user, currentUserId);
    }
    
    public async Task<UserProfileDto> UpdateAsync(int id, UpdateProfileDto dto)
    {
        var user = await _userRepository.GetByIdWithDetailsAsync(id)
                      ?? throw new NotFoundException($"Profile not found with id: {id}");
        
        if (dto.UserName is not null)
        {
            var existingUserName = await _userManager.FindByNameAsync(dto.UserName);
            if (existingUserName is not null  && existingUserName.Id != id)
                throw new ValidationException("Username already exists");
            
            await _userManager.SetUserNameAsync(user, dto.UserName);
        }
 
        if (dto.FullName is not null) user.FullName = dto.FullName;
        if (dto.Bio is not null) user.Bio = dto.Bio;
        if (dto.AvatarUrl is not null) user.AvatarUrl = dto.AvatarUrl;
        
        _userRepository.Update(user);
        await _userRepository.SaveChangesAsync();
        return UserProfileDto.FromUser(user, id);
    }
}
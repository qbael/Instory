using System.Threading.Tasks;
using Instory.API.DTOs.Profile;
using Instory.API.Helpers;

namespace Instory.API.Services;

public interface IProfileService
{
    Task<UserProfileDto> GetByIdAsync(int id, int currentUserId);
    Task<UserProfileDto> GetByUsernameAsync(string username, int currentUserId);
    Task<UserProfileDto> UpdateAsync(int id, UpdateProfileDto dto);
}
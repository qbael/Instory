using System.Security.Claims;
using Instory.API.DTOs.Profile;
using Instory.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Instory.API.Controllers;

[ApiController]
[Route("/api/v1/profile")]
public class ProfileController : ControllerBase
{
    private readonly IProfileService _profileService;

    public ProfileController(IProfileService profileService)
    {
        _profileService = profileService;
    }

    [Authorize]
    [HttpGet("id/{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var currentUserId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var profile = await _profileService.GetByIdAsync(id, currentUserId);
        return Ok(profile);
    }

    [Authorize]
    [HttpGet("{username}")]
    public async Task<IActionResult> GetByUsername(string username)
    {
        var currentUserId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var profile = await _profileService.GetByUsernameAsync(username, currentUserId);
        return Ok(profile);
    }

    [Authorize]
    [HttpPatch("me")]
    public async Task<IActionResult> Update(UpdateProfileDto dto)
    {
        var id = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var profile = await _profileService.UpdateAsync(id, dto);
        return Ok(profile);
    }
}

using System.Security.Claims;
using System.Threading.Tasks;
using Instory.API.DTOs.Friendship;
using Instory.API.Models.Enums;
using Instory.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Instory.API.Controllers;

[ApiController]
[Route("api/v1/friendship")]
[Authorize]
public class FriendshipController : ControllerBase
{
    private readonly IFriendshipService _friendshipService;

    public FriendshipController(IFriendshipService friendshipService)
    {
        _friendshipService = friendshipService;
    }

    [HttpPost("{userId}/friend-request")]
    public async Task<IActionResult> SendFriendRequest(int userId)
    {
        var currentUserId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var result = await _friendshipService.SendRequestAsync(currentUserId, userId);
        return Ok(result);
    }

    [HttpDelete("{userId}/friend-request")]
    public async Task<IActionResult> CancelFriendRequest(int userId)
    {
        var currentUserId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        await _friendshipService.CancelRequestAsync(currentUserId, userId);
        return NoContent();
    }

    [HttpDelete("{userId}/friend")]
    public async Task<IActionResult> Unfriend(int userId)
    {
        var currentUserId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        await _friendshipService.UnfriendAsync(currentUserId, userId);
        return NoContent();
    }

    [HttpPatch("{id}")]
    public async Task<IActionResult> Respond(int id, [FromBody] RespondFriendshipDto dto)
    {
        var currentUserId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var accept = dto.Status == FriendshipStatus.Accepted;
        await _friendshipService.RespondAsync(id, currentUserId, accept);
        return NoContent();
    }

    [HttpPatch("{requesterId}/respond")]
    public async Task<IActionResult> RespondByRequesterId(int requesterId, [FromBody] RespondFriendshipDto dto)
    {
        var currentUserId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var accept = dto.Status == FriendshipStatus.Accepted;
        await _friendshipService.RespondByRequesterIdAsync(currentUserId, requesterId, accept);
        return NoContent();
    }

    [HttpGet("requests")]
    public async Task<IActionResult> GetPendingRequests()
    {
        var currentUserId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var result = await _friendshipService.GetPendingRequestsAsync(currentUserId);
        return Ok(result);
    }

    [HttpGet("sent")]
    public async Task<IActionResult> GetSentRequests()
    {
        var currentUserId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var result = await _friendshipService.GetSentPendingRequestsAsync(currentUserId);
        return Ok(result);
    }
}

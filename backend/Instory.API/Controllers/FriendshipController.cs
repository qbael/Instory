using Instory.API.DTOs.Friendship;
using Instory.API.DTOs.Story;
using Instory.API.Services;
using Microsoft.AspNetCore.Mvc;

namespace Instory.API.Controllers;


[ApiController]
[Route("/api/v1/friendship")]
public class FriendshipController : ControllerBase
{
    private readonly IFriendshipService _friendshipService;

    public FriendshipController(IFriendshipService friendshipService)
    {
        _friendshipService = friendshipService;
    }

    [HttpPost("/send")]
    public async Task<IActionResult> SendRequest([FromBody] FriendshipRequestDto dto)
    {
        var result = await _friendshipService.SendRequestAsync(dto);
        return Ok(result);
    }

    [HttpDelete("/cancle")]
    public async Task<IActionResult> CancelRequestAsync([FromBody] FriendshipRequestDto dto)
    {
        var result = await _friendshipService.CancelRequestAsync(dto);
        return Ok(result);
    }

    [HttpPatch("/respond")]
    public async Task<IActionResult> Respond([FromBody] FriendshipRequestDto dto)
    {
        var result = await _friendshipService.RespondAsync(dto);
        return Ok(result);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        await _friendshipService.DeleteByIdAsync(id);
        return NoContent();
    }
}
using System.Security.Claims;

public static class ClaimsPrincipalExtensions
{
    public static int GetUserId(this ClaimsPrincipal user)
    {
        var id = user.FindFirst(ClaimTypes.NameIdentifier)?.Value
                 ?? user.FindFirst("id")?.Value;

        return int.TryParse(id, out var userId) ? userId : 0;
    }
}
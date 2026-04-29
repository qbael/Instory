public class UserDTO
{
    public int? Id { get; set; }
    public string? UserName { get; set; } = string.Empty;
    public string? AvatarUrl { get; set; } = string.Empty;
    public string? FullName { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }

    public static UserDTO FromEntity(Instory.API.Models.User u) => new()
    {
        Id = u.Id,
        UserName = u.UserName ?? string.Empty,
        AvatarUrl = u.AvatarUrl,
        FullName = u.FullName,
        CreatedAt = u.CreatedAt,
    };
}
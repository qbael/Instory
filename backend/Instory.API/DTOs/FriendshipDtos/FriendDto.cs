namespace Instory.API.DTOs.Friendship;

public record FriendDto(
    int Id,
    string? UserName,
    string? FullName,
    string? AvatarUrl
);

using Instory.API.Models.Enums;

namespace Instory.API.DTOs.Friendship;

public record FriendshipResponseDto(
    int Id,
    int RequesterId,
    int AddresseeId,
    FriendshipStatus Status
)
{
    public static FriendshipResponseDto FromEntity(Models.Friendship friendship) => new(
        friendship.Id,
        friendship.RequesterId,
        friendship.AddresseeId,
        friendship.Status
    );
}
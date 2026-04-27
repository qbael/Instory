namespace Instory.API.DTOs.Friendship;

public record FriendshipRequestDto(
    int RequesterId,
    int AddresseeId,
    bool? Accept
);
using System;
using System.Linq;
using Instory.API.Models;
using Instory.API.Models.Enums;

namespace Instory.API.DTOs.Profile;

public record UserProfileDto
{
    public int Id { get; init; }
    public string? UserName { get; init; }
    public string? FullName { get; init; }
    public string? Bio { get; init; }
    public string? AvatarUrl { get; init; }
    public int PostsCount { get; init; }
    public int FriendsCount { get; init; }
    public FriendshipStatus? FriendshipStatus { get; init; }
    public int? FriendshipRequestId { get; init; }
    public bool? IsRequester { get; init; }
    public DateTime CreatedAt { get; init; }

    public static UserProfileDto FromUser(User user, int currentUserId)
    {
        var friendsCount = user.SentFriendRequests
                               .Count(f => f.Status == Models.Enums.FriendshipStatus.Accepted)
                           + user.ReceivedFriendRequests
                               .Count(f => f.Status == Models.Enums.FriendshipStatus.Accepted);

        var (status, requestId, isRequester) = GetRelationshipDetails(user, currentUserId);

        return new UserProfileDto
        {
            Id = user.Id,
            UserName = user.UserName,
            FullName = user.FullName,
            Bio = user.Bio,
            AvatarUrl = user.AvatarUrl,
            PostsCount = user.Posts.Count,
            FriendsCount = friendsCount,
            FriendshipStatus = status,
            FriendshipRequestId = requestId,
            IsRequester = isRequester,
            CreatedAt = user.CreatedAt
        };
    }

    private static (FriendshipStatus? status, int? requestId, bool? isRequester) GetRelationshipDetails(User user, int currentUserId)
    {
        if (user.Id == currentUserId) return (null, null, null);

        // profile user sent request TO current user → current user is addressee (not requester)
        var sent = user.SentFriendRequests
            .FirstOrDefault(f => f.AddresseeId == currentUserId);
        if (sent != null) return (sent.Status, sent.Id, false);

        // current user sent request TO profile user → current user is requester
        var received = user.ReceivedFriendRequests
            .FirstOrDefault(f => f.RequesterId == currentUserId);
        if (received != null) return (received.Status, received.Id, true);

        return (null, null, null);
    }
}
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
    public DateTime CreatedAt { get; init; }

    public static UserProfileDto FromUser(User user, int currentUserId)
    {
        var friendsCount = user.SentFriendRequests
                               .Count(f => f.Status == Models.Enums.FriendshipStatus.ACCEPTED)
                           + user.ReceivedFriendRequests
                               .Count(f => f.Status == Models.Enums.FriendshipStatus.ACCEPTED);

        return new UserProfileDto
        {
            Id = user.Id,
            UserName = user.UserName,
            FullName = user.FullName,
            Bio = user.Bio,
            AvatarUrl = user.AvatarUrl,
            PostsCount = user.Posts.Count,
            FriendsCount = friendsCount,
            FriendshipStatus = GetRelationshipStatus(user, currentUserId),
            CreatedAt = user.CreatedAt
        };
    }
    private static FriendshipStatus? GetRelationshipStatus(User user, int currentUserId)
    {
        if (user.Id == currentUserId) return null;

        var sent = user.SentFriendRequests
            .FirstOrDefault(f => f.AddresseeId == currentUserId);

        var received = user.ReceivedFriendRequests
            .FirstOrDefault(f => f.RequesterId == currentUserId);

        return sent?.Status ?? received?.Status;
    }
}
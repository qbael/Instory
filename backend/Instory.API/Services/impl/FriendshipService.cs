using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Instory.API.DTOs.Friendship;
using Instory.API.Exceptions;
using Instory.API.Models;
using Instory.API.Models.Enums;
using Instory.API.Repositories;

namespace Instory.API.Services.impl;

public class FriendshipService : IFriendshipService
{
    private readonly IFriendshipRepository _friendshipRepository;
    private readonly INotificationService _notificationService;
    private readonly IChatService _chatService;

    public FriendshipService(IFriendshipRepository friendshipRepository, INotificationService notificationService, IChatService chatService)
    {
        _friendshipRepository = friendshipRepository;
        _notificationService = notificationService;
        _chatService = chatService;
    }

    public async Task<FriendshipResponseDto> SendRequestAsync(int requesterId, int addresseeId)
    {
        var friendship = new Friendship
        {
            RequesterId = requesterId,
            AddresseeId = addresseeId
        };

        await _friendshipRepository.AddAsync(friendship);
        await _friendshipRepository.SaveChangesAsync();

        await TrySendNotification(() => _notificationService.CreateAndSendAsync(
            addresseeId, requesterId,
            NotificationType.FriendRequestReceived.ToString(),
            friendship.Id,
            "sent you a friend request"));

        return FriendshipResponseDto.FromEntity(friendship);
    }

    public async Task CancelRequestAsync(int requesterId, int addresseeId)
    {
        var friendship = await _friendshipRepository.GetBetweenUsersAsync(requesterId, addresseeId)
                    ?? throw new NotFoundException("Friendship not found");

        _friendshipRepository.Remove(friendship);
        await _friendshipRepository.SaveChangesAsync();
    }

    public async Task RespondAsync(int friendshipId, int currentUserId, bool accept)
    {
        var friendship = await _friendshipRepository.GetByIdAsync(friendshipId)
                         ?? throw new NotFoundException("Friendship not found");

        friendship.Status = accept ? FriendshipStatus.Accepted : FriendshipStatus.Declined;
        await _friendshipRepository.SaveChangesAsync();

        if (accept)
        {
            await TrySendNotification(() => _notificationService.CreateAndSendAsync(
                friendship.RequesterId, currentUserId,
                NotificationType.FriendRequestAccepted.ToString(),
                friendshipId,
                "accepted your friend request"));

            await TryCreateFriendChat(currentUserId, friendship.RequesterId);
        }
    }

    public async Task RespondByRequesterIdAsync(int currentUserId, int requesterId, bool accept)
    {
        var friendship = await _friendshipRepository.GetBetweenUsersAsync(requesterId, currentUserId)
                         ?? throw new NotFoundException("Friendship not found");

        if (friendship.AddresseeId != currentUserId)
            throw new UnauthorizedAccessException("You are not the recipient of this request");

        friendship.Status = accept ? FriendshipStatus.Accepted : FriendshipStatus.Declined;
        await _friendshipRepository.SaveChangesAsync();

        if (accept)
        {
            await TrySendNotification(() => _notificationService.CreateAndSendAsync(
                requesterId, currentUserId,
                NotificationType.FriendRequestAccepted.ToString(),
                friendship.Id,
                "accepted your friend request"));

            await TryCreateFriendChat(currentUserId, requesterId);
        }
    }

    public async Task UnfriendAsync(int userId1, int userId2)
    {
        var friendship = await _friendshipRepository.GetBetweenUsersAsync(userId1, userId2)
                         ?? throw new NotFoundException("Friendship not found");

        _friendshipRepository.Remove(friendship);
        await _friendshipRepository.SaveChangesAsync();
    }

    public async Task<List<FriendshipResponseDto>> GetPendingRequestsAsync(int userId)
    {
        var friendships = await _friendshipRepository.GetPendingRequestsAsync(userId);
        return friendships.Select(FriendshipResponseDto.FromEntity).ToList();
    }

    public async Task<List<FriendshipResponseDto>> GetSentPendingRequestsAsync(int userId)
    {
        var friendships = await _friendshipRepository.GetSentPendingRequestsAsync(userId);
        return friendships.Select(FriendshipResponseDto.FromEntity).ToList();
    }

    private static async Task TrySendNotification(Func<Task> send)
    {
        try { await send(); }
        catch { /* notification failure must not break the main operation */ }
    }

    private async Task TryCreateFriendChat(int acceptorId, int requesterId)
    {
        try
        {
            var chat = await _chatService.GetOrCreateDirectChatAsync(acceptorId, requesterId);
            await _chatService.SendMessageAsync(acceptorId, chat.Id, "Chúng ta đã là bạn bè! 👋");
        }
        catch { /* chat creation must not break the main operation */ }
    }
}

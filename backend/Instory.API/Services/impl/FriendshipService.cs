using Instory.API.DTOs.Friendship;
using Instory.API.Exceptions;
using Instory.API.Models;
using Instory.API.Models.Enums;
using Instory.API.Repositories;

namespace Instory.API.Services.impl;

public class FriendshipService : IFriendshipService
{
    private readonly IFriendshipRepository _friendshipRepository;

    public FriendshipService(IFriendshipRepository friendshipRepository)
    {
        _friendshipRepository = friendshipRepository;    
    }

    public async Task<FriendshipResponseDto> SendRequestAsync(FriendshipRequestDto dto)
    {
        var friendship = new Friendship
        {
            RequesterId = dto.RequesterId,
            AddresseeId = dto.AddresseeId
        };
        
        await _friendshipRepository.AddAsync(friendship);
        await _friendshipRepository.SaveChangesAsync();
        return FriendshipResponseDto.FromEntity(friendship);
    }

    public async Task CancelRequestAsync(FriendshipRequestDto dto)
    {
        var friendship = await _friendshipRepository.GetBetweenUsersAsync(dto.RequesterId, dto.AddresseeId)
                    ?? throw new NotFoundException($"Friendship not found");
        
        _friendshipRepository.Remove(friendship);
        await _friendshipRepository.SaveChangesAsync();
    }

    public async Task RespondAsync(int friendshipId, int currentUserId, bool accept)
    {
        var friendship = await _friendshipRepository.GetByIdAsync(friendshipId)
                         ?? throw new NotFoundException($"Friendship not found");

        if (accept)
        {
            friendship.Status = FriendshipStatus.Accepted;
        }
        
        else if (!accept)
        {
            friendship.Status = FriendshipStatus.Declined;
        }
        
        await _friendshipRepository.SaveChangesAsync();
    }
    
    public async Task UnfriendAsync(int userId1, int userId2)
    {
        var friendship = await _friendshipRepository.GetBetweenUsersAsync(userId1, userId2)
                         ?? throw new NotFoundException($"Friendship not found");
        
        _friendshipRepository.Remove(friendship);
        await _friendshipRepository.SaveChangesAsync();
        
    }
    
    public async Task<List<FriendshipResponseDto>> GetPendingRequestsAsync(int userId)
    {
        var friendships = await _friendshipRepository.GetPendingRequestsAsync(userId);

    }
    
    public async Task<List<FriendshipResponseDto>> GetSentPendingRequestsAsync(int userId)
    {
        var friendships = await _friendshipRepository.GetSentPendingRequestsAsync(userId);

        
    }
}
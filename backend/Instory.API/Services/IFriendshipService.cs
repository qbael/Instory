using System.Collections.Generic;
using System.Threading.Tasks;
using Instory.API.DTOs.Friendship;

namespace Instory.API.Services;

public interface IFriendshipService
{
    Task<FriendshipResponseDto> SendRequestAsync(int requesterId, int addresseeId);
    Task CancelRequestAsync(int requesterId, int addresseeId);
    Task RespondAsync(int friendshipId, int currentUserId, bool accept);
    Task UnfriendAsync(int userId1, int userId2);
    Task<List<FriendshipResponseDto>> GetPendingRequestsAsync(int userId);
    Task<List<FriendshipResponseDto>> GetSentPendingRequestsAsync(int userId);
}

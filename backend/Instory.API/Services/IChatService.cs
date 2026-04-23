using System.Collections.Generic;
using System.Threading.Tasks;
using Instory.API.Models;
using Microsoft.AspNetCore.Http;

namespace Instory.API.Services;

public interface IChatService
{
    Task<Chat> CreateGroupChatAsync(string name, List<int> participantIds);
    Task<Chat> GetOrCreateDirectChatAsync(int user1Id, int user2Id);
    Task<Message> SendMessageAsync(int senderId, int chatId, string? content, IFormFile? file = null);
    Task<IEnumerable<Chat>> GetUserChatsAsync(int userId);
    Task<IEnumerable<Message>> GetChatMessagesAsync(int chatId, int userId);
    Task<IEnumerable<int>> GetParticipantIdsAsync(int chatId);
}

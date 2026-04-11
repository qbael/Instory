using Instory.API.Models;

namespace Instory.API.Repositories;

public interface IChatRepository : IRepository<Chat>
{
    Task<Chat?> GetDirectChatAsync(int user1Id, int user2Id);
    Task<ChatParticipant?> GetParticipantAsync(int chatId, int userId);
    Task<bool> IsParticipantAsync(int chatId, int userId);
    Task AddMessageAsync(Message message);
    Task LoadMessageSenderAsync(Message message);
    Task<IEnumerable<Chat>> GetUserChatsAsync(int userId);
    Task<IEnumerable<Message>> GetChatMessagesAsync(int chatId);
    Task<IEnumerable<int>> GetParticipantIdsAsync(int chatId);
}

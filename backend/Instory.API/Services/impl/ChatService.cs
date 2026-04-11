using Instory.API.Hubs;
using Instory.API.Models;
using Instory.API.Repositories;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.SignalR;

namespace Instory.API.Services.impl;

public class ChatService : IChatService
{
    private readonly IChatRepository _chatRepository;
    private readonly IMediaService _mediaService;
    private readonly IHubContext<ChatHub> _hubContext;

    public ChatService(IChatRepository chatRepository, IMediaService mediaService, IHubContext<ChatHub> hubContext)
    {
        _chatRepository = chatRepository;
        _mediaService = mediaService;
        _hubContext = hubContext;
    }

    public async Task<Chat> CreateGroupChatAsync(string name, List<int> participantIds)
    {
        var chat = new Chat
        {
            Name = name,
            Type = ChatType.Group,
            Participants = participantIds.Select(id => new ChatParticipant { UserId = id }).ToList()
        };

        await _chatRepository.AddAsync(chat);
        await _chatRepository.SaveChangesAsync();
        return chat;
    }

    public async Task<Chat> GetOrCreateDirectChatAsync(int user1Id, int user2Id)
    {
        var existingChat = await _chatRepository.GetDirectChatAsync(user1Id, user2Id);

        if (existingChat != null)
            return existingChat;

        var chat = new Chat
        {
            Type = ChatType.Direct,
            Participants = new List<ChatParticipant>
            {
                new ChatParticipant { UserId = user1Id },
                new ChatParticipant { UserId = user2Id }
            }
        };

        await _chatRepository.AddAsync(chat);
        await _chatRepository.SaveChangesAsync();
        return chat;
    }

    public async Task<Message> SendMessageAsync(int senderId, int chatId, string? content, IFormFile? file = null)
    {
        var isParticipant = await _chatRepository.IsParticipantAsync(chatId, senderId);

        if (!isParticipant)
            throw new Exception("User is not a participant of this chat.");

        string? mediaUrl = null;
        if (file != null)
        {
            mediaUrl = await _mediaService.UploadFileAsync(file, "chat-media");
        }

        var message = new Message
        {
            ChatId = chatId,
            SenderId = senderId,
            Content = content ?? string.Empty,
            MediaUrl = mediaUrl
        };

        await _chatRepository.AddMessageAsync(message);
        await _chatRepository.SaveChangesAsync();
        
        await _chatRepository.LoadMessageSenderAsync(message);

        var participantIds = await GetParticipantIdsAsync(chatId);
            
        var messageObj = new {
            message.Id,
            message.ChatId,
            message.SenderId,
            SenderName = message.Sender?.FullName,
            SenderAvatar = message.Sender?.AvatarUrl,
            message.Content,
            message.MediaUrl,
            message.CreatedAt
        };

        foreach (var pId in participantIds)
        {
            await _hubContext.Clients.Group(pId.ToString()).SendAsync("ReceiveMessage", messageObj);
        }

        return message;
    }

    public async Task<IEnumerable<Chat>> GetUserChatsAsync(int userId)
    {
        return await _chatRepository.GetUserChatsAsync(userId);
    }

    public async Task<IEnumerable<Message>> GetChatMessagesAsync(int chatId, int userId)
    {
        var isParticipant = await _chatRepository.IsParticipantAsync(chatId, userId);

        if (!isParticipant)
            throw new Exception("Access denied.");

        return await _chatRepository.GetChatMessagesAsync(chatId);
    }

    public async Task<IEnumerable<int>> GetParticipantIdsAsync(int chatId)
    {
        return await _chatRepository.GetParticipantIdsAsync(chatId);
    }
}

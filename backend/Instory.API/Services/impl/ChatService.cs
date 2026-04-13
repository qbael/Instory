using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
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
    private readonly INotificationService _notificationService;

    public ChatService(IChatRepository chatRepository, IMediaService mediaService, IHubContext<ChatHub> hubContext, INotificationService notificationService)
    {
        _chatRepository = chatRepository;
        _mediaService = mediaService;
        _hubContext = hubContext;
        _notificationService = notificationService;
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

            if (pId != senderId)
            {
                _ = TrySendNotification(() => _notificationService.CreateAndSendAsync(
                    pId, senderId,
                    Models.Enums.NotificationType.NewMessage.ToString(),
                    chatId,
                    "sent you a message"));
            }
        }

        return message;
    }

    private static async Task TrySendNotification(Func<Task> send)
    {
        try { await send(); }
        catch { /* notification failure must not break the main operation */ }
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

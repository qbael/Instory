using System.ComponentModel.DataAnnotations;
using System.Security.Claims;
using Instory.API.Services;
using Instory.API.DTOs.ChatDtos;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Instory.API.Controllers;

[Authorize]
[ApiController]
[Route("/api/v1/chat")]
public class ChatController : ControllerBase
{
    private readonly IChatService _chatService;

    public ChatController(IChatService chatService)
    {
        _chatService = chatService;
    }

    private int GetCurrentUserId()
    {
        var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return int.Parse(userIdString ?? "0");
    }

    [HttpGet]
    public async Task<IActionResult> GetUserChats()
    {
        var userId = GetCurrentUserId();
        var chats = await _chatService.GetUserChatsAsync(userId);
        return Ok(chats.Select(c => new ChatResponseDto
        {
            Id = c.Id,
            Type = c.Type.ToString(),
            Name = c.Name,
            Participants = c.Participants.Select(p => new ChatParticipantDto { UserId = p.UserId, FullName = p.User.FullName, AvatarUrl = p.User.AvatarUrl }),
            LastMessage = c.Messages.Select(m => new ChatMessageResponseDto {
                Id = m.Id,
                ChatId = m.ChatId,
                SenderId = m.SenderId,
                SenderName = m.Sender != null ? m.Sender.FullName : null,
                SenderAvatar = m.Sender != null ? m.Sender.AvatarUrl : null,
                Content = m.Content,
                MediaUrl = m.MediaUrl,
                CreatedAt = m.CreatedAt
            }).FirstOrDefault()
        }));
    }

    [HttpGet("{chatId}/messages")]
    public async Task<IActionResult> GetChatMessages(int chatId)
    {
        var userId = GetCurrentUserId();
        try
        {
            var messages = await _chatService.GetChatMessagesAsync(chatId, userId);
            return Ok(messages.Select(m => new ChatMessageResponseDto
            {
                Id = m.Id,
                ChatId = m.ChatId,
                SenderId = m.SenderId,
                SenderName = m.Sender?.FullName,
                SenderAvatar = m.Sender?.AvatarUrl,
                Content = m.Content,
                MediaUrl = m.MediaUrl,
                CreatedAt = m.CreatedAt
            }));
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("direct/{targetUserId}")]
    public async Task<IActionResult> GetOrCreateDirectChat(int targetUserId)
    {
        var userId = GetCurrentUserId();
        var chat = await _chatService.GetOrCreateDirectChatAsync(userId, targetUserId);
        return Ok(new { chat.Id, chat.Type });
    }

    public record CreateGroupChatDto(string Name, List<int> ParticipantIds);

    [HttpPost("group")]
    public async Task<IActionResult> CreateGroupChat([FromBody] CreateGroupChatDto dto)
    {
        var userId = GetCurrentUserId();
        
        var participantIds = new List<int> { userId };
        if (dto.ParticipantIds != null)
        {
            participantIds.AddRange(dto.ParticipantIds);
        }
        
        participantIds = participantIds.Distinct().ToList();

        try
        {
            var chat = await _chatService.CreateGroupChatAsync(dto.Name, participantIds);
            return Ok(new { chat.Id, chat.Type, chat.Name });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    public record SendMessageDto(int ChatId, string Content);

    [HttpPost("message")]
    public async Task<IActionResult> SendMessage([FromBody] SendMessageDto dto)
    {
        var userId = GetCurrentUserId();
        try
        {
            var message = await _chatService.SendMessageAsync(userId, dto.ChatId, dto.Content, null);

            var messageObj = new ChatMessageResponseDto {
                Id = message.Id,
                ChatId = message.ChatId,
                SenderId = message.SenderId,
                SenderName = message.Sender?.FullName,
                SenderAvatar = message.Sender?.AvatarUrl,
                Content = message.Content,
                MediaUrl = message.MediaUrl,
                CreatedAt = message.CreatedAt
            };

            return Ok(messageObj);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("message/media")]
    public async Task<IActionResult> SendMediaMessage([FromForm] [Required] int chatId, [FromForm] string? content, [FromForm] IFormFile file)
    {
        var userId = GetCurrentUserId();
        try
        {
            var message = await _chatService.SendMessageAsync(userId, chatId, content, file);
            
            var messageObj = new ChatMessageResponseDto {
                Id = message.Id,
                ChatId = message.ChatId,
                SenderId = message.SenderId,
                SenderName = message.Sender?.FullName,
                SenderAvatar = message.Sender?.AvatarUrl,
                Content = message.Content,
                MediaUrl = message.MediaUrl,
                CreatedAt = message.CreatedAt
             };

            return Ok(messageObj);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}

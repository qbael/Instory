namespace Instory.API.DTOs.ChatDtos;

public class ChatParticipantDto
{
    public int UserId { get; set; }
    public string? FullName { get; set; }
    public string? AvatarUrl { get; set; }
}

public class ChatMessageResponseDto
{
    public int Id { get; set; }
    public int ChatId { get; set; }
    public int SenderId { get; set; }
    public string? SenderName { get; set; }
    public string? SenderAvatar { get; set; }
    public string? Content { get; set; }
    public string? MediaUrl { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class ChatResponseDto
{
    public int Id { get; set; }
    public string Type { get; set; } = string.Empty;
    public string? Name { get; set; }
    public IEnumerable<ChatParticipantDto> Participants { get; set; } = new List<ChatParticipantDto>();
    public ChatMessageResponseDto? LastMessage { get; set; }
}

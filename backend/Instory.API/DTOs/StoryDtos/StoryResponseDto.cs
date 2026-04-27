using System;

namespace Instory.API.DTOs.StoryDtos;

public record StoryResponseDto(
    int Id,
    int UserId,
    string? MediaUrl,
    string? Caption,
    string MediaType,
    DateTime ExpiresAt,
    DateTime CreatedAt
)
{
    public static StoryResponseDto FromEntity(Models.Story story) => new(
        story.Id,
        story.UserId,
        story.MediaUrl,
        story.Caption,
        story.MediaType.ToString(),
        story.ExpiresAt,
        story.CreatedAt
    );
}

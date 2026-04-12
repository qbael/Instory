using System;

namespace Instory.API.DTOs.StoryDtos;

public record StoryResponseDto(
    int Id,
    int UserId,
    string? MediaUrl,
    string? Caption,
    DateTime ExpiresAt,
    bool IsDeleted
)
{
    public static StoryResponseDto FromEntity(Models.Story story) => new(
        story.Id,
        story.UserId,
        story.MediaUrl,
        story.Caption,
        story.ExpiresAt,
        story.IsDeleted
    );
}
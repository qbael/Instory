using System;
using Instory.API.Models;
namespace Instory.API.DTOs;

public record StoryResponseDto(
    int Id,
    int UserId,
    string? MediaUrl,
    string? Caption,
    DateTime ExpiresAt,
    bool IsDeleted
)
{
    public static StoryResponseDto FromEntity(Story story) => new(
        story.Id,
        story.UserId,
        story.MediaUrl,
        story.Caption,
        story.ExpiresAt,
        story.IsDeleted
    );
}